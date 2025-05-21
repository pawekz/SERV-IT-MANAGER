package com.servit.servit.dto;

import lombok.Data;

@Data
public class ResetPasswordRequestDTO {
    private String email;
    private String newPassword;
}
