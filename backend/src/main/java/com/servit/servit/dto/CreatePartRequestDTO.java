package com.servit.servit.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreatePartRequestDTO {
    private String partNumber;
    private String name;
    private String description;
    private BigDecimal unitCost;
    private Integer currentStock;
    private Integer lowStockThreshold;
    private String serialNumber;
    private LocalDateTime dateAdded;
    private LocalDateTime datePurchasedByCustomer;
    private LocalDateTime warrantyExpiration;
    private String addedBy;
    // 'active', 'createdAt', 'updatedAt', 'id' are managed by backend/database
} 