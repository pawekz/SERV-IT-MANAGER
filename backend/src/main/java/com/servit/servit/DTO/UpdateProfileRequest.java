package com.servit.servit.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private String email;
}