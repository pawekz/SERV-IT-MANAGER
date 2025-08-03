package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class ResetPasswordRequestDTO {
    private String email;
    private String newPassword;
}
