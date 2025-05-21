package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.enumeration.UserRoleEnum;
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

    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(RegistrationRequestDTO req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        if (userRepo.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already in use");
        }

        UserEntity u = new UserEntity();
        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setEmail(req.getEmail());
        u.setUsername(req.getUsername());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setPhoneNumber(req.getPhoneNumber());
        u.setRole(userRepo.count() == 0 ? UserRoleEnum.ADMIN : UserRoleEnum.CUSTOMER);
        userRepo.save(u);
        System.out.print("User registered: " + u.getEmail());
    }

    public GetUserResponseDTO getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity u = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        System.out.println("User found: " + u.getEmail());

        return new GetUserResponseDTO(
                u.getUserId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getRole().name(), u.getPhoneNumber()
        );
    }

    @Transactional
    public void updateCurrentUser(UpdateCurrentUserRequestDTO req) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity u = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!u.getEmail().equals(req.getEmail())
                && userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        if (!u.getUsername().equals(req.getUsername())
                && userRepo.findByUsername(req.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already in use");
        }

        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setEmail(req.getEmail());
        u.setUsername(req.getUsername());
        u.setPhoneNumber(req.getPhoneNumber());

        System.out.println("User updated: " + u.getEmail());

        userRepo.save(u);
    }

    @Transactional
    public void changePassword(ChangeCurrentUserPasswordRequestDTO req) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity u = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(req.getCurrentPassword(), u.getPassword())) {
            throw new IllegalArgumentException("Current password incorrect");
        }
        u.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(u);
    }

    @Transactional
    public void changeRole(Integer userId, String newRole) {
        UserEntity u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setRole(UserRoleEnum.valueOf(newRole));
        userRepo.save(u);
    }

    public List<GetUserResponseDTO> getAllUsers() {
        return userRepo.findAll().stream()
                .map(u -> new GetUserResponseDTO(
                        u.getUserId(), u.getFirstName(), u.getLastName(),
                        u.getEmail(), u.getRole().name(), u.getPhoneNumber()))
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
    public void updateFirstName(Integer userId, String newFirstName) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFirstName(newFirstName);
        userRepo.save(user);
    }

    @Transactional
    public void updateLastName(Integer userId, String newLastName) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setLastName(newLastName);
        userRepo.save(user);
    }

    @Transactional
    public void updateName(Integer userId, String newFirstName, String newLastName) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setFirstName(newFirstName);
        user.setLastName(newLastName);
        userRepo.save(user);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        UserEntity user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepo.delete(user);
    }
}
