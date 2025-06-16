package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.InventoryTransactionEntity;
import com.servit.servit.entity.PartEntity;
import com.servit.servit.enumeration.PartEnum;
import com.servit.servit.repository.InventoryTransactionRepository;
import com.servit.servit.repository.PartRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class that handles inventory workflow integrations with other system components.
 * Implements the connections described in use cases 3.1, 3.3, and 4.4.
 */
@Service
@Transactional
public class InventoryWorkflowService {

    private final PartRepository partRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final PartService partService;
    private final AlertService alertService;

    @Autowired
    public InventoryWorkflowService(PartRepository partRepository, 
                                   InventoryTransactionRepository transactionRepository,
                                   PartService partService,
                                   AlertService alertService) {
        this.partRepository = partRepository;
        this.transactionRepository = transactionRepository;
        this.partService = partService;
        this.alertService = alertService;
    }

    /**
     * Handles warranty verification from use case 3.1 (Serial Number Recording and Warranty Verification)
     * Determines warranty class and triggers appropriate inventory actions.
     */
    public WarrantyVerificationResponseDTO verifyWarrantyAndClassify(WarrantyVerificationRequestDTO request) {
        logTransaction(null, "WARRANTY_VERIFICATION", 0, null, request.getRepairTicketId(), null, 
                      getCurrentUsername(), "VERIFICATION", "Warranty verification started for ticket: " + request.getRepairTicketId(), 
                      "WARRANTY_VERIFICATION");

        WarrantyVerificationResponseDTO response = new WarrantyVerificationResponseDTO();

        // Step 1: Check for tamper status override
        if (Boolean.TRUE.equals(request.getIsDeviceTampered())) {
            response.setWarrantyClass("OUT_OF_WARRANTY_CHARGEABLE");
            response.setIsInWarranty(false);
            response.setWarrantyStatus("TAMPERED");
            response.setRequiresSupplierReplacement(false);
            response.setNextWorkflow("QUOTATION");
            response.setTicketStatus("OUT_OF_WARRANTY_CHARGEABLE");
            response.setMessage("Device is tampered - classified as out of warranty and chargeable");
            return response;
        }

        // Step 2: Find device/part by serial number
        Optional<PartEntity> devicePart = partRepository.findBySerialNumber(request.getDeviceSerialNumber());
        
        if (devicePart.isEmpty()) {
            response.setWarrantyClass("PENDING_ADMIN_REVIEW");
            response.setIsInWarranty(false);
            response.setWarrantyStatus("SERIAL_NOT_FOUND");
            response.setRequiresSupplierReplacement(false);
            response.setNextWorkflow("ADMIN_REVIEW");
            response.setTicketStatus("PENDING_ADMIN_REVIEW");
            response.setMessage("Serial number not found in system - requires admin review");
            return response;
        }

        PartEntity part = devicePart.get();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime purchaseDate = part.getDatePurchasedByCustomer();
        LocalDateTime warrantyExpiration = part.getWarrantyExpiration();

        // Step 3: Calculate warranty status
        if (warrantyExpiration == null || now.isAfter(warrantyExpiration)) {
            response.setWarrantyClass("OUT_OF_WARRANTY_CHARGEABLE");
            response.setIsInWarranty(false);
            response.setWarrantyStatus("EXPIRED");
            response.setRequiresSupplierReplacement(false);
            response.setNextWorkflow("QUOTATION");
            response.setTicketStatus("OUT_OF_WARRANTY_CHARGEABLE");
            response.setMessage("Warranty has expired - requires customer payment");
        } else {
            // In warranty - determine warranty class based on purchase date
            response.setIsInWarranty(true);
            response.setWarrantyExpiration(warrantyExpiration);
            
            if (purchaseDate != null) {
                long daysFromPurchase = ChronoUnit.DAYS.between(purchaseDate, now);
                response.setDaysFromPurchase(daysFromPurchase);
                
                if (daysFromPurchase <= 7) {
                    // Auto-replacement eligible
                    response.setWarrantyClass("AUTO_REPLACEMENT");
                    response.setWarrantyStatus("AUTO_REPLACEMENT_ELIGIBLE");
                    response.setRequiresSupplierReplacement(false);
                    response.setNextWorkflow("AUTO_REPLACEMENT");
                    response.setTicketStatus("AWAITING_ADMIN_APPROVAL");
                    response.setMessage("Device is eligible for auto-replacement (≤7 days from purchase)");
                } else {
                    // In-warranty repair requiring supplier replacement
                    response.setWarrantyClass("IN_WARRANTY_REPAIR");
                    response.setWarrantyStatus("IN_WARRANTY");
                    response.setRequiresSupplierReplacement(true);
                    response.setNextWorkflow("SUPPLIER_REPLACEMENT");
                    response.setTicketStatus("AWAITING_SUPPLIER_PART");
                    response.setMessage("In-warranty repair - supplier replacement part will be ordered");
                    
                    // Create supplier replacement reservation
                    createSupplierReplacementReservation(request.getRepairTicketId(), part);
                }
            } else {
                response.setWarrantyClass("PENDING_ADMIN_REVIEW");
                response.setIsInWarranty(true);
                response.setWarrantyStatus("MISSING_PURCHASE_DATE");
                response.setRequiresSupplierReplacement(false);
                response.setNextWorkflow("ADMIN_REVIEW");
                response.setTicketStatus("PENDING_ADMIN_REVIEW");
                response.setMessage("Purchase date missing - requires admin review to determine warranty class");
            }
        }

        logTransaction(part.getPartId(), "WARRANTY_VERIFICATION", 0, null, request.getRepairTicketId(), null,
                      getCurrentUsername(), "VERIFICATION", "Warranty verification completed: " + response.getWarrantyClass(),
                      "WARRANTY_VERIFICATION");

        return response;
    }

