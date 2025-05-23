// OtpService.java
package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.*;

@Service
public class OtpService {
    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);
    private final Map<String, OtpDetails> otpStore = new ConcurrentHashMap<>();
    private ScheduledExecutorService scheduler;

    public String generateOtp(String email) {
        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(5);
        otpStore.put(email, new OtpDetails(otp, expirationTime));
        logger.debug("Generated OTP for {}: {} (expires at {})", email, otp, expirationTime);
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        OtpDetails details = otpStore.get(email);
        if (details == null || details.expirationTime.isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            return false;
        }
        boolean isValid = details.otp.equals(otp);
        if (isValid) otpStore.remove(email);
        return isValid;
    }

    @PostConstruct
    public void startCleanupTask() {
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(this::cleanupExpiredOtps, 1, 1, TimeUnit.MINUTES);
    }

    @PreDestroy
    public void stopCleanupTask() {
        if (scheduler != null) scheduler.shutdown();
    }

    private void cleanupExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        otpStore.entrySet().removeIf(entry -> entry.getValue().expirationTime.isBefore(now));
        logger.debug("Expired OTPs cleaned up");
    }

    private static class OtpDetails {
        final String otp;
        final LocalDateTime expirationTime;
        OtpDetails(String otp, LocalDateTime expirationTime) {
            this.otp = otp;
            this.expirationTime = expirationTime;
        }
    }
}