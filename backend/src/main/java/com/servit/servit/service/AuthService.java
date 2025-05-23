package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private final UserRepository userRepo;

    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepo, PasswordEncoder encoder, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponseDTO authenticate(LoginRequestDTO req) {
        UserEntity user = userRepo.findByEmail(req.getIdentifier())
                .or(() -> userRepo.findByUsername(req.getIdentifier()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber(), user.getIsVerified());
        return new AuthResponseDTO(token, user.getRole().name(), user.getIsVerified(), user.getStatus());
    }
}
