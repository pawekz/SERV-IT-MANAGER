package com.servit.servit.service;

import com.servit.servit.DTO.*;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.util.UserRole;
import org.apache.catalina.User;
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
    public void register(RegistrationRequest req) {
        if (req.getEmail() == null || req.getPassword() == null || req.getFirstName() == null || req.getLastName() == null) {
            throw new IllegalArgumentException("All fields are required");
        }

        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        UserEntity u = new UserEntity();
        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setEmail(req.getEmail());
        u.setUsername(req.getEmail()); // Set username to email
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setRole(userRepo.count() == 0 ? UserRole.ADMIN : UserRole.CUSTOMER);
        userRepo.save(u);
        System.out.print("User registered: " + u.getEmail());
    }

    public ProfileResponse getCurrentUserProfile() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity u = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new ProfileResponse(
                u.getUser_id(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getRole().name()
        );
    }

    @Transactional
    public void updateProfile(UpdateProfileRequest req) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        UserEntity u = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!u.getEmail().equals(req.getEmail())
                && userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }
        u.setFirstName(req.getFirstName());
        u.setLastName(req.getLastName());
        u.setEmail(req.getEmail());
        userRepo.save(u);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest req) {
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
    public void changeUserRole(Integer userId, String newRole) {
        // ensure current is ADMIN
        if (!SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new SecurityException("Admin privileges required");
        }
        UserEntity u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        u.setRole(UserRole.valueOf(newRole));
        userRepo.save(u);
    }

    public List<ProfileResponse> listAllUsers() {
        return userRepo.findAll().stream()
                .map(u -> new ProfileResponse(
                        u.getUser_id(), u.getFirstName(), u.getLastName(),
                        u.getEmail(), u.getRole().name()))
                .toList();
    }
}
