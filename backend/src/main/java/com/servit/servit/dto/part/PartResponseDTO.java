package com.servit.servit.dto.part;

import com.servit.servit.enumeration.PartEnum;
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
    private PartEnum partType;
    private Boolean isDeleted;
    private LocalDateTime dateAdded;
    private LocalDateTime dateModified;
    private LocalDateTime datePurchasedByCustomer;
    private LocalDateTime warrantyExpiration;
    private String addedBy;
    private String modifiedBy;
    private Integer quotationPart;
    private Boolean isReserved;
    private Integer reservedQuantity;
    private String reservedForTicketId;
    
    // Supplier information
    private String supplierName;
    private String supplierPartNumber;
    private LocalDateTime supplierOrderDate;
    private LocalDateTime supplierExpectedDelivery;
    private LocalDateTime supplierActualDelivery;
    
    // Calculated fields
    private String availabilityStatus;
    private Integer availableStock; // currentStock - reservedQuantity
    private Long version;

    private Boolean isCustomerPurchased;

    private String brand;
    private String model;

    // Customer snapshot included in response
    private Integer customerId;
    private String customerFirstName;
    private String customerLastName;
    private String customerPhone;
    private String customerEmail;

    // URL to the part's picture
    private String partPhotoUrl;
}
