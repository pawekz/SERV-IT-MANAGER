package com.servit.servit.util;

import com.servit.servit.service.ConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class FileUtil {

    private final ConfigurationService configurationService;

    @Autowired
    public FileUtil(ConfigurationService configurationService) {
        this.configurationService = configurationService;
    }

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final List<String> VALID_IMAGE_EXTENSIONS = List.of(".png", ".jpg", ".jpeg");

    public String saveRepairPhoto(MultipartFile file, String ticketNumber, int incrementalNumber) throws IOException {
        validatePhoto(file);

        String fileExtension = getFileExtension(file);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-rp-%s-%02d%s", ticketNumber, date, incrementalNumber, fileExtension);

        String basePath = configurationService.getTicketFilesBasePath();
        Path filePath = Paths.get(basePath, "images", "repair_photos", fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }

    public String saveDigitalSignature(MultipartFile file, String ticketNumber) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty");
        }

        String fileExtension = getFileExtension(file);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-sig-%s%s", ticketNumber, date, fileExtension);

        String basePath = configurationService.getTicketFilesBasePath();
        Path filePath = Paths.get(basePath, "images", "digital_signatures", fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }

    public String saveRepairTicketPdf(MultipartFile file, String ticketNumber) throws IOException {
        validateDocument(file);

        String fileExtension = getFileExtension(file);
        String date = LocalDate.now().format(DATE_FORMATTER);
        String fileName = String.format("%s-repair-ticket-%s%s", ticketNumber, date, fileExtension);

        String basePath = configurationService.getTicketFilesBasePath();
        Path filePath = Paths.get(basePath, "documents", "claim_forms", fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        return filePath.toString();
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
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        return originalFilename.substring(originalFilename.lastIndexOf("."));
    }
}