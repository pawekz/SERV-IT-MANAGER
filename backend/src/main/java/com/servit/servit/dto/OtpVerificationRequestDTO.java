package com.servit.servit.dto;

import lombok.Data;

@Data
public class OtpVerificationRequestDTO {
    private String email;
    private String otp;
}