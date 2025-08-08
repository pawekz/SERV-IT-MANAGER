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
        try {
            if (email == null || email.trim().isEmpty()) {
                logger.error("Cannot generate OTP: email is null or empty");
                throw new IllegalArgumentException("Email cannot be null or empty");
            }

            String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
            LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(5);

            otpStore.put(email, new OtpDetails(otp, expirationTime));
            logger.info("OTP generated successfully for email: {}", email);
            logger.debug("Generated OTP for {}: {} (expires at {})", email, otp, expirationTime);

            return otp;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid input for OTP generation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error occurred while generating OTP for email: {}", email, e);
            throw new RuntimeException("Failed to generate OTP", e);
        }
    }

    public boolean validateOtp(String email, String otp) {
        try {
            if (email == null || email.trim().isEmpty()) {
                logger.error("Cannot validate OTP: email is null or empty");
                return false;
            }

            if (otp == null || otp.trim().isEmpty()) {
                logger.error("Cannot validate OTP: OTP is null or empty for email: {}", email);
                return false;
            }

            OtpDetails details = otpStore.get(email);

            if (details == null) {
                logger.warn("OTP validation failed: No OTP found for email: {}", email);
                return false;
            }

            if (details.expirationTime.isBefore(LocalDateTime.now())) {
                logger.warn("OTP validation failed: OTP expired for email: {}", email);
                otpStore.remove(email);
                return false;
            }

            boolean isValid = details.otp.equals(otp);

            if (isValid) {
                logger.info("OTP validation successful for email: {}", email);
                otpStore.remove(email);
            } else {
                logger.warn("OTP validation failed: Invalid OTP provided for email: {}", email);
            }

            return isValid;
        } catch (Exception e) {
            logger.error("Unexpected error occurred while validating OTP for email: {}", email, e);
            return false;
        }
    }

    @PostConstruct
    public void startCleanupTask() {
        try {
            scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "otp-cleanup-thread");
                t.setDaemon(true);
                return t;
            });

            scheduler.scheduleAtFixedRate(this::cleanupExpiredOtps, 1, 1, TimeUnit.MINUTES);
            logger.info("OTP cleanup task started successfully");
        } catch (Exception e) {
            logger.error("Failed to start OTP cleanup task", e);
            throw new RuntimeException("Failed to initialize OTP cleanup service", e);
        }
    }

    @PreDestroy
    public void stopCleanupTask() {
        try {
            if (scheduler != null && !scheduler.isShutdown()) {
                scheduler.shutdown();

                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    logger.warn("Cleanup task did not terminate gracefully, forcing shutdown");
                    scheduler.shutdownNow();
                }

                logger.info("OTP cleanup task stopped successfully");
            }
        } catch (InterruptedException e) {
            logger.error("Interrupted while stopping cleanup task", e);
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.error("Error occurred while stopping cleanup task", e);
        }
    }

    private void cleanupExpiredOtps() {
        try {
            LocalDateTime now = LocalDateTime.now();
            int removedCount = 0;

            var iterator = otpStore.entrySet().iterator();
            while (iterator.hasNext()) {
                var entry = iterator.next();
                if (entry.getValue().expirationTime.isBefore(now)) {
                    iterator.remove();
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                logger.info("Cleaned up {} expired OTPs", removedCount);
            }

            logger.debug("OTP cleanup completed. Active OTPs: {}", otpStore.size());
        } catch (Exception e) {
            logger.error("Error occurred during OTP cleanup", e);
        }
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