package com.servit.servit.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChangeUserRoleRequest {
    private String role;
}