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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
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
        logger.info("Customer authentication attempt for identifier: {}", req.getIdentifier());

        try {
            validateLoginRequest(req);

            UserEntity user = findUserByIdentifier(req.getIdentifier());

            validateCustomerAccess(user);
            validatePassword(req.getPassword(), user.getPassword(), user.getUsername());

            String token = generateUserToken(user);

            logger.info("Customer authentication successful for user: {}", user.getUsername());
            return new AuthResponseDTO(token, user.getRole().name(), user.getIsVerified(), user.getStatus());

        } catch (AuthenticationException e) {
            logger.error("Customer authentication failed for identifier: {} - {}", req.getIdentifier(), e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during customer authentication for identifier: {}", req.getIdentifier(), e);
            throw new AuthenticationException("Authentication failed due to system error") {};
        }
    }

    public AuthResponseDTO authenticateStaff(LoginRequestDTO req) {
        logger.info("Staff authentication attempt for identifier: {}", req.getIdentifier());

        try {
            validateLoginRequest(req);

            UserEntity user = findUserByIdentifier(req.getIdentifier());

            validateStaffAccess(user);
            validatePassword(req.getPassword(), user.getPassword(), user.getUsername());

            String token = generateUserToken(user);

            logger.info("Staff authentication successful for user: {} with role: {}", user.getUsername(), user.getRole());
            return new AuthResponseDTO(token, user.getRole().name(), user.getIsVerified(), user.getStatus());

        } catch (AuthenticationException e) {
            logger.error("Staff authentication failed for identifier: {} - {}", req.getIdentifier(), e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during staff authentication for identifier: {}", req.getIdentifier(), e);
            throw new AuthenticationException("Authentication failed due to system error") {};
        }
    }

    private void validateLoginRequest(LoginRequestDTO req) {
        if (req == null) {
            throw new BadCredentialsException("Login request cannot be null");
        }
        if (req.getIdentifier() == null || req.getIdentifier().trim().isEmpty()) {
            throw new BadCredentialsException("Username/email is required");
        }
        if (req.getPassword() == null || req.getPassword().trim().isEmpty()) {
            throw new BadCredentialsException("Password is required");
        }
    }

    private UserEntity findUserByIdentifier(String identifier) {
        return userRepo.findByEmail(identifier)
                .or(() -> userRepo.findByUsername(identifier))
                .orElseThrow(() -> new BadCredentialsException("Incorrect username or password"));
    }

    private void validateCustomerAccess(UserEntity user) {
        if (user.getRole() != UserRoleEnum.CUSTOMER) {
            throw new BadCredentialsException("User does not exist");
        }
    }

    private void validateStaffAccess(UserEntity user) {
        if (user.getRole() == UserRoleEnum.CUSTOMER) {
            throw new BadCredentialsException("User does not exist");
        }
    }

    private void validatePassword(String rawPassword, String encodedPassword, String username) {
        if (!encoder.matches(rawPassword, encodedPassword)) {
            throw new BadCredentialsException("Incorrect username or password");
        }
    }

    private String generateUserToken(UserEntity user) {
        try {
            return jwtUtil.generateToken(
                    user.getUsername(),
                    user.getRole().name(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getEmail(),
                    user.getPhoneNumber(),
                    user.getIsVerified()
            );
        } catch (Exception e) {
            logger.error("Error generating JWT token for user: {}", user.getUsername(), e);
            throw new AuthenticationException("Authentication failed due to system error") {};
        }
    }
}