package com.servit.servit.dto.repairticket;

import lombok.Data;

@Data
public class UpdateRepairStatusRequestDTO {
    private String ticketNumber;
    private String repairStatus;
}