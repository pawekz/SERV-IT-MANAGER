package com.servit.servit.controller;

import com.servit.servit.dto.auth.AuthResponseDTO;
import com.servit.servit.dto.auth.LoginRequestDTO;
import com.servit.servit.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    //login for CUSTOMER
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO req) {
        try {
            AuthResponseDTO response = authService.authenticate(req);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    //login for staff (ADMINISTRATOR and TECHNICIAN)
    @PostMapping("/login/staff")
    public ResponseEntity<AuthResponseDTO> staffLogin(@RequestBody LoginRequestDTO req) {
        try {
            AuthResponseDTO response = authService.authenticateStaff(req);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}