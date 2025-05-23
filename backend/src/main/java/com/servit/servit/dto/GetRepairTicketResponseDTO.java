package com.servit.servit.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class GetRepairTicketResponseDTO {
    private String ticketNumber;
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
    private String status;
    private LocalDate checkInDate;

    private String digitalSignatureImageUrl;
    private List<String> repairPhotosUrls;

    private boolean isSignatureLinked;

    public boolean isSignatureLinked() {
        return digitalSignatureImageUrl != null && !digitalSignatureImageUrl.isEmpty();
    }
}
