package com.servit.servit.dto;

import com.servit.servit.enumeration.PartEnum;
import lombok.Data;

import java.time.LocalDate;

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
