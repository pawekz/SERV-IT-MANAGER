package com.servit.servit.dto.auth;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class LoginRequestDTO {
    private String identifier;
    private String password;
}