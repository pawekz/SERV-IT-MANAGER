package com.servit.servit.service;

import com.servit.servit.util.EmailUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;

@Service
public class EmailService {

    @Autowired
    private EmailUtil emailUtil;

    public void sendOtpEmail(String to, String otp) throws MessagingException {
        String subject = "TESTING SENIOR CITIZEN";
        String htmlContent = "<html><body>"
                + "<h1>Account Verification</h1>"
                + "<p>OTP NImo DONG: <strong>" + otp + "</strong></p>"
                + "</body></html>";
        emailUtil.sendEmail(to, subject, htmlContent);
    }
}