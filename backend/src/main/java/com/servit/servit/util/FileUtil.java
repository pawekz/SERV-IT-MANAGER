package com.servit.servit.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;

@Service
public class FileUtil {

    @Value("${upload.dir}/images/repair_photos/")
    private String repairPhotosDir;

    @Value("${upload.dir}/images/digital_signatures/")
    private String digitalSignaturesDir;

    @Value("${upload.dir}/documents/claim_forms/")
    private String claimFormsDir;
    private final SecureRandom random = new SecureRandom();

    public String saveRepairPhoto(MultipartFile file, String ticketNumber, int incrementalNumber) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = String.format("%s-rp-%d-%06d%s", ticketNumber, incrementalNumber, random.nextInt(1_000_000), fileExtension);

        Path filePath = Paths.get(repairPhotosDir).resolve(fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }

    public String saveDigitalSignature(MultipartFile file, String ticketNumber) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = String.format("%s-sig-%06d%s", ticketNumber, random.nextInt(1_000_000), fileExtension);

        Path filePath = Paths.get(digitalSignaturesDir).resolve(fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }

    public String saveRepairTicketDocument(MultipartFile file, String ticketNumber) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be null or empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = String.format("%s-repair-ticket-%s", ticketNumber, fileExtension);

        Path filePath = Paths.get(claimFormsDir).resolve(fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }
}