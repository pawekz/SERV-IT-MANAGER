package com.servit.servit.service;

import com.amazonaws.services.s3.model.S3Object;
import com.servit.servit.util.EmailUtil;
import com.servit.servit.util.FileUtil;
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
    private FileUtil fileUtil;

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
            try (S3Object s3Object = fileUtil.downloadFileFromS3(s3Key)) {
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

    public void sendWarrrantyPdfEmail(String to, String WarrantyNumber, String customerFirstName, String customerLastName, String pdfPath) throws MessagingException {
        String customerName = (customerFirstName != null ? customerFirstName : "") + " " + (customerLastName != null ? customerLastName : "");
        customerName = customerName.trim();
        if (customerName.isEmpty()) {
            customerName = "Customer";
        }
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
            try (S3Object s3Object = fileUtil.downloadFileFromS3(s3Key)) {
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
        String intro = "Our technician has finished diagnosing your device and prepared two compatible component options. Please review Option A and Option B, then log in to choose your preferred part.";
        String htmlContent = buildQuotationEmailTemplate(
                "Waiting for Customer Approval",
                customerName,
                ticketNumber,
                intro,
                reminderCopy,
                supportNumber,
                recommended,
                alternative,
                false);

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
                alternative,
                false);

        emailUtil.sendEmail(to, subject, htmlContent);
    }

    public void sendQuotationApprovedSummaryEmail(String to,
                                                  String customerName,
                                                  String ticketNumber,
                                                  QuotationOption approvedOption,
                                                  String supportNumber) throws MessagingException {

        String subject = "Quotation Approved Summary - Ticket " + ticketNumber;
        String intro = "Thanks for approving the quotation. Here's a quick summary of the part we will install, including detailed pricing.";
        String htmlContent = buildQuotationEmailTemplate(
                "Quotation Approved",
                customerName,
                ticketNumber,
                intro,
                "We'll notify you when the repair progresses to the next stage.",
                supportNumber,
                approvedOption,
                null,
                true);

        emailUtil.sendEmail(to, subject, htmlContent);
    }


    private String buildQuotationEmailTemplate(String heading,
                                               String customerName,
                                               String ticketNumber,
                                               String intro,
                                               String reminderCopy,
                                               String supportNumber,
                                               QuotationOption primary,
                                               QuotationOption secondary,
                                               boolean isApprovedSummary) {

        String customer = customerName == null ? "Customer" : customerName;
        String optionCards = "";
        if (!isApprovedSummary) {
            String primaryCard = renderOptionCard(primary);
            String secondaryCard = renderOptionCard(secondary);
            StringBuilder grid = new StringBuilder("<div class='options-grid'>");
            if (primaryCard != null && !primaryCard.isEmpty()) grid.append(primaryCard);
            if (secondaryCard != null && !secondaryCard.isEmpty()) grid.append(secondaryCard);
            grid.append("</div>");
            optionCards = grid.toString();
        }

        String ctaButton = "<div style='text-align:center;margin-top:18px;'><a href='https://weservit.tech/login' style='display:inline-block;padding:12px 20px;border-radius:6px;background-color:#33e407;color:#ffffff;text-decoration:none;font-weight:600;'>View Quotation</a></div>";

        // Build a concise breakdown table for approved summary (keeps single card + breakdown)
        String pricingTable = "";
        if (isApprovedSummary && primary != null && !primary.getParts().isEmpty()) {
            StringBuilder tableRows = new StringBuilder();
            for (PartInfo part : primary.getParts()) {
                tableRows.append("<tr><td style='padding:10px 12px;border:1px solid #f0f6f1;'>Part: ")
                        .append(escape(part.getPartName())).append(" (SKU: ").append(escape(part.getSku()))
                        .append(")</td><td style='padding:10px 12px;border:1px solid #f0f6f1;text-align:right;'>")
                        .append(formatCurrency(part.getPartCost())).append("</td></tr>");
            }
            pricingTable = "<div style='margin-top:18px;'>" +
                    "<table role='table' style='width:100%;border-collapse:collapse;font-size:14px;'>" +
                    "<thead><tr style='background:#f3fdf4;color:#065f46;text-align:left;'><th style='padding:10px 12px;border:1px solid #e6f3ea;'>Item</th><th style='padding:10px 12px;border:1px solid #e6f3ea;text-align:right;'>Amount</th></tr></thead>" +
                    "<tbody>" +
                    tableRows +
                    "<tr><td style='padding:10px 12px;border:1px solid #f0f6f1;'>Labor</td><td style='padding:10px 12px;border:1px solid #f0f6f1;text-align:right;'>" + formatCurrency(primary.getLaborCost()) + "</td></tr>" +
                    "<tr style='font-weight:700;background:#ffffff;'><td style='padding:10px 12px;border:1px solid #e6f3ea;'>Total</td><td style='padding:10px 12px;border:1px solid #e6f3ea;text-align:right;'>" + formatCurrency(primary.getTotalCost()) + "</td></tr>" +
                    "</tbody></table></div>";
        }

        return "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; background-color: #f4f6f5; margin: 0; padding: 0; }" +
                ".email-container { max-width: 720px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); overflow: hidden; }" +
                ".header { background-color: #33e407; color: #ffffff; padding: 22px; text-align: center; font-size: 24px; font-weight: 700; }" +
                ".content { padding: 24px; color: #1f2937; background-color: #ffffff; }" +
                ".content h1 { font-size: 20px; margin-bottom: 8px; }" +
                ".content p { font-size: 15px; line-height: 1.6; margin-bottom: 14px; }" +
                ".ticket-box { display: inline-block; padding: 8px 14px; font-size: 15px; font-weight: 700; color: #ffffff; background-color: #33e407; border-radius: 6px; margin: 12px 0; }" +
                ".options-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 12px; }" +
                ".option-card { border: 1px solid #e6f3ea; border-radius: 10px; padding: 14px; background: #f8fdf9; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }" +
                ".option-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }" +
                ".option-card__title { font-size: 16px; font-weight: 700; color: #064e3b; }" +
                ".option-card__meta { font-size: 12px; font-weight: 600; color: #047857; background: #e7f8ec; padding: 4px 8px; border-radius: 999px; }" +
                ".option-card__parts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }" +
                ".option-card__parts-title { font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }" +
                ".part-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: #1f2937; padding: 8px 10px; background: #ffffff; border: 1px solid #ecf5ef; border-radius: 8px; }" +
                ".part-row .part-name { font-weight: 600; color: #0b3b2e; }" +
                ".part-row .part-sku { font-size: 12px; color: #6b7280; }" +
                ".amounts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px; font-weight: 600; }" +
                ".amounts div { background: #ffffff; border: 1px solid #ecf5ef; border-radius: 8px; padding: 10px; }" +
                ".amounts span { display: block; font-weight: 500; font-size: 12px; color: #6b7280; margin-bottom: 4px; }" +
                ".amounts .total { color: #065f46; font-size: 14px; }" +
                ".footer { text-align: center; padding: 14px; font-size: 12px; color: #6b7280; background-color: #f3f6f5; }" +
                "a.cta { display:inline-block;padding:12px 20px;border-radius:6px;background-color:#33e407;color:#ffffff;text-decoration:none;font-weight:600;margin-top:10px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='email-container'>" +
                "<div class='header'>" + heading + "</div>" +
                "<div class='content'>" +
                "<h1>Hello " + customer + ",</h1>" +
                "<p>" + intro + "</p>" +
                "<div class='ticket-box'>Ticket " + ticketNumber + "</div>" +
                optionCards +
                (isApprovedSummary ? pricingTable : "") +
                (reminderCopy != null ? "<p style='font-weight:700;color:#064e3b;margin-top:12px;'>" + reminderCopy + "</p>" : "") +
                ctaButton +
                "<p style='margin-top:18px;'>Need help deciding? Call <strong>" + supportNumber + "</strong> referencing ticket <strong>" + ticketNumber + "</strong>.</p>" +
                "</div>" +
                "<div class='footer'>© 2025 IOCONNECT. All rights reserved.</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }


    private String renderOptionCard(QuotationOption option) {
        if (option == null || option.getParts().isEmpty()) return "";
        
        StringBuilder partsHtml = new StringBuilder();
        for (PartInfo part : option.getParts()) {
            partsHtml.append("<div class='part-row'>")
                    .append("<div class='part-name'>").append(escape(part.getPartName())).append("</div>")
                    .append("<div class='part-sku'>SKU: ").append(escape(part.getSku())).append("</div>")
                    .append("</div>");
        }

        String partCount = option.getParts().size() == 1 ? "1 part" : option.getParts().size() + " parts";

        return "<div class='option-card'>" +
                "<div class='option-card__header'>" +
                "<div class='option-card__title'>" + escape(option.getLabel()) + "</div>" +
                "<div class='option-card__meta'>" + partCount + "</div>" +
                "</div>" +
                "<div class='option-card__parts'>" +
                "<div class='option-card__parts-title'>Included parts</div>" +
                partsHtml +
                "</div>" +
                "<div class='amounts'>" +
                "<div><span>Parts Total</span>" + formatCurrency(option.getPartCost()) + "</div>" +
                "<div><span>Labor</span>" + formatCurrency(option.getLaborCost()) + "</div>" +
                "<div><span>Total</span><span class='total'>" + formatCurrency(option.getTotalCost()) + "</span></div>" +
                "</div>" +
                "</div>";
    }

    private String formatCurrency(double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("en", "PH"));
        return formatter.format(amount);
    }

    // HTML-escape helper for safe email rendering
    private String escape(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
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

    public static class PartInfo {
        private final String partName;
        private final String sku;
        private final String description;
        private final double partCost;

        public PartInfo(String partName, String sku, String description, double partCost) {
            this.partName = partName;
            this.sku = sku;
            this.description = description;
            this.partCost = partCost;
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
    }

    public static class QuotationOption {
        private final String label;
        private final java.util.List<PartInfo> parts;
        private final double laborCost;

        // Constructor for single part (backward compatibility)
        public QuotationOption(String label, String partName, String sku, String description, double partCost, double laborCost) {
            this.label = label;
            this.parts = java.util.Collections.singletonList(new PartInfo(partName, sku, description, partCost));
            this.laborCost = laborCost;
        }

        // Constructor for multiple parts
        public QuotationOption(String label, java.util.List<PartInfo> parts, double laborCost) {
            this.label = label;
            this.parts = parts != null ? parts : java.util.Collections.emptyList();
            this.laborCost = laborCost;
        }

        public String getLabel() {
            return label;
        }

        public java.util.List<PartInfo> getParts() {
            return parts;
        }

        public double getLaborCost() {
            return laborCost;
        }

        // Backward compatibility methods (use first part)
        public String getPartName() {
            return parts.isEmpty() ? "" : parts.get(0).getPartName();
        }

        public String getSku() {
            return parts.isEmpty() ? "" : parts.get(0).getSku();
        }

        public String getDescription() {
            return parts.isEmpty() ? null : parts.get(0).getDescription();
        }

        public double getPartCost() {
            return parts.stream().mapToDouble(PartInfo::getPartCost).sum();
        }

        public double getTotalCost() {
            return getPartCost() + laborCost;
        }
    }
}

