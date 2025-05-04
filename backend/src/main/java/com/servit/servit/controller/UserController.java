package com.servit.servit.controller;

import com.servit.servit.dto.*;
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

    // USER SIDE

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegistrationRequestDTO req) {
        userSvc.register(req);
        return ResponseEntity.status(201).build();
    }

    @GetMapping("/getCurrentUser")
    public ResponseEntity<GetUserResponseDTO> getCurrentUser() {
        return ResponseEntity.ok(userSvc.getCurrentUser());
    }

    @PatchMapping("/updateCurrentUser")
    public ResponseEntity<Void> updateCurrentUser(@RequestBody UpdateCurrentUserRequestDTO req) {
        userSvc.updateCurrentUser(req);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/changeCurrentUserPassword")
    public ResponseEntity<Void> changeCurrentUserPassword(@RequestBody ChangeCurrentUserPasswordRequestDTO req) {
        userSvc.changePassword(req);
        return ResponseEntity.noContent().build();
    }

    // ADMIN SIDE

    @GetMapping("/getAllUsers")
    public ResponseEntity<List<GetUserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userSvc.getAllUsers());
    }

    @PatchMapping("/changeUserRole/{id}")
    public ResponseEntity<Void> changeUserRole(@PathVariable Integer id,
                                               @RequestBody ChangeUserRoleRequestDTO req) {
        userSvc.changeUserRole(id, req.getRole());
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

    @PatchMapping("/updateFirstName/{id}")
    public ResponseEntity<Void> updateFirstName(@PathVariable Integer id, @RequestBody UpdateFirstNameRequestDTO req) {
        userSvc.updateFirstName(id, req.getNewFirstName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/updateLastName/{id}")
    public ResponseEntity<Void> updateLastName(@PathVariable Integer id, @RequestBody UpdateLastNameRequestDTO req) {
        userSvc.updateLastName(id, req.getNewLastName());
        return ResponseEntity.noContent().build();
    }

    // OPTIONAL ra ni, mo update ni ang both first and last name in one request
    @PatchMapping("/updateName/{id}")
    public ResponseEntity<Void> updateName(@PathVariable Integer id, @RequestBody UpdateNameRequestDTO req) {
        userSvc.updateName(id, req.getNewFirstName(), req.getNewLastName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/deleteUser/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userSvc.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
