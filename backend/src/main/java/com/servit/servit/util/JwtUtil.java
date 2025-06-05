package com.servit.servit.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    // Generate a secure 512-bit key for HS512 algorithm
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(
            "oGwzAKPM06mr1bPXUakGSRWPWbo3wuRCZ1MN8dChjJkLPUTwksTfrG8dLg5A1b9W2Mq4QbT2vw5HircGbpQZxykK0vDAgKfCvG5epajyGMY=".getBytes()
    );

    public String extractUsername(String token) {
        try {
            String username = extractClaim(token, Claims::getSubject);
            logger.debug("Extracted username from token: {}", username);
            return username;
        } catch (Exception e) {
            logger.error("Error extracting username from token: {}", e.getMessage(), e);
            throw e;
        }
    }

    public Date extractExpiration(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            logger.debug("Extracted expiration from token: {}", expiration);
            return expiration;
        } catch (Exception e) {
            logger.error("Error extracting expiration from token: {}", e.getMessage(), e);
            throw e;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        try {
            final Claims claims = extractAllClaims(token);
            T result = claimsResolver.apply(claims);
            logger.debug("Extracted claim from token: {}", result);
            return result;
        } catch (Exception e) {
            logger.error("Error extracting claim from token: {}", e.getMessage(), e);
            throw e;
        }
    }

    public Claims extractAllClaims(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(SECRET_KEY)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            logger.debug("Successfully extracted all claims from token");
            return claims;
        } catch (Exception e) {
            logger.error("Error extracting all claims from token: {}", e.getMessage(), e);
            throw e;
        }
    }

    private Boolean isTokenExpired(String token) {
        try {
            Date expiration = extractExpiration(token);
            boolean isExpired = expiration.before(new Date());
            logger.debug("Token expiration check - Expiration: {}, Is Expired: {}", expiration, isExpired);
            return isExpired;
        } catch (Exception e) {
            logger.error("Error checking token expiration: {}", e.getMessage(), e);
            throw e;
        }
    }

    public String generateToken(String username, String role, String firstName, String lastName, String email, String phoneNumber, Boolean isVerified) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("username", username);
        claims.put("firstName", firstName);
        claims.put("lastName", lastName);
        claims.put("email", email);
        claims.put("phoneNumber", phoneNumber);
        String token = createToken(claims, username);
        logger.debug("Generated new token for user: {} with role: {}", username, role);
        return token;
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 3)) // 3 hours
                .signWith(SECRET_KEY, SignatureAlgorithm.HS512)
                .compact();
    }

    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            boolean isValid = extractedUsername.equals(username) && !isTokenExpired(token);
            logger.debug("Token validation for user {}: {}", username, isValid);
            return isValid;
        } catch (Exception e) {
            logger.error("Error validating token: {}", e.getMessage(), e);
            return false;
        }
    }
}