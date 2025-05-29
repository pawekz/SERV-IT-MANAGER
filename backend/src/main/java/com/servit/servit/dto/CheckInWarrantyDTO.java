package com.servit.servit.dto;

import com.servit.servit.enumeration.WarrantyStatus;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public class CheckInWarrantyDTO {
    private Long warrantyNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhoneNumber;
    private WarrantyStatus status;
    private String returnReason;
    private LocalDate expirationDate;
    private Long partId;
    private List<MultipartFile> repairPhotos;

}
