package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class UpdateFullNameRequestDTO {
    private String newFirstName;
    private String newLastName;
}