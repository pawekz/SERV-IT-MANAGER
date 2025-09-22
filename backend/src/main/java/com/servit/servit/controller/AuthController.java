package com.servit.servit.controller;

import com.servit.servit.dto.auth.AuthResponseDTO;
import com.servit.servit.dto.auth.LoginRequestDTO;
import com.servit.servit.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    //login for CUSTOMER
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO req) {
        try {
            AuthResponseDTO response = authService.authenticate(req);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Internal server error"));
        }
    }

    //login for staff (ADMINISTRATOR and TECHNICIAN)
    @PostMapping("/login/staff")
    public ResponseEntity<?> staffLogin(@RequestBody LoginRequestDTO req) {
        try {
            AuthResponseDTO response = authService.authenticateStaff(req);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Internal server error"));
        }
    }
}