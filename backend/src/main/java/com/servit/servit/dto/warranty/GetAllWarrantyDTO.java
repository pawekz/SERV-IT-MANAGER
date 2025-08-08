package com.servit.servit.dto.warranty;

import com.servit.servit.enumeration.WarrantyStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class GetAllWarrantyDTO {
    private String warrantyNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhoneNumber;
    private WarrantyStatus status;
    private String reportedIssue;
    private String returnReason;
    private LocalDateTime expirationDate;
    private String deviceName;
    private String deviceType;
    private String techObservation;
    private String serialNumber;
    private String brand;
    private String model;
    private String kind;
    private List<String> warrantyPhotosUrls;
}
