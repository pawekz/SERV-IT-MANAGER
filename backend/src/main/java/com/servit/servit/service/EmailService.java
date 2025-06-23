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
                "    <div class='footer' style='text-align: center;'>© 2025 IOCONNECT. All rights reserved.</div>" +
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

    public void sendRepairTicketPdfEmail(String to, String ticketNumber, String customerName, String pdfPath) throws MessagingException {
        String subject = "Repair Ticket Confirmation - " + ticketNumber + " - IOCONNECT";
        String htmlContent = "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }" +
                "  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); overflow: hidden; }" +
                "  .header { background-color: #33e407; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }" +
                "  .content { padding: 20px; color: #333333; background-color: #fcfcfc; }" +
                "  .content h1 { font-size: 20px; margin-bottom: 10px; color: #333333; }" +
                "  .content p { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }" +
                "  .ticket-box { display: inline-block; padding: 10px 20px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #33e407; border-radius: 4px; margin: 10px 0; }" +
                "  .footer { text-align: center; padding: 10px; font-size: 12px; color: #888888; background-color: #f4f4f9; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header' style='text-align: center;'>Repair Ticket Confirmation</div>" +
                "    <div class='content'>" +
                "      <div style='text-align: center;'>" +
                "        <h1>Hello " + customerName + ",</h1>" +
                "        <p>Thank you for choosing <span style='color: #33e407;'>IO</span><span style='color: #000000;'>CONNECT</span> for your device repair needs.</p>" +
                "        <p>Your repair ticket has been successfully created and checked in to our system.</p>" +
                "        <div class='ticket-box'>" + ticketNumber + "</div>" +
                "      </div>" +
                "      <p style='margin-top: 30px;'>What's Next?</p>" +
                "      <ul>" +
                "        <li>Our technician will begin diagnosing your device</li>" +
                "        <li>You will receive updates on the repair progress</li>" +
                "        <li>We'll notify you when your device is ready for pickup</li>" +
                "      </ul>" +
                "      <div style='text-align: center; margin-top: 30px;'>" +
                "        <p>Please find your repair ticket details attached as a PDF document for your records. If you have any questions, please don't hesitate to contact our support team.</p>" +
                "        <p>Thank you for your business!</p>" +
                "      </div>" +
                "    </div>" +
                "    <div class='footer' style='text-align: center;'>© 2025 IOCONNECT. All rights reserved.</div>" +
                "  </div>" +
                "</body>" +
                "</html>";

        String attachmentName = String.format("%s-repair-ticket.pdf", ticketNumber);
        emailUtil.sendEmailWithAttachment(to, subject, htmlContent, pdfPath, attachmentName);
    }

    public void sendGenericNotificationEmail(String to, String subject, String message) throws MessagingException {
        String htmlContent = "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }" +
                "  .email-container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }" +
                "  .header { background: #33e407; color: #fff; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-align: center; }" +
                "  .content { padding: 30px 24px; color: #222; font-size: 16px; }" +
                "  .footer { text-align: center; padding: 10px; font-size: 12px; color: #888888; background-color: #f4f4f9; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header'>Notification</div>" +
                "    <div class='content'>" +
                "      <h2 style='margin-top:0;'>" + subject + "</h2>" +
                "      <p>" + message + "</p>" +
                "    </div>" +
                "    <div class='footer'>© 2025 IOCONNECT. All rights reserved.</div>" +
                "  </div>" +
                "</body>" +
                "</html>";
        emailUtil.sendEmail(to, subject, htmlContent);
    }

    public void sendWarrrantyPdfEmail(String to, String WarrantyNumber, String customerName, String pdfPath) throws MessagingException {
        String subject = "Warranty Check In Confirmation - " + WarrantyNumber + " - IOCONNECT";
        String htmlContent = "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }" +
                "  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); overflow: hidden; }" +
                "  .header { background-color: #33e407; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }" +
                "  .content { padding: 20px; color: #333333; background-color: #fcfcfc; }" +
                "  .content h1 { font-size: 20px; margin-bottom: 10px; color: #333333; }" +
                "  .content p { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }" +
                "  .ticket-box { display: inline-block; padding: 10px 20px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #33e407; border-radius: 4px; margin: 10px 0; }" +
                "  .footer { text-align: center; padding: 10px; font-size: 12px; color: #888888; background-color: #f4f4f9; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header' style='text-align: center;'>Repair Ticket Confirmation</div>" +
                "    <div class='content'>" +
                "      <div style='text-align: center;'>" +
                "        <h1>Hello " + customerName + ",</h1>" +
                "        <p>Thank you for submitting a warranty request with <span style='color: #33e407;'>IO</span><span style='color: #000000;'>CONNECT</span> .</p>" +
                "        <p>Your request has been successfully created and checked in to our system.</p>" +
                "        <div class='ticket-box'>" + WarrantyNumber + "</div>" +
                "      </div>" +
                "      <p style='margin-top: 30px;'>What's Next?</p>" +
                "      <ul>" +
                "        <li>Please bring your device to our nearest IOCONNECT store to be return</li>" +
                "        <li>Our team will assess the issue and verify warranty coverage.</li>" +
                "        <li>We'll notify you with updates and when the item is ready for pickup.</li>" +
                "      </ul>" +
                "      <div style='text-align: center; margin-top: 30px;'>" +
                "        <p>Please find your warranty request details attached as a PDF document for your records. If you have any questions, please don't hesitate to contact our support team.</p>" +
                "        <p>Thank you for your business!</p>" +
                "      </div>" +
                "    </div>" +
                "    <div class='footer' style='text-align: center;'>© 2025 IOCONNECT. All rights reserved.</div>" +
                "  </div>" +
                "</body>" +
                "</html>";

        String attachmentName = String.format("%s-repair-ticket.pdf", WarrantyNumber);
        emailUtil.sendEmailWithAttachment(to, subject, htmlContent, pdfPath, attachmentName);
    }
}