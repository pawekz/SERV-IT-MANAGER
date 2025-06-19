package com.servit.servit.dto;

import lombok.Data;

@Data
public class AssignTechnicianRequestDTO {
    private String ticketNumber;
    private String technicianEmail;
}
