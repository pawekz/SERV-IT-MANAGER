package com.servit.servit.dto.warranty;

import lombok.Data;

@Data
public class CheckInWarrantyDTO {
    private String warrantyNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhoneNumber;
    private String returnReason;
    private String reportedIssue;
    private String serialNumber;

}
