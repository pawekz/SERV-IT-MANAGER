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
    private String technicianEmail;
    private String technicianName;
    private String accessories;
    private String observations;
    private String reportedIssue;
    private String repairStatus;
    private LocalDate checkInDate;

    private List<String> repairPhotosUrls;
}