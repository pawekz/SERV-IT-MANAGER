package com.servit.servit.service;

import com.servit.servit.dto.auth.AuthResponseDTO;
import com.servit.servit.dto.auth.LoginRequestDTO;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.enumeration.UserRoleEnum;
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
        UserEntity user = userRepo.findByEmail(req.getIdentifier())
                .or(() -> userRepo.findByUsername(req.getIdentifier()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getRole() != UserRoleEnum.CUSTOMER) {
            logger.warn("Non-customer tried to login via /login: {}", user.getUsername());
            throw new IllegalArgumentException("Access denied");
        }
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            logger.error("Invalid password for customer: {}", user.getUsername());
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber(), user.getIsVerified());
        return new AuthResponseDTO(token, user.getRole().name(), user.getIsVerified(), user.getStatus());
    }

    public AuthResponseDTO authenticateStaff(LoginRequestDTO req) {
        UserEntity user = userRepo.findByEmail(req.getIdentifier())
                .or(() -> userRepo.findByUsername(req.getIdentifier()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getRole() == UserRoleEnum.CUSTOMER) {
            logger.warn("Customer tried to login via staff endpoint: {}", user.getUsername());
            throw new IllegalArgumentException("Access denied");
        }
        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            logger.error("Invalid password for staff: {}", user.getUsername());
            throw new IllegalArgumentException("Invalid credentials");
        }
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber(), user.getIsVerified());
        return new AuthResponseDTO(token, user.getRole().name(), user.getIsVerified(), user.getStatus());
    }
}
