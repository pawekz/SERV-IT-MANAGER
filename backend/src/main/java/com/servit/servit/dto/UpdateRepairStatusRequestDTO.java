package com.servit.servit.dto;

import lombok.Data;

@Data
public class UpdateRepairStatusRequestDTO {
    private String ticketNumber;
    private String repairStatus;
}