    /**
     * Handles auto-replacement workflow from use case 3.3 (Replacement Handling Workflow)
     * Reserves replacement parts from inventory when admin approves auto-replacement.
     */
    public void processAutoReplacementApproval(String repairTicketId, String deviceSerialNumber, boolean approved) {
        if (!approved) {
            // Release any existing reservations for this ticket
            releaseReservationsForTicket(repairTicketId, "AUTO_REPLACEMENT_REJECTED");
            return;
        }

        // Find the device part
        Optional<PartEntity> devicePart = partRepository.findBySerialNumber(deviceSerialNumber);
        if (devicePart.isEmpty()) {
            throw new EntityNotFoundException("Device part not found for serial number: " + deviceSerialNumber);
        }

        PartEntity originalPart = devicePart.get();
        
        // Find a suitable replacement part (same model, available stock)
        List<PartEntity> replacementCandidates = partRepository.findByIsDeletedFalse().stream()
                .filter(p -> p.getName().equals(originalPart.getName()) &&
                           p.getPartType() == PartEnum.STANDARD &&
                           (p.getCurrentStock() - p.getReservedQuantity()) > 0)
                .collect(Collectors.toList());

        if (replacementCandidates.isEmpty()) {
            // No replacement available - trigger special handling
            logTransaction(originalPart.getPartId(), "AUTO_REPLACEMENT", 0, null, repairTicketId, null,
                          getCurrentUsername(), "PART_UNAVAILABLE", "No replacement part available - flagging for special handling",
                          "AUTO_REPLACEMENT");
            
            alertService.sendLowStockAlert("No replacement available for auto-replacement ticket: " + repairTicketId,
                                                originalPart.getName(), 0, 10); // Default threshold since it's managed at part number level
            throw new IllegalStateException("No replacement part available for auto-replacement");
        }

        // Reserve the first available replacement
        PartEntity replacementPart = replacementCandidates.get(0);
        
        ReservePartRequestDTO reserveRequest = new ReservePartRequestDTO();
        reserveRequest.setPartId(replacementPart.getPartId());
        reserveRequest.setQuantity(1);
        reserveRequest.setReservedForTicketId(repairTicketId);
        reserveRequest.setReservedBy(getCurrentUsername());
        reserveRequest.setReason("AUTO_REPLACEMENT");

        partService.reservePart(reserveRequest);

        logTransaction(replacementPart.getPartId(), "RESERVE", 1, null, repairTicketId, null,
                      getCurrentUsername(), "AUTO_REPLACEMENT", "Part reserved for auto-replacement",
                      "AUTO_REPLACEMENT");

        // Notify technician that replacement is ready
        alertService.sendTechnicianNotification(repairTicketId,
                "Replacement part reserved for auto-replacement ticket: " + repairTicketId);
    }

