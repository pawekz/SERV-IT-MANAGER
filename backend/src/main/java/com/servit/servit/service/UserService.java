package com.servit.servit.service;

import com.servit.servit.dto.user.*;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.RepairTicketRepository;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.enumeration.UserRoleEnum;
import com.servit.servit.util.FileUtil;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private final UserRepository userRepo;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private RepairTicketRepository repairTicketRepository;

    @Autowired
    private FileUtil fileUtil;

    @Autowired
    private S3Service s3Service;

    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    public UserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // USER SIDE

    public GetUserResponseDTO getCurrentUser() {
        try {
            logger.info("Fetching current user from security context");
            String username = SecurityContextHolder.getContext()
                    .getAuthentication().getName();

            UserEntity user = userRepo.findByUsername(username)
                    .orElseThrow(() -> {
                        logger.error("User not found for username: {}", username);
                        return new IllegalArgumentException("User not found");
                    });

            logger.info("Successfully retrieved current user: {}", user.getEmail());
            return new GetUserResponseDTO(
                    user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                    user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                    user.getStatus(), user.getProfilePictureUrl()
            );
        } catch (Exception e) {
            logger.error("Error fetching current user: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch current user", e);
        }
    }

    @Transactional
    public void register(RegistrationRequestDTO req) throws MessagingException {
        try {
            logger.info("Starting user registration for email: {}", req.getEmail());

            if (userRepo.findByEmail(req.getEmail()).isPresent()) {
                logger.warn("Registration failed - email already in use: {}", req.getEmail());
                throw new IllegalArgumentException("Email already in use");
            }

            if (userRepo.findByUsername(req.getUsername()).isPresent()) {
                logger.warn("Registration failed - username already in use: {}", req.getUsername());
                throw new IllegalArgumentException("Username already in use");
            }

            UserEntity user = new UserEntity();
            user.setFirstName(formatName(req.getFirstName()));
            user.setLastName(formatName(req.getLastName()));
            user.setEmail(req.getEmail());
            user.setUsername(req.getUsername());
            user.setPassword(passwordEncoder.encode(req.getPassword()));

            String rawPhone = req.getPhoneNumber().replaceAll("^\\+?63", "");
            user.setPhoneNumber("+63" + rawPhone);

            user.setRole(UserRoleEnum.CUSTOMER);
            user.setIsVerified(false);
            user.setStatus("Pending");

            userRepo.save(user);
            logger.info("User entity saved successfully for email: {}", req.getEmail());

            String otp = otpService.generateOtp(req.getEmail());
            emailService.sendOtpEmail(req.getEmail(), otp);
            logger.info("Registration completed successfully for email: {}", req.getEmail());

        } catch (IllegalArgumentException e) {
            logger.error("Registration validation error: {}", e.getMessage());
            throw e;
        } catch (MessagingException e) {
            logger.error("Email sending failed during registration for email: {}", req.getEmail(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during registration for email: {}", req.getEmail(), e);
            throw new RuntimeException("Registration failed", e);
        }
    }

    private String formatName(String name) {
        try {
            if (name == null) return null;
            String trimmed = name.trim();
            if (trimmed.isEmpty()) return trimmed;

            trimmed = trimmed.replaceAll("\\s+", " ");

            String lower = trimmed.toLowerCase();
            StringBuilder sb = new StringBuilder(lower.length());
            boolean capitalizeNext = true;
            for (int i = 0; i < lower.length(); i++) {
                char c = lower.charAt(i);
                if (capitalizeNext && Character.isLetter(c)) {
                    sb.append(Character.toUpperCase(c));
                    capitalizeNext = false;
                } else {
                    sb.append(c);
                }

                if (c == ' ' || c == '-' || c == '\'' || c == '’') {
                    capitalizeNext = true;
                }
            }
            return sb.toString();
        } catch (Exception e) {
            logger.warn("Error formatting name '{}': {}", name, e.getMessage());
            return name;
        }
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequestDTO req) {
        try {
            logger.info("OTP verification request: email={}, type={}", req.getEmail(), req.getType());

            UserEntity user = userRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", req.getEmail());
                        return new IllegalArgumentException("User not found");
                    });

            boolean otpValid = otpService.validateOtp(req.getEmail(), req.getOtp());
            logger.debug("OTP validation result: {}", otpValid);

            if (!otpValid) {
                logger.error("Invalid or expired OTP for email: {}", req.getEmail());
                throw new IllegalArgumentException("Invalid or expired OTP");
            }

            switch (req.getType()) {
                case 1: // Registration verification
                    if (user.getIsVerified()) {
                        logger.warn("User already verified: {}", user.getEmail());
                        throw new IllegalArgumentException("User is already verified");
                    }
                    user.setIsVerified(true);
                    user.setStatus("Active");
                    userRepo.save(user);
                    logger.info("User verified successfully: {}", user.getEmail());
                    break;
                case 2: // Forgot password
                    logger.info("OTP verified for forgot password: {}", user.getEmail());
                    break;
                default:
                    logger.error("Invalid type value: {}", req.getType());
                    throw new IllegalArgumentException("Invalid type");
            }
        } catch (IllegalArgumentException e) {
            logger.error("OTP verification error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during OTP verification for email: {}", req.getEmail(), e);
            throw new RuntimeException("OTP verification failed", e);
        }
    }

    @Transactional
    public void resendOtp(ResendOtpRequestDTO req) throws MessagingException {
        try {
            logger.info("Resending OTP for email: {}, type: {}", req.getEmail(), req.getType());

            UserEntity user = userRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", req.getEmail());
                        return new IllegalArgumentException("User not found");
                    });

            if (req.getType() == 1 && user.getIsVerified()) {
                logger.warn("Cannot resend OTP - user already verified: {}", req.getEmail());
                throw new IllegalArgumentException("User is already verified");
            }

            String newOtp = otpService.generateOtp(req.getEmail());

            if (req.getType() == 1) {
                emailService.sendOtpEmail(req.getEmail(), newOtp);
            } else if (req.getType() == 2) {
                emailService.sendForgotPasswordEmail(req.getEmail(), newOtp);
            } else {
                logger.error("Invalid OTP type: {}", req.getType());
                throw new IllegalArgumentException("Invalid type");
            }

            logger.info("OTP resent successfully for email: {}", req.getEmail());
        } catch (IllegalArgumentException e) {
            logger.error("Resend OTP validation error: {}", e.getMessage());
            throw e;
        } catch (MessagingException e) {
            logger.error("Email sending failed during OTP resend for email: {}", req.getEmail(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during OTP resend for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to resend OTP", e);
        }
    }

    @Transactional
    public void changeCurrentUserPassword(ChangeCurrentUserPasswordRequestDTO req) {
        try {
            logger.info("Password change request for current user");
            String username = SecurityContextHolder.getContext()
                    .getAuthentication().getName();

            UserEntity user = userRepo.findByUsername(username)
                    .orElseThrow(() -> {
                        logger.error("User not found for username: {}", username);
                        return new IllegalArgumentException("User not found");
                    });

            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                logger.warn("Password change failed - incorrect current password for user: {}", username);
                throw new IllegalArgumentException("Current password incorrect");
            }

            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
            userRepo.save(user);
            logger.info("Password changed successfully for user: {}", username);

        } catch (IllegalArgumentException e) {
            logger.error("Password change validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during password change", e);
            throw new RuntimeException("Failed to change password", e);
        }
    }

    @Transactional
    public void updateCurrentUserFullName(UpdateFullNameRequestDTO req) {
        try {
            logger.info("Full name update request for current user");
            String username = SecurityContextHolder.getContext()
                    .getAuthentication().getName();

            UserEntity user = userRepo.findByUsername(username)
                    .orElseThrow(() -> {
                        logger.error("User not found for username: {}", username);
                        return new IllegalArgumentException("User not found");
                    });

            user.setFirstName(formatName(req.getNewFirstName()));
            user.setLastName(formatName(req.getNewLastName()));
            userRepo.save(user);
            logger.info("Full name updated successfully for user: {}", username);

        } catch (IllegalArgumentException e) {
            logger.error("Full name update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during full name update", e);
            throw new RuntimeException("Failed to update full name", e);
        }
    }

    @Transactional
    public void updateProfilePicture(Integer userId, MultipartFile file) {
        logger.info("Updating profile picture for user ID: {}", userId);
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    logger.error("User not found for ID: {}", userId);
                    return new IllegalArgumentException("User not found");
                });

        String oldProfileUrl = user.getProfilePictureUrl();
        if (oldProfileUrl != null && !oldProfileUrl.equals("0") && !oldProfileUrl.isBlank()) {
            try {
                fileUtil.deleteProfilePicture(oldProfileUrl);
            } catch (Exception e) {
                logger.warn("Failed to delete old profile picture for user ID {}: {}", userId, e.getMessage());
            }
        }

        String profilePictureUrl;
        try {
            profilePictureUrl = fileUtil.saveProfilePicture(file, userId);
        } catch (Exception e) {
            logger.error("Failed to save new profile picture for user ID {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to save new profile picture", e);
        }
        user.setProfilePictureUrl(profilePictureUrl);
        userRepo.save(user);
        logger.info("Profile picture updated successfully for user ID: {}", userId);
    }

    @Transactional
    public void removeProfilePicture(Integer userId) {
        logger.info("Removing profile picture for user ID: {}", userId);
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    logger.error("User not found for ID: {}", userId);
                    return new IllegalArgumentException("User not found");
                });
        String oldProfileUrl = user.getProfilePictureUrl();
        if (oldProfileUrl != null && !oldProfileUrl.equals("0") && !oldProfileUrl.isBlank()) {
            try {
                fileUtil.deleteProfilePicture(oldProfileUrl);
            } catch (Exception e) {
                logger.warn("Failed to delete profile picture for user ID {}: {}", userId, e.getMessage());
            }
        }
        user.setProfilePictureUrl("0");
        userRepo.save(user);
        logger.info("Profile picture removed successfully for user ID: {}", userId);
    }

    @Transactional
    public void changeCurrentUserPhoneNumber(ChangePhoneNumberDTO req) {
        try {
            logger.info("Phone number change request for current user");
            String username = SecurityContextHolder.getContext()
                    .getAuthentication().getName();

            UserEntity user = userRepo.findByUsername(username)
                    .orElseThrow(() -> {
                        logger.error("User not found for username: {}", username);
                        return new IllegalArgumentException("User not found");
                    });

            user.setPhoneNumber(req.getNewPhoneNumber());
            userRepo.save(user);
            logger.info("Phone number updated successfully for user: {}", username);

        } catch (IllegalArgumentException e) {
            logger.error("Phone number update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during phone number update", e);
            throw new RuntimeException("Failed to update phone number", e);
        }
    }

    @Transactional
    public void updateCurrentUsername(UpdateUsernameRequestDTO req) {
        try {
            logger.info("Username update request for current user");
            String currentUsername = SecurityContextHolder.getContext()
                    .getAuthentication().getName();

            if (userRepo.findByUsername(req.getNewUsername()).isPresent()) {
                logger.warn("Username update failed - username already in use: {}", req.getNewUsername());
                throw new IllegalArgumentException("Username already in use");
            }

            UserEntity user = userRepo.findByUsername(currentUsername)
                    .orElseThrow(() -> {
                        logger.error("User not found for username: {}", currentUsername);
                        return new IllegalArgumentException("User not found");
                    });

            user.setUsername(req.getNewUsername());
            userRepo.save(user);
            logger.info("Username updated successfully from {} to {}", currentUsername, req.getNewUsername());

        } catch (IllegalArgumentException e) {
            logger.error("Username update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during username update", e);
            throw new RuntimeException("Failed to update username", e);
        }
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO req) throws MessagingException {
        try {
            logger.info("Forgot password request for email: {}", req.getEmail());

            UserEntity user = userRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", req.getEmail());
                        return new IllegalArgumentException("User not found");
                    });

            String otp = otpService.generateOtp(req.getEmail());
            emailService.sendForgotPasswordEmail(req.getEmail(), otp);
            logger.info("Forgot password email sent successfully for: {}", req.getEmail());

        } catch (IllegalArgumentException e) {
            logger.error("Forgot password validation error: {}", e.getMessage());
            throw e;
        } catch (MessagingException e) {
            logger.error("Email sending failed for forgot password: {}", req.getEmail(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during forgot password for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to process forgot password request", e);
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequestDTO req) {
        try {
            logger.info("Password reset request for email: {}", req.getEmail());

            UserEntity user = userRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", req.getEmail());
                        return new IllegalArgumentException("User not found");
                    });

            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
            userRepo.save(user);
            logger.info("Password reset successfully for email: {}", req.getEmail());

        } catch (IllegalArgumentException e) {
            logger.error("Password reset validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during password reset for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to reset password", e);
        }
    }

    // ADMIN SIDE

    @Transactional
    public void changeRole(Integer userId, String newRole) {
        try {
            logger.info("Role change request for user ID: {} to role: {}", userId, newRole);

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            UserRoleEnum roleEnum = UserRoleEnum.valueOf(newRole);
            user.setRole(roleEnum);
            userRepo.save(user);
            logger.info("Role changed successfully for user ID: {} to role: {}", userId, newRole);

        } catch (IllegalArgumentException e) {
            logger.error("Role change validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during role change for user ID: {}", userId, e);
            throw new RuntimeException("Failed to change user role", e);
        }
    }

    public Page<GetUserResponseDTO> getAllUsers(Pageable pageable) {
        try {
            logger.info("Fetching paginated users: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
            Page<UserEntity> page = userRepo.findAll(pageable);
            Page<GetUserResponseDTO> dtoPage = page.map(user -> new GetUserResponseDTO(
                    user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                    user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                    user.getStatus(), user.getProfilePictureUrl()));
            logger.info("Successfully fetched page with {} users (totalElements={})", dtoPage.getNumberOfElements(), dtoPage.getTotalElements());
            return dtoPage;
        } catch (Exception e) {
            logger.error("Error fetching paginated users: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch users", e);
        }
    }

    @Transactional
    public GetUserResponseDTO getUser(Integer id) {
        try {
            logger.info("Fetching user by id: {}", id);

            UserEntity user = userRepo.findById(id)
                    .orElseThrow(() -> {
                        logger.error("User not found for id: {}", id);
                        return new IllegalArgumentException("User not found");
                    });

            GetUserResponseDTO response = new GetUserResponseDTO(
                    user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                    user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                    user.getStatus(), user.getProfilePictureUrl());
            logger.info("Successfully fetched user by id: {}", id);
            return response;
        } catch (IllegalArgumentException e) {
            logger.error("Get user validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error fetching user by id: {}", id, e);
            throw new RuntimeException("Failed to fetch user", e);
        }
    }

    @Transactional
    public GetUserResponseDTO getUserByEmail(String email) {
        try {
            if (email == null || email.trim().isEmpty()) {
                throw new IllegalArgumentException("Email cannot be empty");
            }

            logger.info("Fetching user by email: {}", email);

            UserEntity user = userRepo.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", email);
                        return new IllegalArgumentException("User not found");
                    });

            GetUserResponseDTO response = new GetUserResponseDTO(
                    user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                    user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                    user.getStatus(), user.getProfilePictureUrl());
            logger.info("Successfully fetched user by email: {}", email);
            return response;
        } catch (IllegalArgumentException e) {
            logger.error("Get user by email validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error fetching user by email: {}", email, e);
            throw new RuntimeException("Failed to fetch user", e);
        }
    }

    @Transactional
    public void changePassword(Integer userId, String newPassword) {
        try {
            logger.info("Admin password change request for user ID: {}", userId);

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepo.save(user);
            logger.info("Password changed successfully by admin for user ID: {}", userId);

        } catch (IllegalArgumentException e) {
            logger.error("Admin password change validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during admin password change for user ID: {}", userId, e);
            throw new RuntimeException("Failed to change password", e);
        }
    }

    @Transactional
    public void updateEmail(Integer userId, String newEmail) {
        try {
            logger.info("Email update request for user ID: {} to email: {}", userId, newEmail);

            if (userRepo.findByEmail(newEmail).isPresent()) {
                logger.warn("Email update failed - email already in use: {}", newEmail);
                throw new IllegalArgumentException("Email already in use");
            }

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            user.setEmail(newEmail);
            user.setUsername(newEmail);
            userRepo.save(user);
            logger.info("Email updated successfully for user ID: {} to: {}", userId, newEmail);

        } catch (IllegalArgumentException e) {
            logger.error("Email update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during email update for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update email", e);
        }
    }

    @Transactional
    public void updateFullName(Integer userId, String newFirstName, String newLastName) {
        try {
            logger.info("Full name update request for user ID: {}", userId);

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            user.setFirstName(formatName(newFirstName));
            user.setLastName(formatName(newLastName));
            userRepo.save(user);
            logger.info("Full name updated successfully for user ID: {}", userId);

        } catch (IllegalArgumentException e) {
            logger.error("Full name update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during full name update for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update full name", e);
        }
    }

    @Transactional
    public void changePhoneNumber(Integer userId, String newPhoneNumber) {
        try {
            logger.info("Phone number change request for user ID: {}", userId);

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            user.setPhoneNumber(newPhoneNumber);
            userRepo.save(user);
            logger.info("Phone number updated successfully for user ID: {}", userId);

        } catch (IllegalArgumentException e) {
            logger.error("Phone number update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during phone number update for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update phone number", e);
        }
    }

    @Transactional
    public void updateUsername(Integer userId, String newUsername) {
        try {
            logger.info("Username update request for user ID: {} to username: {}", userId, newUsername);

            if (userRepo.findByUsername(newUsername).isPresent()) {
                logger.warn("Username update failed - username already in use: {}", newUsername);
                throw new IllegalArgumentException("Username already in use");
            }

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            user.setUsername(newUsername);
            userRepo.save(user);
            logger.info("Username updated successfully for user ID: {} to: {}", userId, newUsername);

        } catch (IllegalArgumentException e) {
            logger.error("Username update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during username update for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update username", e);
        }
    }

    @Transactional
    public void deleteUser(Integer userId) {
        try {
            logger.info("User deletion request for user ID: {}", userId);

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            updateStatus(userId, "Inactive");
            logger.info("User marked as inactive (soft delete) for user ID: {}", userId);

        } catch (IllegalArgumentException e) {
            logger.error("User deletion validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during user deletion for user ID: {}", userId, e);
            throw new RuntimeException("Failed to delete user", e);
        }
    }

    @Transactional
    public void updateStatus(Integer userId, String status) {
        try {
            logger.info("Status update request for user ID: {} to status: {}", userId, status);

            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> {
                        logger.error("User not found for ID: {}", userId);
                        return new IllegalArgumentException("User not found");
                    });

            user.setStatus(status);
            userRepo.save(user);
            logger.info("Status updated successfully for user ID: {} to: {}", userId, status);

        } catch (IllegalArgumentException e) {
            logger.error("Status update validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during status update for user ID: {}", userId, e);
            throw new RuntimeException("Failed to update status", e);
        }
    }

    @Transactional
    public List<GetUserResponseDTO> getAllTechnicians() {
        try {
            logger.info("Fetching all technicians");
            List<GetUserResponseDTO> technicians = userRepo.findAll().stream()
                    .filter(user -> user.getRole() == UserRoleEnum.TECHNICIAN)
                    .map(user -> new GetUserResponseDTO(
                            user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                            user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                            user.getStatus(), user.getProfilePictureUrl()))
                    .toList();
            logger.info("Successfully fetched {} technicians", technicians.size());
            return technicians;
        } catch (Exception e) {
            logger.error("Error fetching all technicians: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch all technicians", e);
        }
    }

    @Transactional
    public GetUserResponseDTO getTechnicianByEmail(String email) {
        try {
            logger.info("Fetching technician by email: {}", email);

            UserEntity user = userRepo.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.error("Technician not found for email: {}", email);
                        return new IllegalArgumentException("Technician not found");
                    });

            if (user.getRole() != UserRoleEnum.TECHNICIAN) {
                logger.error("User with email {} is not a technician", email);
                throw new IllegalArgumentException("User is not a technician");
            }

            GetUserResponseDTO response = new GetUserResponseDTO(
                    user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                    user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                    user.getStatus(), user.getProfilePictureUrl());
            logger.info("Successfully fetched technician by email: {}", email);
            return response;

        } catch (IllegalArgumentException e) {
            logger.error("Get technician validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error fetching technician by email: {}", email, e);
            throw new RuntimeException("Failed to fetch technician", e);
        }
    }

    @Transactional
    public Long getUserCount() {
        try {
            logger.info("Fetching user count");
            Long count = userRepo.count();
            logger.info("Total user count: {}", count);
            return count;
        } catch (Exception e) {
            logger.error("Error fetching user count: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user count", e);
        }
    }

    @Transactional
    public List<GetUserResponseDTO> getWeeklyUsers() {
        try {
            logger.info("Fetching weekly users");
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfWeek = now.with(java.time.DayOfWeek.MONDAY).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime endOfWeek = startOfWeek.plusDays(7);

            List<GetUserResponseDTO> weeklyUsers = userRepo.findAll().stream()
                    .filter(user -> user.getCreatedAt() != null &&
                            user.getCreatedAt().isAfter(startOfWeek) &&
                            user.getCreatedAt().isBefore(endOfWeek))
                    .map(user -> new GetUserResponseDTO(
                            user.getUserId(), user.getFirstName(), user.getLastName(), user.getUsername(),
                            user.getEmail(), user.getRole().name(), user.getPhoneNumber(),
                            user.getStatus(), user.getProfilePictureUrl()))
                    .toList();

            logger.info("Successfully fetched {} weekly users", weeklyUsers.size());
            return weeklyUsers;
        } catch (Exception e) {
            logger.error("Error fetching weekly users: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch weekly users", e);
        }
    }

    public List<GetUserResponseDTO> searchTechnicians(String query) {
        try {
            logger.info("Searching technicians with query: {}", query);

            if (query == null || query.trim().isEmpty()) {
                logger.warn("Empty search query provided");
                return List.of();
            }

            final String needle = normalize(query);

            List<GetUserResponseDTO> result = userRepo.findAll().stream()
                    .filter(u -> u.getRole() == UserRoleEnum.TECHNICIAN)
                    .filter(u -> {
                        String f = normalize(u.getFirstName());
                        String l = normalize(u.getLastName());
                        String full = (f + " " + l).trim();
                        String fullNoSpace = (f + l).trim();
                        return (!f.isEmpty() && f.contains(needle))
                                || (!l.isEmpty() && l.contains(needle))
                                || (!full.isEmpty() && full.contains(needle))
                                || (!fullNoSpace.isEmpty() && fullNoSpace.contains(needle));
                    })
                    .limit(3)
                    .map(u -> new GetUserResponseDTO(
                            u.getUserId(), u.getFirstName(), u.getLastName(), u.getUsername(),
                            u.getEmail(), u.getRole().name(), u.getPhoneNumber(),
                            u.getStatus(), u.getProfilePictureUrl()))
                    .toList();

            logger.info("Found {} technicians for query '{}'", result.size(), query);
            return result;
        } catch (Exception e) {
            logger.error("Error searching technicians with query '{}': {}", query, e.getMessage(), e);
            throw new RuntimeException("Failed to search technicians", e);
        }
    }

    private String normalize(String s) {
        if (s == null) return "";
        String lowered = s.toLowerCase();
        // collapse multiple spaces and trim
        return lowered.replaceAll("\\s+", " ").trim();
    }

    public void assignTechnicianToTicket(String ticketNumber, String technicianEmail) {
        try {
            logger.info("Assigning technician {} to ticket {}", technicianEmail, ticketNumber);

            RepairTicketEntity ticket = repairTicketRepository.findByTicketNumber(ticketNumber)
                    .orElseThrow(() -> {
                        logger.error("Ticket not found: {}", ticketNumber);
                        return new IllegalArgumentException("Ticket not found");
                    });

            UserEntity technician = userRepo.findByEmail(technicianEmail)
                    .orElseThrow(() -> {
                        logger.error("Technician not found: {}", technicianEmail);
                        return new IllegalArgumentException("Technician not found");
                    });

            if (technician.getRole() != UserRoleEnum.TECHNICIAN) {
                logger.error("User {} is not a technician", technicianEmail);
                throw new IllegalArgumentException("User is not a technician");
            }

            ticket.setTechnicianEmail(technician);
            ticket.setTechnicianName(technician.getFirstName() + " " + technician.getLastName());
            repairTicketRepository.save(ticket);
            logger.info("Successfully assigned technician {} to ticket {}", technicianEmail, ticketNumber);

        } catch (IllegalArgumentException e) {
            logger.error("Assignment validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error assigning technician {} to ticket {}: {}",
                    technicianEmail, ticketNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to assign technician to ticket", e);
        }
    }

    public List<TechnicianWorkloadDTO> getTopTechniciansByWorkload(int limit) {
        try {
            logger.info("Fetching top {} technicians by workload", limit);

            List<TechnicianWorkloadDTO> result = userRepo.findAll().stream()
                    .filter(u -> u.getRole() == UserRoleEnum.TECHNICIAN)
                    .map(u -> {
                        try {
                            int ticketCount = (int) repairTicketRepository.findAll().stream()
                                    .filter(t -> t.getTechnicianEmail() != null &&
                                            t.getTechnicianEmail().getUserId().equals(u.getUserId()))
                                    .count();

                            TechnicianWorkloadDTO dto = new TechnicianWorkloadDTO();
                            dto.setUserId(u.getUserId());
                            dto.setFirstName(u.getFirstName());
                            dto.setLastName(u.getLastName());
                            dto.setEmail(u.getEmail());
                            dto.setTicketCount(ticketCount);
                            return dto;
                        } catch (Exception e) {
                            logger.warn("Error calculating workload for technician {}: {}",
                                    u.getEmail(), e.getMessage());
                            // Return DTO with 0 tickets on error
                            TechnicianWorkloadDTO dto = new TechnicianWorkloadDTO();
                            dto.setUserId(u.getUserId());
                            dto.setFirstName(u.getFirstName());
                            dto.setLastName(u.getLastName());
                            dto.setEmail(u.getEmail());
                            dto.setTicketCount(0);
                            return dto;
                        }
                    })
                    .sorted((a, b) -> Integer.compare(b.getTicketCount(), a.getTicketCount()))
                    .limit(limit)
                    .toList();

            logger.info("Successfully fetched top {} technicians by workload", result.size());
            return result;
        } catch (Exception e) {
            logger.error("Error fetching top technicians by workload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch top technicians by workload", e);
        }
    }

    @Transactional
    public boolean onboardAdmin(RegistrationRequestDTO req) {
        try {
            logger.info("Attempting initial admin onboarding for email: {}", req.getEmail());

            if (userRepo.count() > 0) {
                logger.warn("Initial admin setup attempted but users already exist");
                throw new IllegalArgumentException("Initial setup already completed");
            }

            if (userRepo.findByEmail(req.getEmail()).isPresent()) {
                logger.warn("Email already in use during onboarding: {}", req.getEmail());
                throw new IllegalArgumentException("Email already in use");
            }

            if (userRepo.findByUsername(req.getUsername()).isPresent()) {
                logger.warn("Username already in use during onboarding: {}", req.getUsername());
                throw new IllegalArgumentException("Username already in use");
            }

            UserEntity user = new UserEntity();
            user.setFirstName(formatName(req.getFirstName()));
            user.setLastName(formatName(req.getLastName()));
            user.setEmail(req.getEmail());
            user.setUsername(req.getUsername());
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setPhoneNumber(req.getPhoneNumber());
            user.setRole(UserRoleEnum.ADMIN);
            user.setIsVerified(true);
            user.setStatus("Active");

            userRepo.save(user);
            logger.info("Initial admin onboarded successfully for email: {}", req.getEmail());
            return true;

        } catch (IllegalArgumentException e) {
            logger.error("Admin onboarding validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during admin onboarding for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to onboard admin", e);
        }
    }

    @Transactional
    public void createEmployee(AddEmployeeRequestDTO req) throws MessagingException {
        try {
            logger.info("Creating employee account for email: {}", req.getEmail());

            if (userRepo.findByEmail(req.getEmail()).isPresent()) {
                logger.warn("Employee creation failed - email already in use: {}", req.getEmail());
                throw new IllegalArgumentException("Email already in use");
            }

            if (userRepo.findByUsername(req.getUsername()).isPresent()) {
                logger.warn("Employee creation failed - username already in use: {}", req.getUsername());
                throw new IllegalArgumentException("Username already in use");
            }

            String onboardingCode = String.format("%06d",
                    java.util.concurrent.ThreadLocalRandom.current().nextInt(1000000));

            UserEntity user = new UserEntity();
            user.setFirstName(formatName(req.getFirstName()));
            user.setLastName(formatName(req.getLastName()));
            user.setEmail(req.getEmail());
            user.setUsername(req.getUsername());
            user.setPassword(passwordEncoder.encode("TEMP" + onboardingCode));

            String cleanedPhone = req.getPhoneNumber().replaceAll("\\s+", "");
            user.setPhoneNumber(cleanedPhone);

            user.setRole(UserRoleEnum.TECHNICIAN);
            user.setIsVerified(false);
            user.setStatus("Pending");
            user.setOnboardingCode(onboardingCode);

            userRepo.save(user);
            logger.info("Employee account saved for email: {}", req.getEmail());

            emailService.sendEmployeeOnboardingEmail(req.getEmail(), formatName(req.getFirstName()), onboardingCode);
            logger.info("Employee creation completed successfully: {}", req.getEmail());

        } catch (IllegalArgumentException e) {
            logger.error("Employee creation validation error: {}", e.getMessage());
            throw e;
        } catch (MessagingException e) {
            logger.error("Email sending failed during employee creation for email: {}", req.getEmail(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during employee creation for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to create employee", e);
        }
    }

    @Transactional(readOnly = true)
    public boolean verifyOnboardingCode(VerifyOnboardingCodeRequestDTO req) {
        try {
            logger.info("Verifying onboarding code for email: {}", req.getEmail());

            UserEntity user = userRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", req.getEmail());
                        return new IllegalArgumentException("User not found");
                    });

            if (!"Pending".equalsIgnoreCase(user.getStatus())) {
                logger.warn("Account already activated for email: {}", req.getEmail());
                throw new IllegalArgumentException("Account already activated");
            }

            if (user.getOnboardingCode() == null || !user.getOnboardingCode().equals(req.getOnboardingCode())) {
                logger.warn("Invalid onboarding code for email: {}", req.getEmail());
                throw new IllegalArgumentException("Invalid onboarding code");
            }

            logger.info("Onboarding code verified successfully for email: {}", req.getEmail());
            return true;

        } catch (IllegalArgumentException e) {
            logger.error("Onboarding code verification error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during onboarding code verification for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to verify onboarding code", e);
        }
    }

    @Transactional
    public void completeEmployeeOnboarding(CompleteOnboardingRequestDTO req) {
        try {
            logger.info("Completing employee onboarding for email: {}", req.getEmail());

            UserEntity user = userRepo.findByEmail(req.getEmail())
                    .orElseThrow(() -> {
                        logger.error("User not found for email: {}", req.getEmail());
                        return new IllegalArgumentException("User not found");
                    });

            if (user.getOnboardingCode() == null || !user.getOnboardingCode().equals(req.getOnboardingCode())) {
                logger.warn("Invalid onboarding code during completion for email: {}", req.getEmail());
                throw new IllegalArgumentException("Invalid onboarding code");
            }

            user.setPassword(passwordEncoder.encode(req.getPassword()));
            user.setIsVerified(true);
            user.setStatus("Active");
            user.setOnboardingCode(null);

            userRepo.save(user);
            logger.info("Employee onboarding completed successfully for email: {}", req.getEmail());

        } catch (IllegalArgumentException e) {
            logger.error("Employee onboarding completion validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during employee onboarding completion for email: {}", req.getEmail(), e);
            throw new RuntimeException("Failed to complete employee onboarding", e);
        }
    }

    public String getProfilePicture(String profilePictureUrl, int expirationMinutes) {
        if (profilePictureUrl == null || profilePictureUrl.equals("0") || profilePictureUrl.isBlank()) {
            return null;
        }
        if (profilePictureUrl.contains("amazonaws.com/")) {
            int idx = profilePictureUrl.indexOf(".amazonaws.com/");
            String s3Key = profilePictureUrl.substring(idx + ".amazonaws.com/".length());
            return s3Service.generatePresignedUrl(s3Key, expirationMinutes);
        } else {
            return profilePictureUrl;
        }
    }

    @Transactional(readOnly = true)
    public boolean hasTechnicians() {
        long count = userRepo.countByRole(UserRoleEnum.TECHNICIAN);
        return count > 0;
    }

}
