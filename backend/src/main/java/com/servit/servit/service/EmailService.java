package com.servit.servit.service;

import com.amazonaws.services.s3.model.S3Object;
import com.servit.servit.util.EmailUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import java.io.IOException;
import java.text.NumberFormat;
import java.util.Locale;

@Service
public class EmailService {

    @Autowired
    private EmailUtil emailUtil;

    @Autowired
    private com.servit.servit.util.FileUtil fileUtil;

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
        if (pdfPath != null && pdfPath.contains("amazonaws.com/")) {
            // Download ang file sa AWS S3 and attach sa email as bytes
            String s3Key = extractS3KeyFromUrl(pdfPath);
            try {
                S3Object s3Object = fileUtil.downloadFileFromS3(s3Key);
                byte[] fileBytes;
                try (java.io.InputStream is = s3Object.getObjectContent()) {
                    fileBytes = is.readAllBytes();
                }
                emailUtil.sendEmailWithAttachment(to, subject, htmlContent, fileBytes, attachmentName);
            } catch (IOException e) {
                throw new MessagingException("Failed to download PDF from S3 for email attachment", e);
            }
        } else {
            // Local file path fallback
            emailUtil.sendEmailWithAttachment(to, subject, htmlContent, pdfPath, attachmentName);
        }
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

