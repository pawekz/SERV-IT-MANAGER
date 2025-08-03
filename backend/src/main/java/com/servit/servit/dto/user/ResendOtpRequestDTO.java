package com.servit.servit.dto.user;

import lombok.Data;

@Data
public class ResendOtpRequestDTO {
    private String email;
    private Integer type;
}
