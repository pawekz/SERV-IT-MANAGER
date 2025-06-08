package com.servit.servit.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PartNumberStockSummaryDTO {
    private String partNumber;
    private String partName;
    private Integer lowStockThreshold;
    private Integer currentTotalStock; // Count of individual parts (recommended)
    private Integer currentAvailableStock;
    private Integer reservedStock;
    private Integer totalStockSum; // Sum of currentStock fields (for reference)
    private Boolean isLowStockAlertActive;
    private LocalDateTime lastAlertTriggered;
    private LocalDateTime alertResolvedAt;
    private Integer totalPartsCount;
    private Integer suppliersCount;
    private String priorityLevel;
    private String stockStatus; // CRITICAL, LOW, NORMAL, GOOD
    private LocalDateTime lastStockUpdate;
    private List<String> availableSuppliers;
    private String notes;
    
    // Calculated fields
    private String alertLevel; // NONE, WARNING, CRITICAL
} 