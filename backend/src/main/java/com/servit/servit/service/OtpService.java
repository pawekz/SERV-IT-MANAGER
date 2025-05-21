package com.servit.servit.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {

    private final Map<String, OtpDetails> otpStore = new ConcurrentHashMap<>();

    public String generateOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(email, new OtpDetails(otp, LocalDateTime.now().plusHours(24)));
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        OtpDetails details = otpStore.get(email);
        if (details == null || details.getExpirationTime().isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }
        boolean isValid = details.getOtp().equals(otp);
        if (isValid) {
            otpStore.remove(email); // OTP is single-use
        }
        return isValid;
    }

    private static class OtpDetails {
        private final String otp;
        private final LocalDateTime expirationTime;

        public OtpDetails(String otp, LocalDateTime expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }

        public String getOtp() {
            return otp;
        }

        public LocalDateTime getExpirationTime() {
            return expirationTime;
        }
    }
}