    /**
     * Handles quotation part selection from use case 4.4 (Quotation and Approval)
     * Provides compatible parts for technician and customer selection.
     */
    public QuotationPartSelectionDTO getPartsForQuotation(String repairTicketId, String deviceModel, String deviceBrand) {
        QuotationPartSelectionDTO response = new QuotationPartSelectionDTO();
        response.setRepairTicketId(repairTicketId);

        // Find parts compatible with the device
        List<PartEntity> compatibleParts = partRepository.findByIsDeletedFalse().stream()
                .filter(p -> (p.getName().toLowerCase().contains(deviceModel.toLowerCase()) ||
                             p.getName().toLowerCase().contains(deviceBrand.toLowerCase()) ||
                             p.getDescription().toLowerCase().contains(deviceModel.toLowerCase())) &&
                           (p.getCurrentStock() - p.getReservedQuantity()) > 0)
                .collect(Collectors.toList());

        if (compatibleParts.isEmpty()) {
            logTransaction(null, "QUOTATION_SEARCH", 0, null, repairTicketId, null,
                          getCurrentUsername(), "NO_PARTS_FOUND", "No compatible parts found for quotation",
                          "QUOTATION");
            return response;
        }

        // Set technician recommended part (first available, cheapest)
        PartEntity recommendedPart = compatibleParts.stream()
                .min((p1, p2) -> p1.getUnitCost().compareTo(p2.getUnitCost()))
                .orElse(compatibleParts.get(0));
        
        response.setTechnicianRecommendedPartId(recommendedPart.getPartId().toString());

        // Create alternative parts list sorted by cost
        List<QuotationPartSelectionDTO.AlternativePartDTO> alternatives = compatibleParts.stream()
                .map(p -> {
                    QuotationPartSelectionDTO.AlternativePartDTO alt = new QuotationPartSelectionDTO.AlternativePartDTO();
                    alt.setPartId(p.getPartId());
                    alt.setPartNumber(p.getPartNumber());
                    alt.setName(p.getName());
                    alt.setDescription(p.getDescription());
                    alt.setUnitCost(p.getUnitCost());
                    alt.setBrand(extractBrandFromName(p.getName()));
                    alt.setAvailableStock(p.getCurrentStock() - p.getReservedQuantity());
                    alt.setCompatibility("COMPATIBLE");
                    return alt;
                })
                .sorted((a1, a2) -> a1.getUnitCost().compareTo(a2.getUnitCost()))
                .collect(Collectors.toList());

        // Set priority for carousel ordering
        for (int i = 0; i < alternatives.size(); i++) {
            alternatives.get(i).setPriority(i + 1);
        }

        response.setAlternativeParts(alternatives);

        logTransaction(null, "QUOTATION_SEARCH", 0, null, repairTicketId, null,
                      getCurrentUsername(), "PARTS_FOUND", "Found " + alternatives.size() + " compatible parts",
                      "QUOTATION");

        return response;
    }

    /**
     * Handles quotation approval from use case 4.4
     * Reserves selected parts when customer approves quotation.
     */
    public void processQuotationApproval(String repairTicketId, String quotationId, List<Long> selectedPartIds, boolean approved) {
        if (!approved) {
            // Release any existing reservations for this quotation
            releaseReservationsForTicket(repairTicketId, "QUOTATION_REJECTED");
            return;
        }

        // Reserve selected parts
        for (Long partId : selectedPartIds) {
            ReservePartRequestDTO reserveRequest = new ReservePartRequestDTO();
            reserveRequest.setPartId(partId);
            reserveRequest.setQuantity(1);
            reserveRequest.setReservedForTicketId(repairTicketId);
            reserveRequest.setReservedBy(getCurrentUsername());
            reserveRequest.setReason("QUOTATION_APPROVED");

            partService.reservePart(reserveRequest);

            logTransaction(partId, "RESERVE", 1, null, repairTicketId, quotationId,
                          getCurrentUsername(), "QUOTATION_APPROVED", "Part reserved for approved quotation",
                          "QUOTATION");
        }

        // Notify technician that parts are reserved and repair can proceed
        alertService.sendTechnicianNotification(repairTicketId,
                "Parts reserved for approved quotation. Repair can proceed.");
    }

    /**
     * Handles supplier replacement part receipt from use case 5.1
     * Logs incoming supplier replacement parts and reserves them to originating tickets.
     */
    public PartResponseDTO receiveSupplierReplacementPart(SupplierReplacementRequestDTO request) {
        String currentUser = getCurrentUsername();
        
        // Create the supplier replacement part
        AddPartRequestDTO addPartRequest = new AddPartRequestDTO();
        addPartRequest.setPartNumber(generateSupplierReplacementPartNumber(request.getSupplierPartNumber()));
        addPartRequest.setName(request.getName());
        addPartRequest.setDescription(request.getDescription());
        addPartRequest.setUnitCost(request.getUnitCost());
        addPartRequest.setCurrentStock(request.getQuantity());
        addPartRequest.setLowStockThreshold(1); // Low threshold for supplier parts
        addPartRequest.setSerialNumber(request.getSerialNumber());
        addPartRequest.setPartType(PartEnum.SUPPLIER_REPLACEMENT);
        addPartRequest.setSupplierName(request.getSupplierName());
        addPartRequest.setSupplierPartNumber(request.getSupplierPartNumber());
        addPartRequest.setSupplierOrderDate(request.getSupplierOrderDate());
        addPartRequest.setAddedBy(currentUser);

        PartResponseDTO supplierPart = partService.addpart(addPartRequest);

        // Immediately reserve it to the originating repair ticket
        if (request.getOriginatingRepairTicketId() != null) {
            ReservePartRequestDTO reserveRequest = new ReservePartRequestDTO();
            reserveRequest.setPartId(supplierPart.getId());
            reserveRequest.setQuantity(request.getQuantity());
            reserveRequest.setReservedForTicketId(request.getOriginatingRepairTicketId());
            reserveRequest.setReservedBy(currentUser);
            reserveRequest.setReason("SUPPLIER_REPLACEMENT");

            partService.reservePart(reserveRequest);

            // Notify technician that supplier part has arrived
            alertService.sendTechnicianNotification(request.getOriginatingRepairTicketId(),
                    "Supplier replacement part has arrived and is reserved for your ticket: " + 
                    request.getOriginatingRepairTicketId());
        }

        logTransaction(supplierPart.getId(), "SUPPLIER_REPLACEMENT_RECEIVED", request.getQuantity(), 
                      null, request.getOriginatingRepairTicketId(), null, currentUser, 
                      "SUPPLIER_DELIVERY", request.getNotes(), "SUPPLIER_REPLACEMENT");

        return supplierPart;
    }

