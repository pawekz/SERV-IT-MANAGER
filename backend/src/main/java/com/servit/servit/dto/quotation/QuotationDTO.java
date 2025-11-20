package com.servit.servit.dto.quotation;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuotationDTO {
    private Long quotationId;
    private String repairTicketNumber;
    private List<Long> partIds;
    private Long technicianRecommendedPartId;
    private Long technicianAlternativePartId;
    private Double laborCost;
    private Double totalCost;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private String customerSelection;

    // Scheduling helpers
    private LocalDateTime expiryAt;
    private Integer reminderDelayHours;

    // Reminder/audit metadata
    private LocalDateTime nextReminderAt;
    private LocalDateTime lastReminderSentAt;
    private Integer reminderSendCount;
    private LocalDateTime approvalSummarySentAt;

    // Override logging
    private Boolean technicianOverride;
    private String overrideTechnicianName;
    private LocalDateTime overrideTimestamp;
    private String overrideNotes;
}