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
        String subject = "Account Verification Request (OTP) - IOCONNECT";
        String htmlContent = "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }" +
                "  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); overflow: hidden; }" +
                "  .header { background-color: #33e407; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }" +
                "  .content { padding: 20px; color: #333333; background-color: #fcfcfc; }" +
                "  .content h1 { font-size: 20px; margin-bottom: 10px; }" +
                "  .content p { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }" +
                "  .otp-box { display: inline-block; padding: 10px 20px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #33e407; border-radius: 4px; }" +
                "  .footer { text-align: center; padding: 10px; font-size: 12px; color: #888888; background-color: #f4f4f9; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container' style='text-align: center;'>" +
                "    <div class='header' style='text-align: center;'>Account Verification</div>" +
                "    <div class='content' style='text-align: center;'>" +
                "      <h1>Welcome to <span style='color: #33e407;'>IO</span><span style='color: #000000;'>CONNECT</span>!</h1>" +
                "      <p>Thank you for signing up.</p>" +
                "      <p>Please log in and use the OTP below to verify your account:</p>" +
                "      <div class='otp-box'>" + otp + "</div>" +
                "      <p>If you did not request this, please ignore this email.</p>" +
                "    </div>" +
                "    <div class='footer' style='text-align: center;'>© 2011 IOCONNECT. All rights reserved.</div>" +
                "  </div>" +
                "</body>" +
                "</html>";
        emailUtil.sendEmail(to, subject, htmlContent);
    }

    public void sendForgotPasswordEmail(String to, String otp) throws MessagingException {
        String subject = "Reset Your Password - IOCONNECT";
        String htmlContent = "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }" +
                "  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); overflow: hidden; }" +
                "  .header { background-color: #33e407; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }" +
                "  .content { padding: 20px; color: #333333; background-color: #fcfcfc; }" +
                "  .content h1 { font-size: 20px; margin-bottom: 10px; }" +
                "  .content p { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }" +
                "  .otp-box { display: inline-block; padding: 10px 20px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #33e407; border-radius: 4px; }" +
                "  .footer { text-align: center; padding: 10px; font-size: 12px; color: #888888; background-color: #f4f4f9; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container' style='text-align: center;'>" +
                "    <div class='header' style='text-align: center;'>Reset Your Password</div>" +
                "    <div class='content' style='text-align: center;'>" +
                "      <p>You requested to reset your password.</p>" +
                "      <p>Use the OTP below to proceed:</p>" +
                "      <div class='otp-box'>" + otp + "</div>" +
                "      <p>If you did not request this, please ignore this email.</p>" +
                "    </div>" +
                "    <div class='footer' style='text-align: center;'>© 2011 IOCONNECT. All rights reserved.</div>" +
                "  </div>" +
                "</body>" +
                "</html>";
        emailUtil.sendEmail(to, subject, htmlContent);
    }
}