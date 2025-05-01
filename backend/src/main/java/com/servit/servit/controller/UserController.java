package com.servit.servit.controller;

import com.servit.servit.DTO.*;
import com.servit.servit.service.UserService;
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

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegistrationRequest req) {
        userSvc.register(req);
        return ResponseEntity.status(201).build();
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> me() {
        return ResponseEntity.ok(userSvc.getCurrentUserProfile());
    }

    @PatchMapping("/me")
    public ResponseEntity<Void> updateProfile(@RequestBody UpdateProfileRequest req) {
        userSvc.updateProfile(req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest req) {
        userSvc.changePassword(req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ProfileResponse>> listUsers() {
        return ResponseEntity.ok(userSvc.listAllUsers());
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<Void> changeRole(@PathVariable Integer id,
                                           @RequestBody ChangeRoleRequest req) {
        userSvc.changeUserRole(id, req.getRole());
        return ResponseEntity.noContent().build();
    }
}
