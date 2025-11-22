package com.servit.servit.service;

import com.servit.servit.dto.quotation.QuotationDTO;
import com.servit.servit.entity.QuotationEntity;
import com.servit.servit.repository.QuotationRepository;
import com.servit.servit.repository.PartRepository;
import com.servit.servit.entity.PartEntity;
import com.servit.servit.repository.RepairTicketRepository;
import com.servit.servit.entity.RepairTicketEntity;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.servit.servit.dto.notification.NotificationDTO;
import com.servit.servit.repository.WarrantyRepository;
import com.servit.servit.entity.WarrantyEntity;
import com.servit.servit.dto.repairticket.UpdateRepairStatusRequestDTO;
import com.servit.servit.enumeration.RepairStatusEnum;
import org.springframework.context.annotation.Lazy;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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

    @Autowired
    private EmailService emailService;

    @Autowired
    @Lazy
    private RepairTicketService repairTicketService;

    public QuotationDTO addQuotation(QuotationDTO dto) {
        try {
            if (dto.getPartIds() == null || dto.getPartIds().isEmpty()) {
                throw new IllegalArgumentException("partIds must not be empty");
            }

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

            List<QuotationEntity> existingForTicket = quotationRepository.findByRepairTicketNumber(dto.getRepairTicketNumber());
            for (QuotationEntity prior : existingForTicket) {
                if (!"ARCHIVED".equalsIgnoreCase(prior.getStatus())) {
                    prior.setStatus("ARCHIVED");
                    quotationRepository.save(prior);
                }
            }

            QuotationEntity entity = new QuotationEntity();
            entity.setRepairTicketNumber(dto.getRepairTicketNumber());
            entity.setPartIds(dto.getPartIds());

            // Handle recommendedPart as list of PartEntity
            if (dto.getRecommendedPart() != null) {
                if (!dto.getRecommendedPart().isEmpty()) {
                    List<PartEntity> recommendedParts = partRepository.findAllById(dto.getRecommendedPart());
                    entity.setRecommendedPart(recommendedParts);
                } else {
                    // Explicitly empty array from frontend - respect it
                    entity.setRecommendedPart(new java.util.ArrayList<>());
                }
            } else if (!dto.getPartIds().isEmpty()) {
                // Fallback: if not provided, use first partId as recommended
                PartEntity firstPart = partRepository.findById(dto.getPartIds().get(0))
                        .orElse(null);
                entity.setRecommendedPart(firstPart != null ? java.util.Collections.singletonList(firstPart) : new java.util.ArrayList<>());
            } else {
                entity.setRecommendedPart(new java.util.ArrayList<>());
            }

            // Handle alternativePart as list of PartEntity
            if (dto.getAlternativePart() != null) {
                if (!dto.getAlternativePart().isEmpty()) {
                    List<PartEntity> alternativeParts = partRepository.findAllById(dto.getAlternativePart());
                    entity.setAlternativePart(alternativeParts);
                } else {
                    // Explicitly empty array from frontend - respect it
                    entity.setAlternativePart(new java.util.ArrayList<>());
                }
            } else {
                // Fallback: use remaining partIds that aren't in recommended
                List<Long> recommendedIds = entity.getRecommendedPart().stream()
                        .map(PartEntity::getPartId)
                        .collect(Collectors.toList());
                List<Long> alternativeIds = dto.getPartIds().stream()
                        .filter(id -> recommendedIds == null || recommendedIds.isEmpty() || !recommendedIds.contains(id))
                        .collect(Collectors.toList());
                if (!alternativeIds.isEmpty()) {
                    List<PartEntity> alternativeParts = partRepository.findAllById(alternativeIds);
                    entity.setAlternativePart(alternativeParts);
                } else {
                    entity.setAlternativePart(new java.util.ArrayList<>());
                }
            }

            Double labor = dto.getLaborCost() != null ? dto.getLaborCost() : 0.0;
            Double total = dto.getTotalCost() != null ? dto.getTotalCost() : labor;
            entity.setLaborCost(labor);
            entity.setTotalCost(total);
            entity.setStatus("PENDING");
            entity.setCreatedAt(LocalDateTime.now());
            entity.setCustomerSelection(null);
            entity.setTechnicianOverride(Boolean.FALSE);
            entity.setOverrideTimestamp(null);
            entity.setOverrideNotes(null);

            Integer defaultExpiryDays = Integer.parseInt(configurationService.getConfigurationValue("quotation.expiry.days", "7"));
            Integer defaultReminderHours = Integer.parseInt(configurationService.getConfigurationValue("quotation.reminder.delay.hours", "24"));

            entity.setExpiryAt(dto.getExpiryAt() != null ? dto.getExpiryAt() : java.time.LocalDateTime.now().plusDays(defaultExpiryDays));
            entity.setReminderDelayHours(dto.getReminderDelayHours() != null ? dto.getReminderDelayHours() : defaultReminderHours);
            entity.setNextReminderAt(null);
            entity.setLastReminderSentAt(null);
            entity.setReminderSendCount(0);
            entity.setApprovalSummarySentAt(null);

            QuotationEntity saved = quotationRepository.save(entity);
            logger.info("Quotation created id {} for ticket {}", saved.getQuotationId(), saved.getRepairTicketNumber());
            try {
                publishAwaitingApprovalEmail(saved.getRepairTicketNumber());
            } catch (Exception e) {
                logger.error("Failed to publish awaiting approval email for quotation {}: {}", saved.getQuotationId(), e.getMessage(), e);
            }
            return toDTO(saved);
        } catch (IllegalArgumentException ex) {
            throw ex;
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
            entity.setTechnicianOverride(Boolean.FALSE);
            return finalizeApproval(entity, customerSelection);
        } catch (Exception e) {
            logger.error("Error approving quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to approve quotation", e);
        }
    }

    @Transactional
    public QuotationDTO overrideCustomerSelection(Long quotationId, Long partId, String notes) {
        if (partId == null) {
            throw new IllegalArgumentException("partId is required for technician override");
        }
        if (notes == null || notes.trim().isEmpty()) {
            throw new IllegalArgumentException("Notes are required for technician override");
        }
        try {
            QuotationEntity entity = quotationRepository.findById(quotationId)
                    .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));
            entity.setTechnicianOverride(Boolean.TRUE);
            entity.setOverrideTimestamp(LocalDateTime.now());
            entity.setOverrideNotes(notes.trim());
            return finalizeApproval(entity, String.valueOf(partId));
        } catch (Exception e) {
            logger.error("Error overriding quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to override quotation", e);
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
                    .sorted(Comparator.comparing(QuotationEntity::getCreatedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                    .map(this::toDTO)
                    .collect(Collectors.toList());
            logger.info("Retrieved quotations for repair ticket number {}: count {}", repairTicketNumber, quotations.size());
            return quotations;
        } catch (Exception e) {
            logger.error("Error retrieving quotations by repair ticket number {}: {}", repairTicketNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve quotations by repair ticket number", e);
        }
    }

    @Transactional(readOnly = true)
    public QuotationEntity requirePendingQuotation(String ticketNumber) {
        QuotationEntity quotation = quotationRepository.findTopByRepairTicketNumberOrderByCreatedAtDesc(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("No quotation found for ticket " + ticketNumber));
        if (!"PENDING".equalsIgnoreCase(quotation.getStatus())) {
            throw new IllegalArgumentException("Latest quotation for ticket " + ticketNumber + " is not pending (status=" + quotation.getStatus() + ")");
        }
        return quotation;
    }

    @Transactional
    public void publishAwaitingApprovalEmail(String ticketNumber) {
        QuotationEntity quotation = requirePendingQuotation(ticketNumber);
        RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new IllegalArgumentException("Repair ticket not found: " + ticketNumber));
        try {
            EmailService.QuotationOption recommended = buildOptionFromPartList(quotation.getRecommendedPart(), "Option A – Recommended", quotation.getLaborCost());
            EmailService.QuotationOption alternative = buildOptionFromPartList(quotation.getAlternativePart(), "Option B – Alternative", quotation.getLaborCost());
            String reminderCopy = buildReminderCopy(quotation);
            emailService.sendQuotationWaitingForApprovalEmail(
                    ticket.getCustomerEmail(),
                    ticket.getCustomerFirstName(),
                    ticketNumber,
                    recommended,
                    alternative,
                    reminderCopy,
                    resolveSupportPhone());
            Integer reminderHours = Optional.ofNullable(quotation.getReminderDelayHours())
                    .orElse(Integer.parseInt(configurationService.getConfigurationValue("quotation.reminder.delay.hours", "24")));
            quotation.setNextReminderAt(LocalDateTime.now().plusHours(reminderHours));
            quotation.setReminderSendCount(0);
            quotation.setLastReminderSentAt(null);
            quotationRepository.save(quotation);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to dispatch quotation approval email", e);
        }
    }

    @Transactional
    public void sendReminder(Long quotationId) {
        QuotationEntity quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));
        if (!"PENDING".equalsIgnoreCase(quotation.getStatus())) {
            return;
        }
        RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(quotation.getRepairTicketNumber())
                .orElse(null);
        if (ticket == null) {
            return;
        }
        try {
            EmailService.QuotationOption recommended = buildOptionFromPartList(quotation.getRecommendedPart(), "Option A – Recommended", quotation.getLaborCost());
            EmailService.QuotationOption alternative = buildOptionFromPartList(quotation.getAlternativePart(), "Option B – Alternative", quotation.getLaborCost());
            String reminderCopy = buildReminderCopy(quotation);
            emailService.sendQuotationReminderEmail(
                    ticket.getCustomerEmail(),
                    ticket.getCustomerFirstName(),
                    ticket.getTicketNumber(),
                    recommended,
                    alternative,
                    reminderCopy,
                    resolveSupportPhone());
            quotation.setLastReminderSentAt(LocalDateTime.now());
            Integer count = Optional.ofNullable(quotation.getReminderSendCount()).orElse(0);
            quotation.setReminderSendCount(count + 1);
            Integer reminderHours = Optional.ofNullable(quotation.getReminderDelayHours())
                    .orElse(Integer.parseInt(configurationService.getConfigurationValue("quotation.reminder.delay.hours", "24")));
            quotation.setNextReminderAt(LocalDateTime.now().plusHours(reminderHours));
            quotationRepository.save(quotation);
        } catch (MessagingException e) {
            logger.error("Failed to send quotation reminder {}", quotationId, e);
        }
    }

    @Transactional
    public void sendApprovalSummaryIfNeeded(String ticketNumber) {
        Optional<QuotationEntity> latest = quotationRepository.findTopByRepairTicketNumberOrderByCreatedAtDesc(ticketNumber);
        if (latest.isEmpty()) {
            return;
        }
        QuotationEntity quotation = latest.get();
        if (!"APPROVED".equalsIgnoreCase(quotation.getStatus())) {
            return;
        }
        if (quotation.getApprovalSummarySentAt() != null) {
            return;
        }
        if (quotation.getCustomerSelection() == null) {
            return;
        }
        RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(ticketNumber).orElse(null);
        if (ticket == null) {
            return;
        }
        try {
            EmailService.QuotationOption selected = buildOption(safeParseLong(quotation.getCustomerSelection()), "Approved Selection", quotation.getLaborCost());
            if (selected == null) {
                return;
            }
            emailService.sendQuotationApprovedSummaryEmail(
                    ticket.getCustomerEmail(),
                    ticket.getCustomerFirstName(),
                    ticketNumber,
                    selected,
                    resolveSupportPhone());
            quotation.setApprovalSummarySentAt(LocalDateTime.now());
            quotationRepository.save(quotation);
        } catch (MessagingException e) {
            logger.error("Failed to send approval summary for ticket {}", ticketNumber, e);
        }
    }

    private EmailService.QuotationOption buildOption(Long partId, String label, Double laborCost) {
        if (partId == null) {
            return null;
        }
        return partRepository.findById(partId)
                .map(part -> {
                    double unitCost = part.getUnitCost() != null ? part.getUnitCost().doubleValue() : 0.0;
                    double labor = laborCost != null ? laborCost : 0.0;
                    return new EmailService.QuotationOption(
                            label,
                            part.getName(),
                            part.getPartNumber(),
                            part.getDescription(),
                            unitCost,
                            labor);
                })
                .orElse(null);
    }

    private EmailService.QuotationOption buildOptionFromPartList(List<PartEntity> parts, String label, Double laborCost) {
        if (parts == null || parts.isEmpty()) {
            return null;
        }
        // Build list of PartInfo for all parts
        List<EmailService.PartInfo> partInfos = parts.stream()
                .filter(part -> part != null)
                .map(part -> {
                    double unitCost = part.getUnitCost() != null ? part.getUnitCost().doubleValue() : 0.0;
                    return new EmailService.PartInfo(
                            part.getName(),
                            part.getPartNumber(),
                            part.getDescription(),
                            unitCost);
                })
                .collect(Collectors.toList());
        
        if (partInfos.isEmpty()) {
            return null;
        }
        
        double labor = laborCost != null ? laborCost : 0.0;
        return new EmailService.QuotationOption(label, partInfos, labor);
    }

    private String buildReminderCopy(QuotationEntity quotation) {
        Integer reminderHours = Optional.ofNullable(quotation.getReminderDelayHours())
                .orElse(Integer.parseInt(configurationService.getConfigurationValue("quotation.reminder.delay.hours", "24")));
        return "We'll automatically remind you again in " + reminderHours + " hour(s) if no action is taken.";
    }

    private String resolveSupportPhone() {
        return configurationService.getConfigurationValue("business.support.phone", "(02) 8700 1234");
    }

    public boolean hasApprovedSelection(String ticketNumber) {
        Optional<QuotationEntity> latest = quotationRepository.findTopByRepairTicketNumberOrderByCreatedAtDesc(ticketNumber);
        if (latest.isEmpty()) {
            return false;
        }
        QuotationEntity quotation = latest.get();
        if (!"APPROVED".equalsIgnoreCase(quotation.getStatus())) {
            return false;
        }
        String selection = quotation.getCustomerSelection();
        return selection != null && !selection.trim().isEmpty();
    }

    private Long safeParseLong(String value) {
        if (value == null) return null;
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return null;
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
            if (dto.getRecommendedPart() != null) {
                if (!dto.getRecommendedPart().isEmpty()) {
                    List<PartEntity> recommendedParts = partRepository.findAllById(dto.getRecommendedPart());
                    entity.setRecommendedPart(recommendedParts);
                } else {
                    // Explicitly empty array - clear recommended parts
                    entity.setRecommendedPart(new java.util.ArrayList<>());
                }
            }
            if (dto.getAlternativePart() != null) {
                if (!dto.getAlternativePart().isEmpty()) {
                    List<PartEntity> alternativeParts = partRepository.findAllById(dto.getAlternativePart());
                    entity.setAlternativePart(alternativeParts);
                } else {
                    // Explicitly empty array - clear alternative parts
                    entity.setAlternativePart(new java.util.ArrayList<>());
                }
            }
            if (dto.getNextReminderAt() != null) entity.setNextReminderAt(dto.getNextReminderAt());
            if (dto.getLastReminderSentAt() != null) entity.setLastReminderSentAt(dto.getLastReminderSentAt());

            QuotationEntity saved = quotationRepository.save(entity);
            logger.info("Quotation updated: {}", saved.getQuotationId());
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error updating quotation {}: {}", dto.getQuotationId(), e.getMessage(), e);
            throw new RuntimeException("Failed to update quotation", e);
        }
    }

    private QuotationDTO finalizeApproval(QuotationEntity entity, String customerSelection) {
        entity.setStatus("APPROVED");
        entity.setRespondedAt(LocalDateTime.now());
        entity.setCustomerSelection(customerSelection);

        if (customerSelection != null) {
            try {
                Long selectedPartId = Long.parseLong(customerSelection);
                PartEntity part = partRepository.findById(selectedPartId)
                        .orElseThrow(() -> new IllegalArgumentException("Selected part not found"));
                double unit = part.getUnitCost() != null ? part.getUnitCost().doubleValue() : 0.0;
                entity.setTotalCost(entity.getLaborCost() + unit);
                handleInventoryReservation(entity, part);
            } catch (NumberFormatException nfe) {
                logger.warn("Customer selection is not a valid part id: {}", customerSelection);
            }
        }

        entity.setExpiryAt(null);
        entity.setReminderDelayHours(null);
        entity.setNextReminderAt(null);
        entity.setLastReminderSentAt(null);
        entity.setReminderSendCount(null);

        QuotationEntity saved = quotationRepository.save(entity);
        notifyTechnicianOfApproval(saved);
        logger.info("Quotation approved: {}", saved.getQuotationId());
        
        // Auto-update ticket status from AWAITING_PARTS to REPAIRING
        try {
            RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(saved.getRepairTicketNumber())
                    .orElse(null);
            if (ticket != null && ticket.getRepairStatus() == RepairStatusEnum.AWAITING_PARTS) {
                UpdateRepairStatusRequestDTO statusUpdate = new UpdateRepairStatusRequestDTO();
                statusUpdate.setTicketNumber(ticket.getTicketNumber());
                statusUpdate.setRepairStatus(RepairStatusEnum.REPAIRING.name());
                repairTicketService.updateRepairStatus(statusUpdate);
                logger.info("Automatically updated ticket {} status from AWAITING_PARTS to REPAIRING after quotation approval", ticket.getTicketNumber());
            }
        } catch (Exception e) {
            logger.warn("Failed to auto-update ticket status after quotation approval: {}", e.getMessage(), e);
            // Don't fail the approval if status update fails
        }
        
        return toDTO(saved);
    }

    private void handleInventoryReservation(QuotationEntity entity, PartEntity part) {
        try {
            part.setIsCustomerPurchased(true);
            part.setDatePurchasedByCustomer(LocalDateTime.now());

            int warrantyDays = Integer.parseInt(configurationService.getConfigurationValue("part.customer.warranty.days", "365"));
            part.setWarrantyExpiration(LocalDateTime.now().plusDays(warrantyDays));

            part.setQuotationPart(1);
            part.setIsReserved(true);
            part.setReservedQuantity(1);
            part.setReservedForTicketId(entity.getRepairTicketNumber());

            if (part.getCurrentStock() != null && part.getCurrentStock() > 0) {
                part.setCurrentStock(part.getCurrentStock() - 1);
            }

            part.setDateModified(LocalDateTime.now());
            repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber())
                    .ifPresent(rt -> part.setModifiedBy(rt.getTechnicianEmail().getEmail()));

            partRepository.save(part);
            logger.info("Part {} updated after quotation approval (customer purchased)", part.getPartId());

            try {
                WarrantyEntity warranty = new WarrantyEntity();
                RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber()).orElse(null);
                if (ticket != null) {
                    warranty.setCustomerFirstName(ticket.getCustomerFirstName() == null ? "UNKNOWN" : ticket.getCustomerFirstName());
                    warranty.setCustomerLastName(ticket.getCustomerLastName() == null ? "UNKNOWN" : ticket.getCustomerLastName());
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
                warrantyRepository.save(warranty);
                part.setWarranty(warranty);
                warranty.setItem(part);
                partRepository.save(part);
                logger.info("Warranty {} created and linked to part {}", warranty.getWarrantyId(), part.getPartId());
            } catch (Exception exw) {
                logger.warn("Failed to create/link warranty for part {}: {}", part.getPartId(), exw.getMessage());
            }
        } catch (Exception ex) {
            logger.warn("Failed to fully update part/warranty after quotation approval: {}", ex.getMessage());
        }
    }

    private void notifyTechnicianOfApproval(QuotationEntity entity) {
        try {
            NotificationDTO notif = new NotificationDTO();
            notif.setTicketNumber(entity.getRepairTicketNumber());
            notif.setStatus("QUOTATION_APPROVED");
            notif.setMessage("Customer approved quotation for " + entity.getRepairTicketNumber());
            repairTicketRepository.findByTicketNumber(entity.getRepairTicketNumber()).ifPresent(rt -> {
                notif.setRecipientEmail(rt.getTechnicianEmail().getEmail());
            });
            notificationService.sendNotification(notif);
        } catch (Exception e) {
            logger.warn("Failed to send approval notification", e);
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
        dto.setRecommendedPart(entity.getRecommendedPart() != null 
            ? entity.getRecommendedPart().stream().map(PartEntity::getPartId).collect(Collectors.toList())
            : new java.util.ArrayList<>());
        dto.setAlternativePart(entity.getAlternativePart() != null 
            ? entity.getAlternativePart().stream().map(PartEntity::getPartId).collect(Collectors.toList())
            : new java.util.ArrayList<>());
        dto.setNextReminderAt(entity.getNextReminderAt());
        dto.setLastReminderSentAt(entity.getLastReminderSentAt());
        dto.setReminderSendCount(entity.getReminderSendCount());
        dto.setApprovalSummarySentAt(entity.getApprovalSummarySentAt());
        dto.setTechnicianOverride(entity.getTechnicianOverride());
        dto.setOverrideNotes(entity.getOverrideNotes());
        dto.setOverrideTimestamp(entity.getOverrideTimestamp());
        return dto;
    }
}

