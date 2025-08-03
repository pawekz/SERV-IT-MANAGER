package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class VerifyOtpRequestDTO {
    private String email;
    private String otp;
    private Integer type;
}