package com.servit.servit.dto.quotation;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class QuotationDTO {
    private Long quotationId;
    private String repairTicketNumber;
    private List<Long> partIds;
    private Double laborCost;
    private Double totalCost;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private String customerSelection;

    // Scheduling helpers
    private LocalDateTime expiryAt;
    private Integer reminderDelayHours;
}