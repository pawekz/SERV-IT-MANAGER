package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class VerifyOnboardingCodeRequestDTO {
    private String email;
    private String onboardingCode;
} 