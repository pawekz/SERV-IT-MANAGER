package com.servit.servit.dto.part;

import com.servit.servit.enumeration.PartEnum;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AddPartRequestDTO {
    private String partNumber;
    private String name;
    private String description;
    private BigDecimal unitCost;
    private Integer currentStock;
    private Integer lowStockThreshold;
    private String serialNumber;
    private PartEnum partType = PartEnum.STANDARD;
    private LocalDateTime dateAdded;
    private LocalDateTime datePurchasedByCustomer;
    private LocalDateTime warrantyExpiration;
    private String addedBy;
    
    // Supplier information (for SUPPLIER_REPLACEMENT parts)
    private String supplierName;
    private String supplierPartNumber;
    private LocalDateTime supplierOrderDate;
    private LocalDateTime supplierExpectedDelivery;

    private String brand;
    private String model;
    
    // New field to indicate if we're adding to an existing part number
    private Boolean addToExisting = false;
} 