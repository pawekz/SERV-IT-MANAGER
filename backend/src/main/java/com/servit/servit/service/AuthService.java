package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

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
        logger.debug("Attempting authentication for identifier: {}", req.getIdentifier());
        
        UserEntity user = userRepo.findByEmail(req.getIdentifier())
                .or(() -> userRepo.findByUsername(req.getIdentifier()))
                .orElseThrow(() -> {
                    logger.error("User not found for identifier: {}", req.getIdentifier());
                    return new IllegalArgumentException("Invalid credentials");
                });

        logger.debug("Found user: {}, role: {}", user.getUsername(), user.getRole());

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            logger.error("Invalid password for user: {}", user.getUsername());
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber(), user.getIsVerified());
        logger.debug("Generated token for user: {} with role: {}", user.getUsername(), user.getRole());
        
        return new AuthResponseDTO(token, user.getRole().name(), user.getIsVerified(), user.getStatus());
    }
}
