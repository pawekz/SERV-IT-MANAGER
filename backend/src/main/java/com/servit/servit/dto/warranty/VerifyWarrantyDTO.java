package com.servit.servit.dto.warranty;

import lombok.Data;

@Data
public class VerifyWarrantyDTO {
    Boolean withinWarranty;
    String message;
    String deviceName;
    String deviceType;
    String serialNumber;
    Long daysLeft;
    String brand;
    String model;
}
