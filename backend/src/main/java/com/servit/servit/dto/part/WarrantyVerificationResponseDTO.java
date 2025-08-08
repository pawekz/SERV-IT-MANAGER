package com.servit.servit.dto.part;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WarrantyVerificationResponseDTO {
    private String warrantyClass; // AUTO_REPLACEMENT, IN_WARRANTY_REPAIR, OUT_OF_WARRANTY_CHARGEABLE, PENDING_ADMIN_REVIEW
    private Boolean isInWarranty;
    private String warrantyStatus;
    private LocalDateTime warrantyExpiration;
    private Long daysFromPurchase;
    private Boolean requiresSupplierReplacement;
    private String nextWorkflow; // Which workflow to trigger next
    private String ticketStatus; // New status for the repair ticket
    private String message; // Human readable explanation
} 