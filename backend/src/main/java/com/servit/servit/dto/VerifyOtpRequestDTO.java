package com.servit.servit.dto;

import lombok.Data;

@Data
public class VerifyOtpRequestDTO {
    private String email;
    private String otp;
    private Integer type;
}