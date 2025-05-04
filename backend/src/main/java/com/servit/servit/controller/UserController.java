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

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody RegistrationRequestDTO req) {
        userSvc.register(req);
        return ResponseEntity.status(201).build();
    }

    @GetMapping("/getCurrentUser")
    public ResponseEntity<GetCurrentUserResponseDTO> getCurrentUser() {
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

    @GetMapping
    public ResponseEntity<List<GetCurrentUserResponseDTO>> listUsers() {
        return ResponseEntity.ok(userSvc.listAllUsers());
    }

    @PatchMapping("/changeUserRole/{id}")
    public ResponseEntity<Void> changeUserRole(@PathVariable Integer id,
                                               @RequestBody ChangeUserRoleRequestDTO req) {
        userSvc.changeUserRole(id, req.getRole());
        return ResponseEntity.noContent().build();
    }
}
