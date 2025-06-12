package com.servit.servit.dto;

import com.servit.servit.enumeration.PartEnum;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BulkAddPartRequestDTO {
    // Common information for all parts
    private String basePartNumber; // Will be appended with sequence number
    private String name;
    private String description;
    private BigDecimal unitCost;
    private Integer stockPerItem; // Stock quantity for each individual part
    private Integer lowStockThreshold;
    private PartEnum partType = PartEnum.STANDARD;
    private String addedBy;
    
    // Supplier information (for SUPPLIER_REPLACEMENT parts)
    private String supplierName;
    private String supplierPartNumber;
    private LocalDateTime supplierOrderDate;
    private LocalDateTime supplierExpectedDelivery;
    
    // Individual serial numbers for each part
    private List<String> serialNumbers;
    
    // Validation method
    public boolean isValid() {
        return serialNumbers != null && !serialNumbers.isEmpty() &&
               basePartNumber != null && !basePartNumber.trim().isEmpty() &&
               name != null && !name.trim().isEmpty();
    }
} 