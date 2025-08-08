package com.servit.servit.dto.user;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChangeCurrentUserPasswordRequestDTO {
    private String currentPassword;
    private String newPassword;
}