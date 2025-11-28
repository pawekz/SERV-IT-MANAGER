package com.servit.servit.util;

import com.servit.servit.service.ConfigurationService;
import com.servit.servit.service.S3Service;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class FileUtil {

    private final ConfigurationService configurationService;
    private final S3Service s3Service;

    @Autowired
    public FileUtil(ConfigurationService configurationService, S3Service s3Service) {
        this.configurationService = configurationService;
        this.s3Service = s3Service;
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final List<String> VALID_IMAGE_EXTENSIONS = List.of(".png", ".jpg", ".jpeg");

    private MultipartFile compressImage(MultipartFile file) throws IOException {
        String fileExtension = getFileExtension(file).toLowerCase();
        if (!VALID_IMAGE_EXTENSIONS.contains(fileExtension)) {
            return file;
        }
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Thumbnails.of(file.getInputStream())
                .size(1280, 1280)
                .outputQuality(0.75)
                .outputFormat(fileExtension.replace(".", ""))
                .toOutputStream(outputStream);
        byte[] compressedBytes = outputStream.toByteArray();
        return new MockMultipartFile(
                file.getName(),
                file.getOriginalFilename(),
                file.getContentType(),
                compressedBytes
        );
    }

    public String saveRepairPhoto(MultipartFile file, String ticketNumber, int incrementalNumber) throws IOException {
        validatePhoto(file);
        MultipartFile compressedFile = compressImage(file);
        String fileExtension = getFileExtension(compressedFile);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-rp-%s-%02d%s", ticketNumber, date, incrementalNumber, fileExtension);

        return s3Service.uploadFile(compressedFile, "images/repair_photos/" + fileName);
    }

    public String saveRepairTicketPdf(MultipartFile file, String ticketNumber) throws IOException {
        validateDocument(file);

        String fileExtension = getFileExtension(file);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-repair-ticket-%s%s", ticketNumber, date, fileExtension);

        return s3Service.uploadFile(file, "documents/claim_forms/" + fileName);
    }

    private void validatePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo must not be null or empty");
        }

        String fileExtension = getFileExtension(file);
        if (!VALID_IMAGE_EXTENSIONS.contains(fileExtension.toLowerCase())) {
            throw new IllegalArgumentException("Invalid photo type. Only PNG, JPG, and JPEG are allowed.");
        }
    }

    private void validateDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Document must not be null or empty");
        }

        String fileExtension = getFileExtension(file);
        if (!".pdf".equalsIgnoreCase(fileExtension)) {
            throw new IllegalArgumentException("Invalid document type. Only PDF files are allowed.");
        }
    }

    private String getFileExtension(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType != null) {
                if (contentType.contains("jpeg") || contentType.contains("jpg")) {
                    return ".jpg";
                } else if (contentType.contains("png")) {
                    return ".png";
                } else if (contentType.contains("pdf")) {
                    return ".pdf";
                }
            }
            throw new IllegalArgumentException("Invalid file name: filename is null or empty and content type could not be determined");
        }
        int lastDotIndex = originalFilename.lastIndexOf(".");
        if (lastDotIndex == -1 || lastDotIndex == originalFilename.length() - 1) {
            String contentType = file.getContentType();
            if (contentType != null) {
                if (contentType.contains("jpeg") || contentType.contains("jpg")) {
                    return ".jpg";
                } else if (contentType.contains("png")) {
                    return ".png";
                } else if (contentType.contains("pdf")) {
                    return ".pdf";
                }
            }
            throw new IllegalArgumentException("Invalid file name: no extension found in filename '" + originalFilename + "' and content type could not be determined");
        }
        return originalFilename.substring(lastDotIndex);
    }

    public String saveWarrantyTicketPdf(MultipartFile file, String warrantyNumber) throws IOException {
        validateDocument(file);

        String fileExtension = getFileExtension(file);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-warranty-ticket-%s%s", warrantyNumber, date, fileExtension);

        return s3Service.uploadFile(file, "documents/claim_forms/" + fileName);
    }

    public String saveWarrantyPhoto(MultipartFile file, String warrantyNumber, int incrementalNumber) throws IOException {
        validatePhoto(file);
        MultipartFile compressedFile = compressImage(file);
        String fileExtension = getFileExtension(compressedFile);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-rp-%s-%02d%s", warrantyNumber, date, incrementalNumber, fileExtension);

        return s3Service.uploadFile(compressedFile, "images/repair_photos/" + fileName);
    }

    public String saveAfterRepairPhoto(MultipartFile file, String ticketNumber, int incrementalNumber) throws IOException {
        validatePhoto(file);
        MultipartFile compressedFile = compressImage(file);
        String fileExtension = getFileExtension(compressedFile);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-arp-%s-%02d%s", ticketNumber, date, incrementalNumber, fileExtension);

        return s3Service.uploadFile(compressedFile, "images/after_repair_photos/" + fileName);
    }

    public String saveProfilePicture(MultipartFile file, Integer userId) throws IOException {
        validatePhoto(file);
        MultipartFile compressedFile = compressImage(file);
        String fileExtension = getFileExtension(compressedFile);
        String fileName = String.format("user-%d-profile%s", userId, fileExtension);

        return s3Service.uploadFile(compressedFile, "images/profile_pictures/" + fileName);
    }

    public String savePartPhoto(MultipartFile file, String partNumber) throws IOException {
        validatePhoto(file);
        MultipartFile compressedFile = compressImage(file);
        String fileExtension = getFileExtension(compressedFile);
        String fileName = String.format("%s%s", partNumber, fileExtension);

        return s3Service.uploadFile(compressedFile, "images/parts/" + fileName);
    }

    public void deleteProfilePicture(String profilePictureUrl) {
        if (profilePictureUrl == null || profilePictureUrl.isEmpty()) {
            return;
        }
        int idx = profilePictureUrl.indexOf(".amazonaws.com/");
        if (idx == -1) {
            return;
        }
        String s3Key = profilePictureUrl.substring(idx + ".amazonaws.com/".length());
        s3Service.deleteFile(s3Key);
    }

    public com.amazonaws.services.s3.model.S3Object downloadFileFromS3(String s3Key) {
        return s3Service.downloadFile(s3Key);
    }
}