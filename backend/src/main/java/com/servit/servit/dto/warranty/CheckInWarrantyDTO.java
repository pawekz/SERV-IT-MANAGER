package com.servit.servit.dto.warranty;

import lombok.Data;

@Data
public class CheckInWarrantyDTO {
    private String warrantyNumber;
    private String customerFirstName;
    private String customerLastName;
    private String customerEmail;
    private String customerPhoneNumber;
    private String returnReason;
    private String reportedIssue;
    private String serialNumber;

}
