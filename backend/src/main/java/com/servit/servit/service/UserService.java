package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.enumeration.UserRoleEnum;
import jakarta.mail.MessagingException;
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
                user.getUserId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole().name(), user.getPhoneNumber()
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
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhoneNumber(req.getPhoneNumber());
        user.setRole(userRepo.count() == 0 ? UserRoleEnum.ADMIN : UserRoleEnum.CUSTOMER);
        user.setVerified(false);
        userRepo.save(user);

        String otp = otpService.generateOtp(req.getEmail());
        emailService.sendOtpEmail(req.getEmail(), otp);
    }

    @Transactional
    public void verifyOtp(OtpVerificationRequestDTO req) {
        if (!otpService.validateOtp(req.getEmail(), req.getOtp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setVerified(true);
        userRepo.save(user);
    }

    @Transactional
    public void resendOtp(String email) throws MessagingException {
        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getVerified()) {
            throw new IllegalArgumentException("User is already verified");
        }

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);
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
        user.setFirstName(req.getNewFirstName());
        user.setLastName(req.getNewLastName());
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
                        user.getEmail(), user.getRole().name(), user.getPhoneNumber()))
                .toList();
    }

    @Transactional
    public GetUserResponseDTO getUser(Integer userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new GetUserResponseDTO(
                user.getUserId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole().name(), user.getPhoneNumber()
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
        user.setFirstName(newFirstName);
        user.setLastName(newLastName);
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
        userRepo.delete(user);
    }
}
