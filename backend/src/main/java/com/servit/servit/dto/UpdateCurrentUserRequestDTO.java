package com.servit.servit.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateCurrentUserRequestDTO {
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
}