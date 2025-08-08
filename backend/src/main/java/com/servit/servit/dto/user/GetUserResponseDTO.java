package com.servit.servit.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GetUserResponseDTO {
    private Integer userId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String phoneNumber;
    private String status;
    private String profilePictureUrl;
}