        String attachmentName = String.format("%s-warranty.pdf", WarrantyNumber);
        if (pdfPath != null && pdfPath.contains("amazonaws.com/")) {
            String s3Key = extractS3KeyFromUrl(pdfPath);
            try {
                S3Object s3Object = fileUtil.downloadFileFromS3(s3Key);
                byte[] fileBytes;
                try (java.io.InputStream is = s3Object.getObjectContent()) {
                    fileBytes = is.readAllBytes();
                }
                emailUtil.sendEmailWithAttachment(to, subject, htmlContent, fileBytes, attachmentName);
            } catch (IOException e) {
                throw new MessagingException("Failed to download PDF from S3 for email attachment", e);
            }
        } else {
            emailUtil.sendEmailWithAttachment(to, subject, htmlContent, pdfPath, attachmentName);
        }
    }

    public void sendQuotationWaitingForApprovalEmail(String to,
                                                     String customerName,
                                                     String ticketNumber,
                                                     QuotationOption recommended,
                                                     QuotationOption alternative,
                                                     String reminderCopy,
                                                     String supportNumber) throws MessagingException {
        String subject = "Waiting for Customer Approval - Ticket " + ticketNumber;
        String intro = "Our technician finished diagnosing your device and prepared two compatible component options. Please review Option A and Option B, then log in to choose the part you prefer.";
        String htmlContent = buildQuotationEmailTemplate(
                "Waiting for Customer Approval",
                customerName,
                ticketNumber,
                intro,
                reminderCopy,
                supportNumber,
                recommended,
                alternative);
        emailUtil.sendEmail(to, subject, htmlContent);
    }

    public void sendQuotationReminderEmail(String to,
                                           String customerName,
                                           String ticketNumber,
                                           QuotationOption recommended,
                                           QuotationOption alternative,
                                           String reminderCopy,
                                           String supportNumber) throws MessagingException {
        String subject = "Reminder: Quotation Pending Approval - Ticket " + ticketNumber;
        String intro = "This is a friendly reminder that your repair quotation is still waiting for your approval. Please compare the options below and respond so we can continue the repair.";
        String htmlContent = buildQuotationEmailTemplate(
                "Friendly Reminder: Action Required",
                customerName,
                ticketNumber,
                intro,
                reminderCopy,
                supportNumber,
                recommended,
                alternative);
        emailUtil.sendEmail(to, subject, htmlContent);
    }

    public void sendQuotationApprovedSummaryEmail(String to,
                                                  String customerName,
                                                  String ticketNumber,
                                                  QuotationOption approvedOption,
                                                  String supportNumber) throws MessagingException {
        String subject = "Quotation Approved Summary - Ticket " + ticketNumber;
        String intro = "Thanks for approving the quotation. Here's a quick summary of the part we will install, including the detailed pricing.";
        String htmlContent = buildQuotationEmailTemplate(
                "Quotation Approved",
                customerName,
                ticketNumber,
                intro,
                "We'll notify you when the repair progresses to the next stage.",
                supportNumber,
                approvedOption,
                null);
        emailUtil.sendEmail(to, subject, htmlContent);
    }

    private String buildQuotationEmailTemplate(String heading,
                                               String customerName,
                                               String ticketNumber,
                                               String intro,
                                               String reminderCopy,
                                               String supportNumber,
                                               QuotationOption primary,
                                               QuotationOption secondary) {
        String customer = customerName == null ? "Customer" : customerName;
        return "<html><head><style>" +
                "body{font-family:'Poppins',Arial,sans-serif;background:#f6f7fb;margin:0;padding:0;}" +
                ".wrapper{max-width:640px;margin:20px auto;background:#ffffff;border-radius:16px;box-shadow:0 12px 30px rgba(15,23,42,0.12);overflow:hidden;}" +
                ".header{background:#0f172a;color:#ffffff;padding:28px;text-align:center;font-size:22px;font-weight:600;letter-spacing:0.5px;}" +
                ".section{padding:24px 28px;color:#0f172a;}" +
                ".pill{display:inline-block;background:#e0f2fe;color:#0369a1;font-weight:600;padding:6px 14px;border-radius:999px;font-size:12px;margin-bottom:16px;}" +
                ".options{display:flex;flex-direction:column;gap:16px;}" +
                ".card{border:1px solid #e2e8f0;border-radius:12px;padding:20px;background:#f8fafc;}" +
                ".card h3{margin:0 0 8px;font-size:16px;color:#0f172a;}" +
                ".card p{margin:4px 0;color:#475569;font-size:14px;}" +
                ".amounts{display:flex;gap:24px;margin-top:12px;font-size:14px;color:#0f172a;}" +
                ".amounts span{display:block;font-weight:600;color:#0f172a;}" +
                ".footer{background:#0f172a;color:#cbd5f5;padding:20px;text-align:center;font-size:12px;}" +
                "</style></head><body>" +
                "<div class='wrapper'>" +
                "<div class='header'>" + heading + "</div>" +
                "<div class='section'>" +
                "<span class='pill'>Ticket " + ticketNumber + "</span>" +
                "<h2 style='margin:0 0 10px;'>Hi " + customer + ",</h2>" +
                "<p style='margin:0 0 18px;line-height:1.55;'>" + intro + "</p>" +
                renderOptionCard(primary) +
                renderOptionCard(secondary) +
                "<p style='margin:18px 0 0;font-size:13px;color:#0f172a;font-weight:600;'>" + reminderCopy + "</p>" +
                "<p style='margin:6px 0 0;font-size:13px;color:#475569;'>Need help deciding? Call us at <strong>" + supportNumber + "</strong> and reference ticket <strong>" + ticketNumber + "</strong>.</p>" +
                "</div>" +
                "<div class='footer'>© 2025 IOCONNECT • All rights reserved</div>" +
                "</div></body></html>";
    }

    private String renderOptionCard(QuotationOption option) {
        if (option == null) {
            return "";
        }
        return "<div class='card'>" +
                "<h3>" + option.getLabel() + "</h3>" +
                "<p><strong>Part:</strong> " + option.getPartName() + " (SKU: " + option.getSku() + ")</p>" +
                (option.getDescription() != null ? "<p style='font-size:13px;color:#64748b;'>" + option.getDescription() + "</p>" : "") +
                "<div class='amounts'>" +
                "<div><span>Part Cost</span>" + formatCurrency(option.getPartCost()) + "</div>" +
                "<div><span>Labor</span>" + formatCurrency(option.getLaborCost()) + "</div>" +
                "<div><span>Total</span>" + formatCurrency(option.getTotalCost()) + "</div>" +
                "</div>" +
                "</div>";
    }

    private String formatCurrency(double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "PH"));
        return formatter.format(amount);
    }

    public void sendEmployeeOnboardingEmail(String to, String firstName, String onboardingCode) throws MessagingException {
        String subject = "IOCONNECT Employee Onboarding Instructions";
        String htmlContent = "<html>" +
                "<head>" +
                "<style>" +
                "  body { font-family: Arial, sans-serif; background-color: #f2f2f2; margin: 0; padding: 0; }" +
                "  .email-container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); overflow: hidden; }" +
                "  .header { background-color: #33e407; color: #ffffff; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; }" +
                "  .content { padding: 20px; color: #333333; background-color: #fcfcfc; }" +
                "  .content h1 { font-size: 20px; margin-bottom: 10px; }" +
                "  .content p { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }" +
                "  .content ol { font-size: 16px; line-height: 1.5; margin-bottom: 20px; }" +
                "  .code-box { display: inline-block; padding: 10px 20px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #33e407; border-radius: 4px; margin: 10px 0; }" +
                "  .footer { text-align: center; padding: 10px; font-size: 12px; color: #888888; background-color: #f4f4f9; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "  <div class='email-container'>" +
                "    <div class='header' style='text-align: center;'>Employee Onboarding</div>" +
                "    <div class='content'>" +
                "      <h1>Hello " + firstName + ",</h1>" +
                "      <p>Welcome to <span style='color: #33e407;'>IO</span><span style='color: #000000;'>CONNECT</span>! Your employee account has been created.</p>" +
                "      <p>To activate your account, please follow these steps:</p>" +
                "      <ol>" +
                "        <li>Go to the Employee Onboarding page:<br><strong>https://weservit.tech/employee-onboarding</strong></li>" +
                "        <li>Enter your email address (<strong>" + to + "</strong>) in the Email field.</li>" +
                "        <li>Enter the Onboarding Code below in the Onboarding Code field.</li>" +
                "        <li>Click <strong>Verify Code</strong> and set your secure password.</li>" +
                "        <li>After successful registration, log in using this link:<br><strong>https://weservit.tech/login/staff</strong></li>" +
                "      </ol>" +
                "      <div style='text-align: center;'>" +
                "        <p>Your Onboarding Code:</p>" +
                "        <div class='code-box'>" + onboardingCode + "</div>" +
                "      </div>" +
                "      <p style='margin-top: 30px;'>If you did not expect this email, please ignore it or contact your administrator.</p>" +
                "    </div>" +
                "    <div class='footer' style='text-align: center;'>© 2025 IOCONNECT. All rights reserved.</div>" +
                "  </div>" +
                "</body>" +
                "</html>";
        emailUtil.sendEmail(to, subject, htmlContent);
    }

    private String extractS3KeyFromUrl(String s3Url) {
        int idx = s3Url.indexOf(".amazonaws.com/");
        if (idx == -1) return s3Url;
        return s3Url.substring(idx + ".amazonaws.com/".length());
    }

    public static class QuotationOption {
        private final String label;
        private final String partName;
        private final String sku;
        private final String description;
        private final double partCost;
        private final double laborCost;

        public QuotationOption(String label, String partName, String sku, String description, double partCost, double laborCost) {
            this.label = label;
            this.partName = partName;
            this.sku = sku;
            this.description = description;
            this.partCost = partCost;
            this.laborCost = laborCost;
        }

        public String getLabel() {
            return label;
        }

        public String getPartName() {
            return partName;
        }

        public String getSku() {
            return sku;
        }

        public String getDescription() {
            return description;
        }

        public double getPartCost() {
            return partCost;
        }

        public double getLaborCost() {
            return laborCost;
        }

        public double getTotalCost() {
            return partCost + laborCost;
        }
    }
}