package com.servit.servit.service;

import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        logger.debug("Loading user by identifier: {}", identifier);
        
        UserEntity user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> {
                    logger.error("User not found with identifier: {}", identifier);
                    return new UsernameNotFoundException("User not found with identifier: " + identifier);
                });

        logger.debug("Found user: {}, role: {}, isVerified: {}, status: {}", 
            user.getUsername(), 
            user.getRole(), 
            user.getIsVerified(),
            user.getStatus());

        UserDetails userDetails = User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();

        logger.debug("Created UserDetails with roles: {}", userDetails.getAuthorities());
        return userDetails;
    }
}