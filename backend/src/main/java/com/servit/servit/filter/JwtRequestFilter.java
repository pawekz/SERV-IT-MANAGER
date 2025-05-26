package com.servit.servit.filter;

import com.servit.servit.service.CustomUserDetailsService;
import com.servit.servit.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtRequestFilter.class);

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        logger.debug("Processing request for {} {}", request.getMethod(), request.getRequestURI());

        final String authorizationHeader = request.getHeader("Authorization");

        String identifier = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            logger.debug("Authorization header found, extracting token: {}", jwt);
            try {
                identifier = jwtUtil.extractUsername(jwt);
                logger.debug("Extracted identifier from token: {}", identifier);
            } catch (Exception e) {
                logger.error("Error extracting username from token: {}", e.getMessage());
                // Consider setting response status to 401 or 403 here if token is malformed/invalid
            }
        } else {
            logger.debug("Authorization header missing or does not start with Bearer");
        }

        if (identifier != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.debug("Identifier found ({}), attempting to load UserDetails", identifier);
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(identifier);
                logger.debug("UserDetails loaded for user: {}", userDetails.getUsername());

                if (jwtUtil.validateToken(jwt, userDetails.getUsername())) {
                    logger.debug("Token is valid, setting SecurityContextHolder authentication");
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    logger.debug("Token validation failed for user: {}", userDetails.getUsername());
                }
            } catch (Exception e) {
                 logger.error("Error loading user details or validating token: {}", e.getMessage());
                 // Consider setting response status to 401 or 403 here if user not found or validation fails
            }
        } else {
             if (identifier == null) {
                 logger.debug("Identifier is null, cannot authenticate");
             } else { // SecurityContextHolder.getContext().getAuthentication() != null
                 logger.debug("User already authenticated in SecurityContextHolder");
             }
        }

        chain.doFilter(request, response);
        logger.debug("Finished processing request for {} {}", request.getMethod(), request.getRequestURI());
    }
}