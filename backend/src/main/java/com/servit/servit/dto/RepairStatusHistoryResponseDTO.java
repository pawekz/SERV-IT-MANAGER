package com.servit.servit.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RepairStatusHistoryResponseDTO {
    private String repairStatus;
    private String notes;
    private String updatedBy;
    private LocalDateTime timestamp;
}