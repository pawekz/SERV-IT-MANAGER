package com.servit.servit.dto;

import lombok.Data;

@Data
public class VerifyOnboardingCodeRequestDTO {
    private String email;
    private String onboardingCode;
} 