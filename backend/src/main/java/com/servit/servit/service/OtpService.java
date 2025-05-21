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
        otpStore.put(email, new OtpDetails(otp, LocalDateTime.now().plusMinutes(5)));
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        OtpDetails details = otpStore.get(email);
        if (details == null || details.expirationTime().isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return true;
        }
        boolean isValid = details.otp().equals(otp);
        if (isValid) {
            otpStore.remove(email);
        }
        return !isValid;
    }

    public void invalidateOtp(String email) {
        otpStore.remove(email);
    }

    private record OtpDetails(String otp, LocalDateTime expirationTime) {

    }
}