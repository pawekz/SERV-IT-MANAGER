package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.RepairTicketRepository;
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

        String rawPhone = req.getPhoneNumber().replaceAll("^\\+?63", "");
        user.setPhoneNumber("+63" + rawPhone);

        user.setRole(UserRoleEnum.CUSTOMER); // Always CUSTOMER
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
    public List<GetUserResponseDTO> getAllTechnicians() {
        logger.info("Fetching all technicians.");
        try {
            List<GetUserResponseDTO> technicians = userRepo.findAll().stream()
                    .filter(user -> user.getRole() == UserRoleEnum.TECHNICIAN)
                    .map(user -> new GetUserResponseDTO(
                            user.getUserId(), user.getFirstName(), user.getLastName(),
                            user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus()))
                    .toList();
            logger.info("Fetched {} technicians.", technicians.size());
            return technicians;
        } catch (Exception e) {
            logger.error("Error fetching all technicians.", e);
            throw new RuntimeException("Failed to fetch all technicians", e);
        }
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

    @Transactional
    public List<GetUserResponseDTO> getWeeklyUsers() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfWeek = now.with(java.time.DayOfWeek.MONDAY).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfWeek = startOfWeek.plusDays(7);
        
        return userRepo.findAll().stream()
                .filter(user -> user.getCreatedAt().isAfter(startOfWeek) && user.getCreatedAt().isBefore(endOfWeek))
                .map(user -> new GetUserResponseDTO(
                        user.getUserId(), user.getFirstName(), user.getLastName(),
                        user.getEmail(), user.getRole().name(), user.getPhoneNumber(), user.getStatus()))
                .toList();
    }

    public List<GetUserResponseDTO> searchTechnicians(String query) {
        try {
            logger.info("Searching technicians with query: {}", query);
            List<GetUserResponseDTO> result = userRepo.findAll().stream()
                    .filter(u -> u.getRole() == UserRoleEnum.TECHNICIAN &&
                            (u.getFirstName().toLowerCase().contains(query.toLowerCase()) ||
                                    u.getLastName().toLowerCase().contains(query.toLowerCase()) ||
                                    u.getEmail().toLowerCase().contains(query.toLowerCase())))
                    .limit(3)
                    .map(u -> new GetUserResponseDTO(
                            u.getUserId(), u.getFirstName(), u.getLastName(),
                            u.getEmail(), u.getRole().name(), u.getPhoneNumber(), u.getStatus()))
                    .toList();
            logger.info("Found {} technicians for query '{}'", result.size(), query);
            return result;
        } catch (Exception e) {
            logger.error("Error searching technicians with query '{}': {}", query, e.getMessage(), e);
            throw new RuntimeException("Failed to search technicians", e);
        }
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
            logger.info("Technician {} assigned to ticket {}", technicianEmail, ticketNumber);
        } catch (IllegalArgumentException e) {
            logger.error("Assignment error: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error assigning technician: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to assign technician to ticket", e);
        }
    }

    public List<TechnicianWorkloadDTO> getTopTechniciansByWorkload(int limit) {
        try {
            logger.info("Fetching top {} technicians by workload", limit);
            List<TechnicianWorkloadDTO> result = userRepo.findAll().stream()
                    .filter(u -> u.getRole() == UserRoleEnum.TECHNICIAN)
                    .map(u -> {
                        int ticketCount = (int) repairTicketRepository.findAll().stream()
                                .filter(t -> t.getTechnicianEmail() != null && t.getTechnicianEmail().getUserId().equals(u.getUserId()))
                                .count();
                        TechnicianWorkloadDTO dto = new TechnicianWorkloadDTO();
                        dto.setUserId(u.getUserId());
                        dto.setFirstName(u.getFirstName());
                        dto.setLastName(u.getLastName());
                        dto.setEmail(u.getEmail());
                        dto.setTicketCount(ticketCount);
                        return dto;
                    })
                    .sorted((a, b) -> Integer.compare(b.getTicketCount(), a.getTicketCount()))
                    .limit(limit)
                    .toList();
            logger.info("Top {} technicians fetched", result.size());
            return result;
        } catch (Exception e) {
            logger.error("Error fetching top technicians by workload: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch top technicians by workload", e);
        }
    }

    @Transactional
    public boolean onboardAdmin(RegistrationRequestDTO req) {
        logger.info("Attempting initial admin onboarding...");
        if (userRepo.count() > 0) {
            logger.warn("Initial admin setup attempted but users already exist.");
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
        logger.info("Initial admin onboarded successfully.");
        return true;
    }

    // ADMIN SIDE: Create a new employee (Technician) account in pending state and email onboarding code
    @Transactional
    public void createEmployee(AddEmployeeRequestDTO req) throws jakarta.mail.MessagingException {
        // Validate uniqueness
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (userRepo.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already in use");
        }

        // Generate 6-digit onboarding code
        String onboardingCode = String.format("%06d", java.util.concurrent.ThreadLocalRandom.current().nextInt(1000000));

        // Create user entity
        UserEntity user = new UserEntity();
        user.setFirstName(formatName(req.getFirstName()));
        user.setLastName(formatName(req.getLastName()));
        user.setEmail(req.getEmail());
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode("TEMP" + onboardingCode)); // Temporary password placeholder

        // Store phone number exactly as provided (whitespace removed)
        String cleanedPhone = req.getPhoneNumber().replaceAll("\\s+", "");
        user.setPhoneNumber(cleanedPhone);

        user.setRole(UserRoleEnum.TECHNICIAN);
        user.setIsVerified(false);
        user.setStatus("Pending");
        user.setOnboardingCode(onboardingCode);

        userRepo.save(user);

        // Send onboarding email
        String subject = "IOCONNECT Employee Onboarding Instructions";
        String message = "Hello " + formatName(req.getFirstName()) + ",\n\n" +
                "Welcome to IOCONNECT! We've created your employee account. To activate it, please complete these steps:\n\n" +
                "1. Open the Employee Onboarding page: https://app.ioconnect.com/employee-onboarding (or paste the link in your browser).\n" +
                "2. In the form, enter **your email address** ( <b>" + req.getEmail() + "</b> ) in the Email field.\n" +
                "3. Enter the **Onboarding Code** below in the Onboarding Code field.\n" +
                "4. Click <b>Verify Code</b>. You will then be prompted to set a secure password and activate your account.\n\n" +
                "Your Onboarding Code: <b>" + onboardingCode + "</b>\n\n" +
                "If you did not expect this email, please ignore it or contact your administrator.";
        emailService.sendGenericNotificationEmail(req.getEmail(), subject, message);
    }

    // Verify onboarding code (step 1)
    @Transactional(readOnly = true)
    public boolean verifyOnboardingCode(VerifyOnboardingCodeRequestDTO req) {
        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!"Pending".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Account already activated");
        }

        if (user.getOnboardingCode() == null || !user.getOnboardingCode().equals(req.getOnboardingCode())) {
            throw new IllegalArgumentException("Invalid onboarding code");
        }
        return true;
    }

    // Complete onboarding: set password & activate
    @Transactional
    public void completeEmployeeOnboarding(CompleteOnboardingRequestDTO req) {
        UserEntity user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getOnboardingCode() == null || !user.getOnboardingCode().equals(req.getOnboardingCode())) {
            throw new IllegalArgumentException("Invalid onboarding code");
        }

        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setIsVerified(true);
        user.setStatus("Active");
        user.setOnboardingCode(null); // clear code

        userRepo.save(user);
    }
}
