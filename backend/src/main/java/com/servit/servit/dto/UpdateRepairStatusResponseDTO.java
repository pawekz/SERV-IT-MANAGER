package com.servit.servit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateRepairStatusResponseDTO {
    private String ticketNumber;
    private String newStatus;
    private String message;
} 