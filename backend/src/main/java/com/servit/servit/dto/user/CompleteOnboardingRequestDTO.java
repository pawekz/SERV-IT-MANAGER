package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class CompleteOnboardingRequestDTO {
    private String email;
    private String onboardingCode;
    private String password;
} 