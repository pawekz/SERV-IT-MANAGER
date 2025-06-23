package com.servit.servit.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class UpdateWarrantyStatusDTO {
    private String warrantyNumber;
    private String status;
    private String returnReason;
    private String techObservation;
    private String technicianEmail;
    private String color;
    private String password;
    private String accessories;
    private String deviceType;
    private List<MultipartFile> warrantyPhotosUrls;
}
