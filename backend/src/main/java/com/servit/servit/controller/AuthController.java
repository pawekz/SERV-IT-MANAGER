package com.servit.servit.controller;

import com.servit.servit.dto.auth.AuthResponseDTO;
import com.servit.servit.dto.auth.LoginRequestDTO;
import com.servit.servit.service.AuthService;
import org.springframework.http.ResponseEntity;
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
        return ResponseEntity.ok(authService.authenticate(req));
    }
    //login for staff (ADMINISTRATOR and TECHNICIAN)
    @PostMapping("/login/staff")
    public ResponseEntity<AuthResponseDTO> staffLogin(@RequestBody LoginRequestDTO req) {
        return ResponseEntity.ok(authService.authenticateStaff(req));
    }
}
