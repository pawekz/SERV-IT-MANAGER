package com.servit.servit.dto.part;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SupplierReplacementRequestDTO {
    private String supplierName;
    private String supplierPartNumber;
    private String serialNumber;
    private String name;
    private String description;
    private BigDecimal unitCost;
    private Integer quantity;
    private String originatingRepairTicketId; // The repair ticket this replacement is for
    private LocalDateTime supplierOrderDate;
    private LocalDateTime actualDeliveryDate;
    private String receivedBy; // Receiving clerk username
    private String notes;
} 