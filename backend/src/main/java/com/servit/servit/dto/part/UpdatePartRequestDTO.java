package com.servit.servit.dto.part;

import com.servit.servit.enumeration.PartEnum;
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
    private Integer lowStockThreshold;
    private String serialNumber;
    private PartEnum partType;
    private Boolean isDeleted;
    private LocalDateTime dateAdded;
    private LocalDateTime datePurchasedByCustomer;
    private LocalDateTime warrantyExpiration;
    private String addedBy;
    private String modifiedBy;

    private String customerFirstName;
    private String customerLastName;
    private String customerPhone;
    private String customerEmail;

    // Supplier information (for SUPPLIER_REPLACEMENT parts)
    private String supplierName;
    private String supplierPartNumber;
    private LocalDateTime supplierOrderDate;
    private LocalDateTime supplierExpectedDelivery;
    private LocalDateTime supplierActualDelivery;
    
    // New warranty-related fields
    private Boolean isCustomerPurchased;

    private String brand;
    private String model;

    // URL to the part's picture
    private String partPhotoUrl;
}
