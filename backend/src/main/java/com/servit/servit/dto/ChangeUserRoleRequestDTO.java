package com.servit.servit.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ChangeUserRoleRequestDTO {
    private String role;
}