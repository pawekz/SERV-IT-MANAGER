package com.servit.servit.dto;

import com.servit.servit.entity.PartEntity;
import com.servit.servit.enumeration.WarrantyStatus;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Data
public class CheckInWarrantyDTO {
    private String warrantyNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhoneNumber;
    private String returnReason;
    private String reportedIssue;
    private String serialNumber;
//    private MultipartFile digitalSignature;
//    private List<MultipartFile> warrantyPhotos;

}
