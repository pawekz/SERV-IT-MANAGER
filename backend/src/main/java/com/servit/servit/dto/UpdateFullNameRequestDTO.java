package com.servit.servit.dto;

import lombok.Data;

@Data
public class UpdateFullNameRequestDTO {
    private String newFirstName;
    private String newLastName;
}