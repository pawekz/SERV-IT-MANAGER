package com.servit.servit.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UpdatePartRequestDTO {
    private String partNumber;
    private String name;
    private String description;
    private BigDecimal unitCost;
    private Integer currentStock;
    private Integer lowStockThreshold; // Renamed from minimumStock
    private String serialNumber;
    private Boolean active; // Allow updating active status
    private LocalDateTime dateAdded; // Added dateAdded
    private LocalDateTime datePurchasedByCustomer; // Added datePurchasedByCustomer
    private LocalDateTime warrantyExpiration; // Added warrantyExpiration
    private String addedBy; // Added addedBy
} 