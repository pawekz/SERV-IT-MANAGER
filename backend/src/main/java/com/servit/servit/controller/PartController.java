package com.servit.servit.controller;

import com.servit.servit.service.PartService;
import com.servit.servit.service.InventoryWorkflowService;
import com.servit.servit.service.PartNumberStockTrackingService;
import com.servit.servit.entity.PartNumberStockTrackingEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.servit.servit.dto.AddPartRequestDTO;
import com.servit.servit.dto.PartResponseDTO;
import com.servit.servit.dto.UpdatePartRequestDTO;
import com.servit.servit.dto.BulkAddPartRequestDTO;
import com.servit.servit.dto.ReservePartRequestDTO;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import com.servit.servit.dto.WarrantyVerificationRequestDTO;
import com.servit.servit.dto.WarrantyVerificationResponseDTO;
import com.servit.servit.dto.QuotationPartSelectionDTO;
import com.servit.servit.dto.SupplierReplacementRequestDTO;
import com.servit.servit.dto.PartNumberStockSummaryDTO;
import com.servit.servit.dto.UpdatePartNumberStockTrackingDTO;
import com.servit.servit.entity.InventoryTransactionEntity;
import com.servit.servit.entity.PartEntity;
import com.servit.servit.repository.PartRepository;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/part")
@CrossOrigin(origins = "http://localhost:5173")
public class PartController {

    private static final Logger logger = LoggerFactory.getLogger(PartController.class);

    @Autowired
    private final PartService partService;

    @Autowired
    private InventoryWorkflowService inventoryWorkflowService;
    
    @Autowired
    private PartNumberStockTrackingService stockTrackingService;

    @Autowired
    private PartRepository partRepository;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    // ================ CRUD Operations ================