    /**
     * Gets inventory transaction history for audit purposes
     */
    public List<InventoryTransactionEntity> getTransactionHistory(Long partId) {
        return transactionRepository.findByPartPartIdOrderByTransactionTimestampDesc(partId);
    }

    /**
     * Gets transaction history for a specific repair ticket
     */
    public List<InventoryTransactionEntity> getTicketTransactionHistory(String ticketId) {
        return transactionRepository.findByRelatedTicketIdOrderByTransactionTimestampDesc(ticketId);
    }

    // ================ Private Helper Methods ================

    private void createSupplierReplacementReservation(String repairTicketId, PartEntity originalPart) {
        // This would typically trigger an order to the supplier
        // For now, we'll create a placeholder entry in the transaction log
        logTransaction(originalPart.getPartId(), "SUPPLIER_REPLACEMENT_ORDERED", 1, null, repairTicketId, null,
                      getCurrentUsername(), "SUPPLIER_ORDER", "Supplier replacement part ordered",
                      "SUPPLIER_REPLACEMENT");
        
        // Notify admin about the supplier order
        alertService.sendAdminNotification("Supplier replacement part ordered for ticket: " + repairTicketId +
                                                 ", Part: " + originalPart.getName());
    }

    private void releaseReservationsForTicket(String ticketId, String reason) {
        List<PartEntity> reservedParts = partRepository.findByReservedForTicketIdAndIsDeletedFalse(ticketId);
        
        for (PartEntity part : reservedParts) {
            try {
                partService.releaseReservedStock(part.getPartId(), part.getReservedQuantity());
                logTransaction(part.getPartId(), "RELEASE", part.getReservedQuantity(), null, ticketId, null,
                              getCurrentUsername(), reason, "Reservations released for ticket",
                              "WORKFLOW_CANCELLATION");
            } catch (Exception e) {
                // Log error but continue with other parts
                logTransaction(part.getPartId(), "RELEASE_ERROR", 0, null, ticketId, null,
                              getCurrentUsername(), reason, "Failed to release reservation: " + e.getMessage(),
                              "WORKFLOW_CANCELLATION");
            }
        }
    }

    private String generateSupplierReplacementPartNumber(String supplierPartNumber) {
        return "SUP-" + supplierPartNumber + "-" + System.currentTimeMillis();
    }

    private String extractBrandFromName(String partName) {
        // Simple extraction - could be enhanced with a proper brand mapping
        String[] words = partName.split(" ");
        return words.length > 0 ? words[0] : "Generic";
    }

    private void logTransaction(Long partId, String transactionType, Integer quantityChanged, 
                               Integer newStock, String relatedTicketId, String relatedQuotationId,
                               String performedBy, String reason, String notes, String workflowContext) {
        try {
            InventoryTransactionEntity transaction = new InventoryTransactionEntity();
            
            if (partId != null) {
                PartEntity part = partRepository.findById(partId).orElse(null);
                transaction.setPart(part);
                if (part != null) {
                    transaction.setPreviousStock(part.getCurrentStock());
                    transaction.setNewStock(newStock != null ? newStock : part.getCurrentStock());
                    transaction.setPreviousReserved(part.getReservedQuantity());
                    transaction.setNewReserved(part.getReservedQuantity());
                }
            }
            
            transaction.setTransactionType(transactionType);
            transaction.setQuantityChanged(quantityChanged);
            transaction.setRelatedTicketId(relatedTicketId);
            transaction.setRelatedQuotationId(relatedQuotationId);
            transaction.setPerformedBy(performedBy);
            transaction.setReason(reason);
            transaction.setNotes(notes);
            transaction.setWorkflowContext(workflowContext);
            
            transactionRepository.save(transaction);
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to log inventory transaction: " + e.getMessage());
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }
} 