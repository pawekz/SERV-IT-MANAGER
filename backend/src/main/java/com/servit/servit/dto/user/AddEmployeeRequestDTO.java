package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class AddEmployeeRequestDTO {
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
} 