    @PostMapping("/addPart")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> addPart(@RequestBody AddPartRequestDTO req) {
        logger.info("API Request: Adding single part - Part Number: {}, Serial Number: {}", 
                   req.getPartNumber(), req.getSerialNumber());
        try {
            PartResponseDTO result = partService.addpart(req);
            // Ensure stock tracking is updated immediately
            stockTrackingService.updateStockTracking(result.getPartNumber());
            logger.info("API Response: Part added successfully - ID: {}, Part Number: {}", 
                       result.getId(), result.getPartNumber());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            logger.warn("API Error: Bad request while adding part - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("API Error: Internal server error while adding part - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PostMapping("/addBulkParts")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> addBulkParts(@RequestBody BulkAddPartRequestDTO req) {
        logger.info("API Request: Adding bulk parts - Base Part Number: {}, Count: {}", 
                   req.getBasePartNumber(), req.getSerialNumbers() != null ? req.getSerialNumbers().size() : 0);
        try {
            List<PartResponseDTO> result = partService.addBulkParts(req);
            logger.info("API Response: Bulk parts added successfully - Count: {}", result.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            logger.warn("API Error: Bad request while adding bulk parts - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("API Error: Internal server error while adding bulk parts - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PatchMapping("/updatePart/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updatePart(@PathVariable Long id, @RequestBody UpdatePartRequestDTO req) {
        try {
            logger.info("Updating part with ID: {}", id);
            logger.debug("Update request data: {}", req);

            // Validate warranty dates if customer purchased
            if (req.getIsCustomerPurchased() != null && req.getIsCustomerPurchased()) {
                if (req.getDatePurchasedByCustomer() == null) {
                    return ResponseEntity.badRequest().body("Purchase date is required for customer purchased items");
                }
                if (req.getWarrantyExpiration() == null) {
                    return ResponseEntity.badRequest().body("Warranty expiration date is required for customer purchased items");
                }
                if (req.getDatePurchasedByCustomer().isAfter(req.getWarrantyExpiration())) {
                    return ResponseEntity.badRequest().body("Warranty expiration date must be after purchase date");
                }
            }

            PartResponseDTO updatedPart = partService.updatePart(id, req);
            return ResponseEntity.ok(updatedPart);
        } catch (Exception e) {
            logger.error("Error updating part: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update part: " + e.getMessage());
        }
    }

    @DeleteMapping("/deletePart/{partId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePart(@PathVariable Long partId) {
        logger.info("API Request: Deleting part with ID: {}", partId);
        try {
            partService.deletePart(partId);
            logger.info("API Response: Part deleted successfully - ID: {}", partId);
            return ResponseEntity.ok("Part deleted successfully");
        } catch (EntityNotFoundException e) {
            logger.warn("API Error: Part not found for deletion - ID: {}", partId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (IllegalStateException e) {
            logger.warn("API Error: Cannot delete part - {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            logger.error("API Error: Internal server error while deleting part - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    // ================ Search Operations ================

    @GetMapping("/getPartById/{id}")
    public ResponseEntity<PartResponseDTO> getPartById(@PathVariable Long id) {
        logger.info("API Request: Getting part by ID: {}", id);
        return partService.getPartById(id)
                .map(part -> {
                    logger.info("API Response: Part found - ID: {}, Part Number: {}", part.getId(), part.getPartNumber());
                    return ResponseEntity.ok(part);
                })
                .orElseGet(() -> {
                    logger.warn("API Response: Part not found - ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    @GetMapping("/getPartByPartNumber/{partNumber}")
    public ResponseEntity<PartResponseDTO> getPartByPartNumber(@PathVariable String partNumber) {
        return partService.getPartByPartNumber(partNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/getPartBySerialNumber/{serialNumber}")
    public ResponseEntity<PartResponseDTO> getPartBySerialNumber(@PathVariable String serialNumber) {
        return partService.getPartBySerialNumber(serialNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/searchParts")
    public ResponseEntity<List<PartResponseDTO>> searchParts(@RequestParam String searchTerm) {
        try {
            List<PartResponseDTO> results = partService.searchParts(searchTerm);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================ List Operations ================

    @GetMapping("/getAllParts")
    public ResponseEntity<List<PartResponseDTO>> getAllParts() {
        logger.info("API Request: Getting all parts");
        try {
            List<PartResponseDTO> parts = partService.getAllParts();
            logger.info("API Response: Retrieved {} parts", parts.size());
            return parts.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(parts);
        } catch (Exception e) {
            logger.error("API Error: Internal server error while getting all parts - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stock/getAllPartNumberSummaries")
    public ResponseEntity<List<PartNumberStockSummaryDTO>> getAllPartNumberSummaries() {
        logger.info("API Request: Getting all part number stock summaries");
        try {
            // Get distinct part numbers
            List<String> partNumbers = partService.getAllParts().stream()
                    .map(PartResponseDTO::getPartNumber)
                    .distinct()
                    .collect(Collectors.toList());
            
            List<PartNumberStockSummaryDTO> summaries = new ArrayList<>();
            for (String partNumber : partNumbers) {
                PartNumberStockSummaryDTO summary = stockTrackingService.getStockSummary(partNumber);
                if (summary != null) {
                    summaries.add(summary);
                }
            }
            
            logger.info("API Response: Retrieved {} part number summaries", summaries.size());
            return summaries.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(summaries);
        } catch (Exception e) {
            logger.error("API Error: Internal server error while getting part number summaries - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getAvailableParts")
    public ResponseEntity<List<PartResponseDTO>> getAvailableParts() {
        try {
            List<PartResponseDTO> availableParts = partService.getAvailableParts();
            return ResponseEntity.ok(availableParts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stock/getLowStockParts")
    public ResponseEntity<List<PartResponseDTO>> getLowStockParts() {
        try {
            List<PartResponseDTO> lowStockParts = partService.getLowStockParts();
            return ResponseEntity.ok(lowStockParts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getAllPartsForQuotation")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<PartResponseDTO>> getAllPartsForQuotation() {
        logger.info("API Request: Getting eligible parts for quotation");
        try {
            List<PartResponseDTO> parts = partService.getAllPartsForQuotation();
            logger.info("API Response: Retrieved {} eligible parts", parts.size());
            return parts.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(parts);
        } catch (Exception e) {
            logger.error("API Error: Internal server error while getting parts for quotation - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================ Stock Management ================

    @PatchMapping("/stock/updateStocks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            partService.updateStock(id, quantity);
            return ResponseEntity.ok("Stock updated successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PatchMapping("/stock/adjustStock/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> adjustStock(@PathVariable Long id, @RequestParam int quantity, @RequestParam String operationType) {
        try {
            partService.adjustStock(id, quantity, operationType);
            return ResponseEntity.ok("Stock adjusted successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    // ================ Reservation Management ================

    @PostMapping("/reservePart")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> reservePart(@RequestBody ReservePartRequestDTO req) {
        try {
            partService.reservePart(req);
            return ResponseEntity.ok("Part reserved successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PatchMapping("/stock/releaseReservedStock/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> releaseReservedStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            partService.releaseReservedStock(id, quantity);
            return ResponseEntity.ok("Reserved stock released successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PostMapping("/confirmPartUsage/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> confirmPartUsage(@PathVariable Long id, @RequestParam int quantity) {
        try {
            partService.confirmPartUsage(id, quantity);
            return ResponseEntity.ok("Part usage confirmed successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    // ================ Alert Management ================

    @PostMapping("/checkLowStockAlert/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> checkLowStockAlert(@PathVariable Long id) {
        try {
            partService.checkAndTriggerLowStockAlert(id);
            return ResponseEntity.ok("Low stock check completed");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part not found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    // ================ Workflow Integration Endpoints ================

    /**
     * Warranty verification endpoint for use case 3.1 (Serial Number Recording and Warranty Verification)
     */
    @PostMapping("/workflow/verifyWarranty")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> verifyWarranty(@RequestBody WarrantyVerificationRequestDTO request) {
        try {
            WarrantyVerificationResponseDTO response = inventoryWorkflowService.verifyWarrantyAndClassify(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Auto-replacement approval endpoint for use case 3.3 (Replacement Handling Workflow)
     */
    @PostMapping("/workflow/processAutoReplacement")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> processAutoReplacement(@RequestParam String repairTicketId, 
                                                   @RequestParam String deviceSerialNumber,
                                                   @RequestParam boolean approved) {
        try {
            inventoryWorkflowService.processAutoReplacementApproval(repairTicketId, deviceSerialNumber, approved);
            return ResponseEntity.ok("Auto-replacement " + (approved ? "approved" : "rejected") + " successfully");
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Device not found: " + e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Get parts for quotation endpoint for use case 4.4 (Quotation and Approval)
     */
    @GetMapping("/workflow/getPartsForQuotation")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getPartsForQuotation(@RequestParam String repairTicketId,
                                                 @RequestParam String deviceModel,
                                                 @RequestParam String deviceBrand) {
        try {
            QuotationPartSelectionDTO response = inventoryWorkflowService.getPartsForQuotation(repairTicketId, deviceModel, deviceBrand);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Process quotation approval endpoint for use case 4.4 (Quotation and Approval)
     */
    @PostMapping("/workflow/processQuotationApproval")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> processQuotationApproval(@RequestParam String repairTicketId,
                                                     @RequestParam String quotationId,
                                                     @RequestParam List<Long> selectedPartIds,
                                                     @RequestParam boolean approved) {
        try {
            inventoryWorkflowService.processQuotationApproval(repairTicketId, quotationId, selectedPartIds, approved);
            return ResponseEntity.ok("Quotation " + (approved ? "approved" : "rejected") + " successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Receive supplier replacement part endpoint for use case 5.1 (Inventory Interface)
     */
    @PostMapping("/workflow/receiveSupplierReplacement")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> receiveSupplierReplacement(@RequestBody SupplierReplacementRequestDTO request) {
        try {
            PartResponseDTO response = inventoryWorkflowService.receiveSupplierReplacementPart(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    // ================ Audit and Transaction History ================

    /**
     * Get transaction history for a specific part
     */
    @GetMapping("/audit/partHistory/{partId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getPartTransactionHistory(@PathVariable Long partId) {
        try {
            List<InventoryTransactionEntity> history = inventoryWorkflowService.getTransactionHistory(partId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Get transaction history for a specific repair ticket
     */
    @GetMapping("/audit/ticketHistory/{ticketId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getTicketTransactionHistory(@PathVariable String ticketId) {
        try {
            List<InventoryTransactionEntity> history = inventoryWorkflowService.getTicketTransactionHistory(ticketId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    // ================ Part Number Stock Tracking ================

    @GetMapping("/stock/summary/{partNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getPartNumberStockSummary(@PathVariable String partNumber) {
        try {
            PartNumberStockSummaryDTO summary = stockTrackingService.getStockSummary(partNumber);
            if (summary != null) {
                return ResponseEntity.ok(summary);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part number not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving stock summary: " + e.getMessage());
        }
    }

    @GetMapping("/stock/lowStockPartNumbers")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> getLowStockPartNumbers() {
        try {
            List<PartNumberStockSummaryDTO> lowStockItems = stockTrackingService.getLowStockPartNumbers();
            return ResponseEntity.ok(lowStockItems);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving low stock parts: " + e.getMessage());
        }
    }

    @GetMapping("/stock/needReorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPartNumbersNeedingReorder() {
        try {
            List<PartNumberStockSummaryDTO> needingReorder = stockTrackingService.getPartNumbersNeedingReorder();
            return ResponseEntity.ok(needingReorder);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving parts needing reorder: " + e.getMessage());
        }
    }

    @GetMapping("/stock/searchPartNumbers")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> searchPartNumbers(@RequestParam String searchTerm) {
        try {
            List<PartNumberStockSummaryDTO> results = stockTrackingService.searchPartNumbers(searchTerm);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error searching part numbers: " + e.getMessage());
        }
    }

    @PutMapping("/stock/updateTracking")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStockTrackingSettings(@RequestBody UpdatePartNumberStockTrackingDTO updateDTO) {
        try {
            PartNumberStockTrackingEntity updated = stockTrackingService.updateTrackingSettings(updateDTO);
            return ResponseEntity.ok("Stock tracking settings updated for part number: " + updated.getPartNumber());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating stock tracking settings: " + e.getMessage());
        }
    }

    @PostMapping("/stock/refreshTracking/{partNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> refreshStockTracking(@PathVariable String partNumber) {
        try {
            PartNumberStockTrackingEntity updated = stockTrackingService.updateStockTracking(partNumber);
            if (updated != null) {
                return ResponseEntity.ok("Stock tracking refreshed for part number: " + partNumber);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Part number not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error refreshing stock tracking: " + e.getMessage());
        }
    }

    @PostMapping("/stock/refreshAllTracking")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> refreshAllStockTracking() {
        try {
            stockTrackingService.updateAllStockTracking();
            return ResponseEntity.ok("All stock tracking data refreshed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error refreshing all stock tracking: " + e.getMessage());
        }
    }

    @GetMapping("/debug/stockCount/{partNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> debugStockCount(@PathVariable String partNumber) {
        try {
            List<PartResponseDTO> parts = partService.searchParts(partNumber);
            List<PartResponseDTO> activeParts = parts.stream()
                    .filter(part -> !part.getIsDeleted())
                    .filter(part -> part.getPartNumber().equals(partNumber))
                    .collect(Collectors.toList());
            
            int partCount = activeParts.size();
            int stockSum = activeParts.stream().mapToInt(PartResponseDTO::getCurrentStock).sum();
            
            return ResponseEntity.ok(Map.of(
                "partNumber", partNumber,
                "activePartsCount", partCount,
                "stockSum", stockSum,
                "activeParts", activeParts
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error debugging stock count: " + e.getMessage());
        }
    }

    @GetMapping("/debug/databaseState")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> debugDatabaseState() {
        try {
            List<PartResponseDTO> allParts = partService.getAllParts();
            return ResponseEntity.ok(Map.of(
                "totalPartsInDatabase", allParts.size(),
                "parts", allParts,
                "message", "All parts currently in database (excluding deleted)"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting database state: " + e.getMessage());
        }
    }

    @PostMapping("/stock/resolveAlert/{partNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resolveStockAlert(@PathVariable String partNumber) {
        try {
            stockTrackingService.resolveAlert(partNumber);
            return ResponseEntity.ok("Stock alert resolved for part number: " + partNumber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error resolving stock alert: " + e.getMessage());
        }
    }

    // Add new endpoint to verify warranty
    @GetMapping("/verifyWarranty/{partId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> verifyWarranty(@PathVariable Long partId) {
        try {
            logger.info("Verifying warranty for part ID: {}", partId);
            Map<String, Object> warrantyInfo = partService.verifyWarranty(partId);
            return ResponseEntity.ok(warrantyInfo);
        } catch (Exception e) {
            logger.error("Error verifying warranty: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to verify warranty: " + e.getMessage());
        }
    }

    @GetMapping("/getPartDetailsByPartNumber/{partNumber}")
    public ResponseEntity<?> getPartDetailsByPartNumber(@PathVariable String partNumber) {
        logger.info("API Request: Getting part details by part number: {}", partNumber);
        try {
            List<PartEntity> parts = partRepository.findAllByPartNumber(partNumber)
                .stream()
                .filter(part -> !part.getIsDeleted())
                .collect(Collectors.toList());
            
            if (!parts.isEmpty()) {
                // Use the first non-deleted part to get the common details
                PartEntity existingPart = parts.get(0);
                Map<String, Object> details = new HashMap<>();
                details.put("name", existingPart.getName());
                details.put("description", existingPart.getDescription());
                details.put("unitCost", existingPart.getUnitCost());
                details.put("brand", existingPart.getBrand());
                details.put("model", existingPart.getModel());
                details.put("partType", existingPart.getPartType());
                details.put("exists", true);
                details.put("totalParts", parts.size());
                
                logger.info("API Response: Found {} parts for part number: {}", parts.size(), partNumber);
                return ResponseEntity.ok(details);
            } else {
                logger.info("API Response: No active parts found for part number: {}", partNumber);
                return ResponseEntity.ok(Map.of("exists", false));
            }
        } catch (Exception e) {
            logger.error("API Error: Error getting part details - {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting part details: " + e.getMessage());
        }
    }
}