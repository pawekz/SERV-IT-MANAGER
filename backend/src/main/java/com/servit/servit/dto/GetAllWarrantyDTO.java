package com.servit.servit.dto;

import com.servit.servit.enumeration.WarrantyStatus;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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
    private String serialNumber;
    private List<String> repairPhotosUrls;
}
