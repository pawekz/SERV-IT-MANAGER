package com.servit.servit.dto;

import com.servit.servit.enumeration.WarrantyStatus;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Data
public class GetAllWarrantyDTO {
    private Long warrantyNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhoneNumber;
    private WarrantyStatus status;
    private String reportedIssue;
    private String returnReason;
    private LocalDate expirationDate;
    private Long partId;
    private List<String> repairPhotosUrls;
}
