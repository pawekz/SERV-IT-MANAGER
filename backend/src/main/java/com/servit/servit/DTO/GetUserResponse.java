package com.servit.servit.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GetUserResponse {
    private Integer userId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
}