package com.servit.servit.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PartResponseDTO {
    private Long id;
    private String partNumber;
    private String name;
    private String description;
    private BigDecimal unitCost;
    private Integer currentStock;
    private Integer lowStockThreshold;
    private String serialNumber;
    private Boolean isDeleted;
    private LocalDateTime dateAdded;
    private LocalDateTime datePurchasedByCustomer;
    private LocalDateTime warrantyExpiration;
    private String addedBy;
    private Integer quotationPart;
    private Boolean isReserved;
} 