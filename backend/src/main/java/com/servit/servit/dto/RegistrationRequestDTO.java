package com.servit.servit.dto;

import lombok.Data;

@Data
public class RegistrationRequestDTO {
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
}