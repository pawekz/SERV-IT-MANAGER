package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.enumeration.UserRoleEnum;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private final UserRepository userRepo;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    public UserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // USER SIDE

    public GetUserResponseDTO getCurrentUser() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        System.out.println("User found: " + user.getEmail());

        return new GetUserResponseDTO(
                user.getUserId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus()
        );
    }

    @Transactional
    public void register(RegistrationRequestDTO req) throws MessagingException {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        if (userRepo.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already in use");
        }

        UserEntity user = new UserEntity();
        user.setFirstName(formatName(req.getFirstName()));
        user.setLastName(formatName(req.getLastName()));
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhoneNumber(req.getPhoneNumber());
        user.setRole(userRepo.count() == 0 ? UserRoleEnum.ADMIN : UserRoleEnum.CUSTOMER);
        user.setIsVerified(false);
        user.setStatus("Pending");
        userRepo.save(user);

        String otp = otpService.generateOtp(req.getEmail());
        emailService.sendOtpEmail(req.getEmail(), otp);
    }

    private String formatName(String name) {
        if (name == null || name.isEmpty()) {
            return name;
        }
        return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequestDTO req) {
        logger.debug("OTP verification request: email={}, otp={}, type={}",
                req.getEmail(), req.getOtp(), req.getType());

        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        logger.debug("User found: {}", user.getUsername());

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
                logger.debug("User verified successfully: {}", user.getEmail());
                break;
            case 2: // Forgot password
                logger.debug("OTP verified for forgot password: {}", user.getEmail());
                break;
            default:
                logger.error("Invalid type value: {}", req.getType());
                throw new IllegalArgumentException("Invalid type");
        }
    }

    @Transactional
    public void resendOtp(ResendOtpRequestDTO req) throws MessagingException {
        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (req.getType() == 1 && user.getIsVerified()) {
            throw new IllegalArgumentException("User is already verified");
        }

        String newOtp = otpService.generateOtp(req.getEmail());
        /*otpService.invalidateOtp(req.getEmail());*/

        if (req.getType() == 1) {
            emailService.sendOtpEmail(req.getEmail(), newOtp);
        } else if (req.getType() == 2) {
            emailService.sendForgotPasswordEmail(req.getEmail(), newOtp);
        } else {
            throw new IllegalArgumentException("Invalid type");
        }
    }

    @Transactional
    public void changeCurrentUserPassword(ChangeCurrentUserPasswordRequestDTO req) {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
    }


    @Transactional
    public void updateCurrentUserFullName(UpdateFullNameRequestDTO req) {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFirstName(formatName(req.getNewFirstName()));
        user.setLastName(formatName(req.getNewLastName()));
        userRepo.save(user);
    }

    @Transactional
    public void changeCurrentUserPhoneNumber(ChangePhoneNumberDTO req) {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPhoneNumber(req.getNewPhoneNumber());
        userRepo.save(user);
    }

    @Transactional
    public void updateCurrentUsername(UpdateUsernameRequestDTO req) {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setUsername(req.getNewUsername());
        userRepo.save(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequestDTO req) throws MessagingException {
        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String otp = otpService.generateOtp(req.getEmail());
        emailService.sendForgotPasswordEmail(req.getEmail(), otp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequestDTO req) {
        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);
    }

    // ADMIN SIDE

    @Transactional
    public void changeRole(Integer userId, String newRole) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setRole(UserRoleEnum.valueOf(newRole));
        userRepo.save(user);
    }

    public List<GetUserResponseDTO> getAllUsers() {
        return userRepo.findAll().stream()
                .map(user -> new GetUserResponseDTO(
                        user.getUserId(), user.getFirstName(), user.getLastName(),
                        user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus()))
                .toList();
    }

    @Transactional
    public GetUserResponseDTO getUser(Integer userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new GetUserResponseDTO(
                user.getUserId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus()
        );
    }

    @Transactional
    public void changePassword(Integer userId, String newPassword) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    @Transactional
    public void updateEmail(Integer userId, String newEmail) {
        if (userRepo.findByEmail(newEmail).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEmail(newEmail);
        user.setUsername(newEmail);
        userRepo.save(user);
    }

    @Transactional
    public void updateFullName(Integer userId, String newFirstName, String newLastName) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFirstName(formatName(newFirstName));
        user.setLastName(formatName(newLastName));
        userRepo.save(user);
    }

    @Transactional
    public void changePhoneNumber(Integer userId, String newPhoneNumber) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPhoneNumber(newPhoneNumber);
        userRepo.save(user);
    }

    @Transactional
    public void updateUsername(Integer userId, String newUsername) {
        if (userRepo.findByUsername(newUsername).isPresent()) {
            throw new IllegalArgumentException("Username already in use");
        }
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setUsername(newUsername);
        userRepo.save(user);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        updateStatus(userId, "Inactive");
    }

    @Transactional
    public void updateStatus(Integer userId, String status) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(status);
        userRepo.save(user);
    }

    @Transactional
    public List<GetUserResponseDTO> getTechnicians() {
        return userRepo.findAll().stream()
                .filter(user -> user.getRole() == UserRoleEnum.TECHNICIAN)
                .map(user -> new GetUserResponseDTO(
                        user.getUserId(), user.getFirstName(), user.getLastName(),
                        user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus()))
                .toList();
    }

    @Transactional
    public GetUserResponseDTO getTechnicianByEmail(String email) {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        if (user.getRole() != UserRoleEnum.TECHNICIAN) {
            throw new IllegalArgumentException("User is not a technician");
        }
        return new GetUserResponseDTO(
                user.getUserId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus());
    }

    @Transactional
    public Long getUserCount() {
        return userRepo.count();
    }
}
