package com.servit.servit.dto;

import lombok.Data;

@Data
public class UpdatePartNumberStockTrackingDTO {
    private String partNumber;
    private String partName;
    private Integer lowStockThreshold;
    private String priorityLevel; // CRITICAL, HIGH, NORMAL, LOW
    private String notes;
} 