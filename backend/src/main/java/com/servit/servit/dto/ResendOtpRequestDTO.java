package com.servit.servit.dto;

import lombok.Data;

@Data
public class ResendOtpRequestDTO {
    private String email;
    private Integer type;
}
