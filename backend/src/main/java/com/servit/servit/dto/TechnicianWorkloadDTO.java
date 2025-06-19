package com.servit.servit.dto;

import lombok.Data;

@Data
public class TechnicianWorkloadDTO {
    private Integer userId;
    private String firstName;
    private String lastName;
    private String email;
    private int ticketCount;
}