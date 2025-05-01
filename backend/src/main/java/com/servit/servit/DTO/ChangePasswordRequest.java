package com.servit.servit.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChangePasswordRequest {
    private String currentPassword;
    private String newPassword;
}