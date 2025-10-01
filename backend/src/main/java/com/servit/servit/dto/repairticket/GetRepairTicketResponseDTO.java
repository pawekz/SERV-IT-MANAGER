package com.servit.servit.dto.repairticket;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class GetRepairTicketResponseDTO {
    private String ticketNumber;
    private String customerName; // legacy full name
    private String customerFirstName; // new split field
    private String customerLastName;  // new split field
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
    private Long repairTicketId;

    private List<String> repairPhotosUrls;
    private List<String> afterRepairPhotosUrls;
}