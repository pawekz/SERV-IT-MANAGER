package com.servit.servit.dto;

import lombok.Data;

@Data
public class VerifyResetPasswordOtpRequestDTO {
    private String email;
    private String otp;
}
