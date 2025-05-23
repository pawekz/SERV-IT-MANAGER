package com.servit.servit.controller;

import com.servit.servit.dto.*;
import com.servit.servit.service.UserService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private final UserService userSvc;

    public UserController(UserService userSvc) {
        this.userSvc = userSvc;
    }

    // USER SIDE

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegistrationRequestDTO req) throws MessagingException {
        try {
            userSvc.register(req);
            return ResponseEntity.status(201).build();
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if ("Email already in use".equals(message)) {
                return ResponseEntity.badRequest().body("Email Already Used");
            } else if ("Username already in use".equals(message)) {
                return ResponseEntity.badRequest().body("Username Already Used");
            } else {
                return ResponseEntity.badRequest().body(message);
            }
        }
    }

    @PostMapping("/verifyOtp")
    public ResponseEntity<Void> verifyOtp(@RequestBody VerifyOtpRequestDTO req) {
        userSvc.verifyOtp(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resendOtp")
    public ResponseEntity<Void> resendOtp(@RequestBody ResendOtpRequestDTO req) throws MessagingException {
        userSvc.resendOtp(req);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/getCurrentUser")
    public ResponseEntity<GetUserResponseDTO> getCurrentUser() {
        return ResponseEntity.ok(userSvc.getCurrentUser());
    }

    @PatchMapping("/changeCurrentUserPassword")
    public ResponseEntity<Void> changeCurrentUserPassword(@RequestBody ChangeCurrentUserPasswordRequestDTO req) {
        userSvc.changeCurrentUserPassword(req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/updateCurrentUserFullName")
    public ResponseEntity<Void> updateCurrentUserFullName(@RequestBody UpdateFullNameRequestDTO req) {
        userSvc.updateCurrentUserFullName(req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/changeCurrentUserPhoneNumber")
    public ResponseEntity<Void> changeCurrentUserPhoneNumber(@RequestBody ChangePhoneNumberDTO req) {
        userSvc.changeCurrentUserPhoneNumber(req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/updateCurrentUsername")
    public ResponseEntity<Void> updateCurrentUsername(@RequestBody UpdateUsernameRequestDTO req) {
        userSvc.updateCurrentUsername(req);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgotPassword")
    public ResponseEntity<Void> forgotPassword(@RequestBody ForgotPasswordRequestDTO req) throws MessagingException {
        userSvc.forgotPassword(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequestDTO req) {
        userSvc.resetPassword(req);
        return ResponseEntity.ok().build();
    }

    // ADMIN SIDE

    @GetMapping("/getAllUsers")
    public ResponseEntity<List<GetUserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userSvc.getAllUsers());
    }

    @PatchMapping("/changeRole/{id}")
    public ResponseEntity<Void> changeRole(@PathVariable Integer id,
                                           @RequestBody ChangeRoleRequestDTO req) {
        userSvc.changeRole(id, req.getRole());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/getUser/{id}")
    public ResponseEntity<GetUserResponseDTO> getUser(@PathVariable Integer id) {
        return ResponseEntity.ok(userSvc.getUser(id));
    }

    @PatchMapping("/changePassword/{id}")
    public ResponseEntity<Void> changePassword(@PathVariable Integer id, @RequestBody ChangePasswordRequestDTO req) {
        userSvc.changePassword(id, req.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/updateEmail/{id}")
    public ResponseEntity<Void> updateEmail(@PathVariable Integer id, @RequestBody UpdateEmailRequestDTO req) {
        userSvc.updateEmail(id, req.getNewEmail());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/changePhoneNumber/{id}")
    public ResponseEntity<Void> changePhoneNumber(@PathVariable Integer id, @RequestBody ChangePhoneNumberDTO req) {
        userSvc.changePhoneNumber(id, req.getNewPhoneNumber());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/updateUsername/{id}")
    public ResponseEntity<Void> updateUsername(@PathVariable Integer id, @RequestBody UpdateUsernameRequestDTO req) {
        userSvc.updateUsername(id, req.getNewUsername());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userSvc.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/updateFullName/{id}")
    public ResponseEntity<Void> updateFullName(@PathVariable Integer id, @RequestBody UpdateFullNameRequestDTO req) {
        userSvc.updateFullName(id, req.getNewFirstName(), req.getNewLastName());
        return ResponseEntity.noContent().build();
    }

}
