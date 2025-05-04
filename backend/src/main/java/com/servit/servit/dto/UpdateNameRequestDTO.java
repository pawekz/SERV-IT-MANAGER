package com.servit.servit.dto;

import lombok.Data;

@Data
public class UpdateNameRequestDTO {
    private String newFirstName;
    private String newLastName;
}