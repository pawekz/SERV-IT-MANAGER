package com.servit.servit.dto.repairticket;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RecentUpdateDTO {
    private String eventType; // TICKET_CREATED, STATUS_CHANGED, QUOTATION_CREATED, QUOTATION_UPDATED, PARTS_ORDERED, etc.
    private String ticketNumber;
    private String message; // Human-readable message
    private LocalDateTime timestamp;
    private String status; // Optional: current or new status
    private String updatedBy; // Optional: who made the update
}

