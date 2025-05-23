package com.servit.servit.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class CheckInRepairTicketRequestDTO {
    private String customerName;
    private String customerEmail;
    private String customerPhoneNumber;
    private String deviceType;
    private String deviceColor;
    private String deviceSerialNumber;
    private String deviceModel;
    private String deviceBrand;
    private String devicePassword;
    private String reportedIssue;
    private MultipartFile digitalSignature;
    private List<MultipartFile> repairPhotos;
}