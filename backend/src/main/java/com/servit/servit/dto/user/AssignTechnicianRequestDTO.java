package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class AssignTechnicianRequestDTO {
    private String ticketNumber;
    private String technicianEmail;
}
