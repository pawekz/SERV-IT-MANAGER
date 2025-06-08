package com.servit.servit.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WarrantyVerificationRequestDTO {
    private String deviceSerialNumber;
    private String deviceModel;
    private String deviceBrand;
    private String repairTicketId;
    private Boolean isTampered; // From check-in form
    private LocalDateTime purchaseDate;
    private LocalDateTime warrantyExpiration;
    private String retailerInfo;
} 