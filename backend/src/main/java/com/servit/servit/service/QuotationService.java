package com.servit.servit.service;

import com.servit.servit.dto.quotation.QuotationDTO;
import com.servit.servit.entity.QuotationEntity;
import com.servit.servit.repository.QuotationRepository;
import com.servit.servit.repository.PartRepository;
import com.servit.servit.entity.PartEntity;
import com.servit.servit.repository.RepairTicketRepository;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.enumeration.RepairStatusEnum;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.servit.servit.dto.notification.NotificationDTO;
import com.servit.servit.repository.WarrantyRepository;
import com.servit.servit.entity.WarrantyEntity;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuotationService {

    private static final Logger logger = LoggerFactory.getLogger(QuotationService.class);

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private PartRepository partRepository;

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    private RepairTicketRepository repairTicketRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private WarrantyRepository warrantyRepository;

    public QuotationDTO addQuotation(QuotationDTO dto) {
        try {
            if (dto.getPartIds() == null || dto.getPartIds().isEmpty()) {
                throw new IllegalArgumentException("partIds must not be empty");
            }

            // Fetch parts and validate conditions
            List<PartEntity> parts = partRepository.findAllById(dto.getPartIds());
            if (parts.size() != dto.getPartIds().size()) {
                throw new IllegalArgumentException("One or more parts not found");
            }

            for (PartEntity part : parts) {
                boolean invalid = part.getDatePurchasedByCustomer() != null ||
                        Boolean.TRUE.equals(part.getIsCustomerPurchased()) ||
                        Boolean.TRUE.equals(part.getIsDeleted()) ||
                        Boolean.TRUE.equals(part.getIsReserved()) ||
                        part.getPartType() != com.servit.servit.enumeration.PartEnum.STANDARD ||
                        (part.getQuotationPart() != null && part.getQuotationPart() != 0) ||
                        part.getReservedForTicketId() != null ||
                        part.getSupplierActualDelivery() != null ||
                        part.getSupplierExpectedDelivery() != null ||
                        part.getSupplierName() != null ||
                        part.getSupplierOrderDate() != null ||
                        part.getSupplierPartNumber() != null ||
                        part.getWarrantyExpiration() != null ||
                        part.getWarranty() != null;

                if (invalid) {
                    throw new IllegalArgumentException("Part with id " + part.getPartId() + " is not eligible for quotation");
                }
            }

            // Remove existing quotations for this ticket (keep history if needed)
            List<QuotationEntity> existingForTicket = quotationRepository.findByRepairTicketNumber(dto.getRepairTicketNumber());
            if (!existingForTicket.isEmpty()) {
                quotationRepository.deleteAll(existingForTicket);
                logger.info("Removed {} existing quotation(s) for ticket {}", existingForTicket.size(), dto.getRepairTicketNumber());
            }

            QuotationEntity entity = new QuotationEntity();
            entity.setRepairTicketNumber(dto.getRepairTicketNumber());
            entity.setPartIds(dto.getPartIds());
            Double labor = dto.getLaborCost() != null ? dto.getLaborCost() : 0.0;
            Double total = dto.getTotalCost() != null ? dto.getTotalCost() : labor;
            entity.setLaborCost(labor);
            entity.setTotalCost(total);
            entity.setStatus("PENDING");
            entity.setCreatedAt(LocalDateTime.now());

            // Handle expiry & reminder – defaults via configuration
            Integer defaultExpiryDays = Integer.parseInt(configurationService.getConfigurationValue("quotation.expiry.days", "7"));
            Integer defaultReminderHours = Integer.parseInt(configurationService.getConfigurationValue("quotation.reminder.delay.hours", "24"));

            entity.setExpiryAt(dto.getExpiryAt() != null ? dto.getExpiryAt() : java.time.LocalDateTime.now().plusDays(defaultExpiryDays));
            entity.setReminderDelayHours(dto.getReminderDelayHours() != null ? dto.getReminderDelayHours() : defaultReminderHours);

            QuotationEntity saved = quotationRepository.save(entity);
            logger.info("Quotation created id {} for ticket {}", saved.getQuotationId(), saved.getRepairTicketNumber());
            return toDTO(saved);
        } catch (IllegalArgumentException ex) {
            throw ex; // will be handled by controller layer
        } catch (Exception e) {
            logger.error("Error adding quotation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add quotation", e);
        }
    }

    @Transactional
    public QuotationDTO approveQuotation(Long quotationId, String customerSelection) {
        try {
            QuotationEntity entity = quotationRepository.findById(quotationId)
                    .orElseThrow(() -> {
                        logger.warn("Quotation not found for approval: {}", quotationId);
                        return new IllegalArgumentException("Quotation not found");
                    });
            entity.setStatus("APPROVED");
            entity.setRespondedAt(LocalDateTime.now());
            entity.setCustomerSelection(customerSelection);

            // Recalculate totalCost based on customer's selected part
            try {
                Long selectedPartId = Long.parseLong(customerSelection);
                PartEntity part = partRepository.findById(selectedPartId)
                        .orElseThrow(() -> new IllegalArgumentException("Selected part not found"));
                double unit = part.getUnitCost() != null ? part.getUnitCost().doubleValue() : 0.0;
                entity.setTotalCost(entity.getLaborCost() + unit);

                // also update partIds to reflect only selected part
                java.util.List<Long> onlyPart = new java.util.ArrayList<>();
                onlyPart.add(selectedPartId);
                entity.setPartIds(onlyPart);

                // ------------------------------------------------------------------
                //  Customer purchase recording, reservation & warranty creation
                // ------------------------------------------------------------------
                try {
                    // 1. Update part fields
                    part.setIsCustomerPurchased(true);
                    part.setDatePurchasedByCustomer(LocalDateTime.now());

                    // Warranty defaults: 1 year (configurable)
                    int warrantyDays = Integer.parseInt(configurationService.getConfigurationValue("part.customer.warranty.days", "365"));
                    part.setWarrantyExpiration(LocalDateTime.now().plusDays(warrantyDays));

                    part.setQuotationPart(1); // mark coming from quotation

                    part.setIsReserved(true);
                    part.setReservedQuantity(1);
                    part.setReservedForTicketId(entity.getRepairTicketNumber());

                    // reduce current stock if tracking inventory
                    if (part.getCurrentStock() != null && part.getCurrentStock() > 0) {
                        part.setCurrentStock(part.getCurrentStock() - 1);
                    }

                    part.setDateModified(LocalDateTime.now());

                    // Technician email for modifiedBy
                    repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber())
                            .ifPresent(rt -> part.setModifiedBy(rt.getTechnicianEmail().getEmail()));

                    // 2. Create Warranty record
                    // Persist updated part (no warranty created for quotation purchases)
                    partRepository.save(part);
                    logger.info("Part {} updated after quotation approval (customer purchased)", part.getPartId());

                    // 3. Create WarrantyEntity linked to the part (no warranty number assigned)
                    try {
                        WarrantyEntity warranty = new WarrantyEntity();
                        // Populate required fields from repair ticket
                        RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber()).orElse(null);
                        if (ticket != null) {
                            warranty.setCustomerFirstName(ticket.getCustomerFirstName()==null?"UNKNOWN":ticket.getCustomerFirstName());
                            warranty.setCustomerLastName(ticket.getCustomerLastName()==null?"UNKNOWN":ticket.getCustomerLastName());
                            warranty.setCustomerEmail(ticket.getCustomerEmail());
                            warranty.setCustomerPhoneNumber(ticket.getCustomerPhoneNumber());
                            warranty.setReturnReason("PART_PURCHASE");
                            warranty.setReportedIssue("Customer purchased part via quotation");
                            warranty.setKind("PART_ONLY");
                        } else {
                            warranty.setCustomerFirstName("UNKNOWN");
                            warranty.setCustomerLastName("UNKNOWN");
                            warranty.setCustomerEmail("unknown@example.com");
                            warranty.setCustomerPhoneNumber("N/A");
                            warranty.setReturnReason("PART_PURCHASE");
                            warranty.setReportedIssue("Customer purchased part via quotation");
                            warranty.setKind("PART_ONLY");
                        }
                        // Status defaults to CHECKED_IN, warrantyNumber left null by design
                        warrantyRepository.save(warranty);
                        // Link warranty <-> part
                        part.setWarranty(warranty);
                        warranty.setItem(part);
                        partRepository.save(part);
                        logger.info("Warranty {} created and linked to part {}", warranty.getWarrantyId(), part.getPartId());
                    } catch (Exception exw) {
                        logger.warn("Failed to create/link warranty for part {}: {}", part.getPartId(), exw.getMessage());
                    }
                } catch(Exception ex){
                    logger.warn("Failed to fully update part/warranty after quotation approval: {}", ex.getMessage());
                }
            } catch (NumberFormatException nfe) {
                logger.warn("Customer selection is not a valid part id: {}", customerSelection);
            }

            // Clear expiry & reminder once approved
            entity.setExpiryAt(null);
            entity.setReminderDelayHours(null);

            quotationRepository.save(entity);

            // Update repair ticket status to REPAIRING if currently AWAITING_PARTS
            repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber()).ifPresent(rt -> {
                if (rt.getRepairStatus() == RepairStatusEnum.AWAITING_PARTS) {
                    rt.setRepairStatus(RepairStatusEnum.REPAIRING);
                    repairTicketRepository.save(rt);
                    logger.info("Ticket {} moved to REPAIRING after quotation approval", rt.getTicketNumber());
                }
            });

            // Notify technician via NotificationService (basic)
            try {
                NotificationDTO notif = new NotificationDTO();
                notif.setTicketNumber(entity.getRepairTicketNumber());
                notif.setStatus("QUOTATION_APPROVED");
                notif.setMessage("Customer approved quotation for " + entity.getRepairTicketNumber());
                // technician email fetch from ticket
                repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber()).ifPresent(rt -> {
                    notif.setRecipientEmail(rt.getTechnicianEmail().getEmail());
                });
                notificationService.sendNotification(notif);
            } catch(Exception e){ logger.warn("Failed to send approval notification",e);}

            logger.info("Quotation approved: {}", quotationId);
            return toDTO(entity);
        } catch (Exception e) {
            logger.error("Error approving quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to approve quotation", e);
        }
    }

    public QuotationDTO denyQuotation(Long quotationId) {
        try {
            QuotationEntity entity = quotationRepository.findById(quotationId)
                    .orElseThrow(() -> {
                        logger.warn("Quotation not found for denial: {}", quotationId);
                        return new IllegalArgumentException("Quotation not found");
                    });
            entity.setStatus("REJECTED");
            entity.setRespondedAt(LocalDateTime.now());
            quotationRepository.save(entity);
            logger.info("Quotation denied: {}", quotationId);
            return toDTO(entity);
        } catch (Exception e) {
            logger.error("Error denying quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to deny quotation", e);
        }
    }

    public void deleteQuotation(Long quotationId) {
        try {
            if (!quotationRepository.existsById(quotationId)) {
                logger.warn("Quotation not found for deletion: {}", quotationId);
                throw new IllegalArgumentException("Quotation not found");
            }
            quotationRepository.deleteById(quotationId);
            logger.info("Quotation deleted: {}", quotationId);
        } catch (Exception e) {
            logger.error("Error deleting quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete quotation", e);
        }
    }

    public QuotationDTO getQuotation(Long quotationId) {
        try {
            return quotationRepository.findById(quotationId)
                    .map(this::toDTO)
                    .orElseThrow(() -> {
                        logger.warn("Quotation not found: {}", quotationId);
                        return new IllegalArgumentException("Quotation not found");
                    });
        } catch (Exception e) {
            logger.error("Error retrieving quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve quotation", e);
        }
    }

    public List<QuotationDTO> getAllQuotation() {
        try {
            List<QuotationDTO> quotations = quotationRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
            logger.info("Retrieved all quotations, count: {}", quotations.size());
            return quotations;
        } catch (Exception e) {
            logger.error("Error retrieving all quotations: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve all quotations", e);
        }
    }

    public Page<QuotationDTO> getAllQuotationPaginated(Pageable pageable) {
        try {
            Page<QuotationDTO> page = quotationRepository.findAll(pageable).map(this::toDTO);
            logger.info("Retrieved paginated quotations, page: {}", pageable.getPageNumber());
            return page;
        } catch (Exception e) {
            logger.error("Error retrieving paginated quotations: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve paginated quotations", e);
        }
    }

    public List<QuotationDTO> getQuotationByRepairTicketNumber(String repairTicketNumber) {
        try {
            List<QuotationDTO> quotations = quotationRepository.findByRepairTicketNumber(repairTicketNumber)
                    .stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
            logger.info("Retrieved quotations for repair ticket number {}: count {}", repairTicketNumber, quotations.size());
            return quotations;
        } catch (Exception e) {
            logger.error("Error retrieving quotations by repair ticket number {}: {}", repairTicketNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve quotations by repair ticket number", e);
        }
    }

    /**
     * Update an existing quotation with new details.
     * Only partIds, laborCost, and totalCost are updatable for now.
     */
    public QuotationDTO updateQuotation(QuotationDTO dto) {
        if (dto.getQuotationId() == null) {
            throw new IllegalArgumentException("quotationId is required for update");
        }
        try {
            QuotationEntity entity = quotationRepository.findById(dto.getQuotationId())
                    .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));

            if (dto.getPartIds() != null) entity.setPartIds(dto.getPartIds());
            if (dto.getLaborCost() != null) entity.setLaborCost(dto.getLaborCost());
            if (dto.getTotalCost() != null) entity.setTotalCost(dto.getTotalCost());
            if (dto.getExpiryAt() != null) entity.setExpiryAt(dto.getExpiryAt());
            if (dto.getReminderDelayHours() != null) entity.setReminderDelayHours(dto.getReminderDelayHours());

            QuotationEntity saved = quotationRepository.save(entity);
            logger.info("Quotation updated: {}", saved.getQuotationId());
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error updating quotation {}: {}", dto.getQuotationId(), e.getMessage(), e);
            throw new RuntimeException("Failed to update quotation", e);
        }
    }

    private QuotationDTO toDTO(QuotationEntity entity) {
        QuotationDTO dto = new QuotationDTO();
        dto.setQuotationId(entity.getQuotationId());
        dto.setRepairTicketNumber(entity.getRepairTicketNumber());
        dto.setPartIds(entity.getPartIds());
        dto.setLaborCost(entity.getLaborCost());
        dto.setTotalCost(entity.getTotalCost());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setRespondedAt(entity.getRespondedAt());
        dto.setCustomerSelection(entity.getCustomerSelection());
        dto.setExpiryAt(entity.getExpiryAt());
        dto.setReminderDelayHours(entity.getReminderDelayHours());
        return dto;
    }
}