package com.servit.servit.controller;

import com.servit.servit.dto.user.AddEmployeeRequestDTO;
import com.servit.servit.dto.user.VerifyOnboardingCodeRequestDTO;
import com.servit.servit.dto.user.CompleteOnboardingRequestDTO;
import com.servit.servit.dto.user.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.service.UserService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private final UserService userSvc;

    @Autowired
    private UserRepository userRepo;

    public UserController(UserService userSvc) {
        this.userSvc = userSvc;
    }

    // USER SIDE

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequestDTO req) {
        try {
            userSvc.register(req);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("Email already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "EMAIL_TAKEN", "message", "Email is already registered"));
            } else if ("Username already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "USERNAME_TAKEN", "message", "Username is already taken"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "VALIDATION_ERROR", "message", message));
            }
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "EMAIL_SEND_ERROR", "message", "Failed to send verification email"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "UNKNOWN_ERROR", "message", "Internal server error"));
        }
    }

    @PatchMapping("/register/onboard")
    public ResponseEntity<?> onboardAdmin(@RequestBody RegistrationRequestDTO req) {
        try {
            boolean result = userSvc.onboardAdmin(req);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/verifyOtp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequestDTO req) {
        try {
            userSvc.verifyOtp(req);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/resendOtp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequestDTO req) {
        try {
            userSvc.resendOtp(req);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Email service unavailable");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getCurrentUser")
    public ResponseEntity<?> getCurrentUser() {
        try {
            return ResponseEntity.ok(userSvc.getCurrentUser());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/changeCurrentUserPassword")
    public ResponseEntity<?> changeCurrentUserPassword(@RequestBody ChangeCurrentUserPasswordRequestDTO req) {
        try {
            userSvc.changeCurrentUserPassword(req);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/updateCurrentUserFullName")
    public ResponseEntity<?> updateCurrentUserFullName(@RequestBody UpdateFullNameRequestDTO req) {
        try {
            userSvc.updateCurrentUserFullName(req);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/changeCurrentUserPhoneNumber")
    public ResponseEntity<?> changeCurrentUserPhoneNumber(@RequestBody ChangePhoneNumberDTO req) {
        try {
            userSvc.changeCurrentUserPhoneNumber(req);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/updateCurrentUsername")
    public ResponseEntity<?> updateCurrentUsername(@RequestBody UpdateUsernameRequestDTO req) {
        try {
            userSvc.updateCurrentUsername(req);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("Username already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/updateCurrentUserProfilePicture")
    public ResponseEntity<?> updateCurrentUserProfilePicture(@RequestParam("file") MultipartFile file) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            UserEntity user = userRepo.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            userSvc.updateProfilePicture(user.getUserId(), file);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getProfilePicture/{id}")
    public ResponseEntity<?> getProfilePicture(@PathVariable Integer id) {
        try {
            UserEntity user = userRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            String profilePictureUrl = user.getProfilePictureUrl();
            String presignedUrl = userSvc.getProfilePicture(profilePictureUrl, 5); // 5 min expiry
            if (presignedUrl == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Profile picture not set");
            }
            return ResponseEntity.ok(presignedUrl);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @DeleteMapping("/removeCurrentUserProfilePicture")
    public ResponseEntity<?> removeCurrentUserProfilePicture() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            UserEntity user = userRepo.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            userSvc.removeProfilePicture(user.getUserId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @DeleteMapping("/removeProfilePicture/{id}")
    public ResponseEntity<?> removeProfilePicture(@PathVariable Integer id) {
        try {
            userSvc.removeProfilePicture(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDTO req) {
        try {
            userSvc.forgotPassword(req);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Email service unavailable");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequestDTO req) {
        try {
            userSvc.resetPassword(req);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    // ADMIN SIDE

    @GetMapping("/getAllUsers")
    public ResponseEntity<?> getAllUsers(Pageable pageable) {
        try {
            Page<?> page = userSvc.getAllUsers(pageable);
            return ResponseEntity.ok(page);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/changeRole/{id}")
    public ResponseEntity<?> changeRole(@PathVariable Integer id, @RequestBody ChangeRoleRequestDTO req) {
        try {
            userSvc.changeRole(id, req.getRole());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getUser/{id}")
    public ResponseEntity<?> getUser(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(userSvc.getUser(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/changePassword/{id}")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @RequestBody ChangePasswordRequestDTO req) {
        try {
            userSvc.changePassword(id, req.getNewPassword());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/updateEmail/{id}")
    public ResponseEntity<?> updateEmail(@PathVariable Integer id, @RequestBody UpdateEmailRequestDTO req) {
        try {
            userSvc.updateEmail(id, req.getNewEmail());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("Email already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
            } else if ("User not found".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/changePhoneNumber/{id}")
    public ResponseEntity<?> changePhoneNumber(@PathVariable Integer id, @RequestBody ChangePhoneNumberDTO req) {
        try {
            userSvc.changePhoneNumber(id, req.getNewPhoneNumber());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/updateUsername/{id}")
    public ResponseEntity<?> updateUsername(@PathVariable Integer id, @RequestBody UpdateUsernameRequestDTO req) {
        try {
            userSvc.updateUsername(id, req.getNewUsername());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("Username already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(message);
            } else if ("User not found".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            userSvc.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/updateFullName/{id}")
    public ResponseEntity<?> updateFullName(@PathVariable Integer id, @RequestBody UpdateFullNameRequestDTO req) {
        try {
            userSvc.updateFullName(id, req.getNewFirstName(), req.getNewLastName());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/updateStatus/{id}")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestBody UpdateUserStatusRequestDTO req) {
        try {
            userSvc.updateStatus(id, req.getStatus());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/updateProfilePicture/{id}")
    public ResponseEntity<?> updateProfilePicture(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        try {
            userSvc.updateProfilePicture(id, file);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getAllTechnicians")
    public ResponseEntity<?> getAllTechnicians() {
        try {
            List<GetUserResponseDTO> technicians = userSvc.getAllTechnicians();
            if (technicians.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.ok(technicians);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getTechnicianByEmail")
    public ResponseEntity<?> getTechnicianByEmail(@RequestParam String email) {
        try {
            return ResponseEntity.ok(userSvc.getTechnicianByEmail(email));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getUserCount")
    public ResponseEntity<?> getUserCount() {
        try {
            return ResponseEntity.ok(userSvc.getUserCount());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getWeeklyUsers")
    public ResponseEntity<?> getWeeklyUsers() {
        try {
            return ResponseEntity.ok(userSvc.getWeeklyUsers());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/searchTechnicians")
    public ResponseEntity<?> searchTechnicians(@RequestParam String query) {
        try {
            return ResponseEntity.ok(userSvc.searchTechnicians(query));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PatchMapping("/assignTechnician")
    public ResponseEntity<?> assignTechnicianToTicket(@RequestBody AssignTechnicianRequestDTO req) {
        try {
            userSvc.assignTechnicianToTicket(req.getTicketNumber(), req.getTechnicianEmail());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getTopTechniciansByWorkload")
    public ResponseEntity<?> getTopTechniciansByWorkload() {
        try {
            return ResponseEntity.ok(userSvc.getTopTechniciansByWorkload(5));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/getUserCountInit")
    public ResponseEntity<?> getUserCountInit() {
        try {
            return ResponseEntity.ok(userSvc.getUserCount());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/createEmployee")
    public ResponseEntity<?> createEmployee(@RequestBody AddEmployeeRequestDTO req) {
        try {
            userSvc.createEmployee(req);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("Email already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "EMAIL_TAKEN", "message", "Email is already registered"));
            } else if ("Username already in use".equals(message)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "USERNAME_TAKEN", "message", "Username is already taken"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "VALIDATION_ERROR", "message", message));
            }
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "EMAIL_SEND_ERROR", "message", "Failed to send verification email"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "UNKNOWN_ERROR", "message", "Internal server error"));
        }
    }

    @PostMapping("/verifyOnboardingCode")
    public ResponseEntity<?> verifyOnboardingCode(@RequestBody VerifyOnboardingCodeRequestDTO req) {
        try {
            boolean ok = userSvc.verifyOnboardingCode(req);
            return ResponseEntity.ok(ok);
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("User not found".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @PostMapping("/completeOnboarding")
    public ResponseEntity<?> completeOnboarding(@RequestBody CompleteOnboardingRequestDTO req) {
        try {
            userSvc.completeEmployeeOnboarding(req);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("User not found".equals(message)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal server error");
        }
    }

    @GetMapping("/hasTechnicians")
    public ResponseEntity<Map<String, Object>> hasTechnicians() {
        boolean exists = userSvc.hasTechnicians();
        return ResponseEntity.ok(Map.of(
            "exists", exists,
            "value", exists ? 1 : 0
        ));
    }
}

