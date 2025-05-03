package com.servit.servit.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateUserRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
}