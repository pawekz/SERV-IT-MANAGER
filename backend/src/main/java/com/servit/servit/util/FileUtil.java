package com.servit.servit.util;

import com.servit.servit.service.S3Service;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.CopyObjectRequest;
import com.amazonaws.services.s3.model.PutObjectResult;
import com.amazonaws.services.s3.model.S3Object;
import com.servit.servit.service.PartS3Service;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class FileUtil {

    private final S3Service s3Service;
    private final PartS3Service partS3Service;
    private final AmazonS3 amazonS3;
    @Value("${aws.s3.bucket}")
    private String bucketName;
    private static final Logger logger = LoggerFactory.getLogger(FileUtil.class);

    @Autowired
    public FileUtil(S3Service s3Service, PartS3Service partS3Service, AmazonS3 amazonS3) {
        this.s3Service = s3Service;
        this.partS3Service = partS3Service;
        this.amazonS3 = amazonS3;
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
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }
        return originalFilename.substring(originalFilename.lastIndexOf("."));
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

    public String savePartPicture(MultipartFile file, String modelName, String type) throws IOException {
        validatePhoto(file);
        MultipartFile compressedFile = compressImage(file);
        String fileExtension = getFileExtension(compressedFile);

        String sanitizedModel = sanitizeForFilename(modelName);
        String sanitizedType = sanitizeForFilename(type);
        String fileName = String.format("part-%s-%s-%s%s", sanitizedModel, sanitizedType, UUID.randomUUID(), fileExtension);

        String key = "images/part_photos/" + fileName;
        logger.info("FileUtil.savePartPicture: uploading file '{}' to S3 key '{}' (size={} bytes)", fileName, key, compressedFile.getSize());
        try {
            // Upload directly using embedded S3 logic
            return uploadFileToS3(compressedFile, key);
        } catch (Exception ex) {
            logger.error("FileUtil.savePartPicture: failed to upload to S3 key '{}': {}", key, ex.getMessage(), ex);
            throw ex;
        }
    }

    // Duplicate of S3Service.uploadFile(...) but scoped to part uploads inside FileUtil
    private String uploadFileToS3(MultipartFile file, String key) throws IOException {
        java.io.File tempFile = null;
        String fileExtension = getFileExtension(file).toLowerCase();
        boolean isImage = List.of(".png", ".jpg", ".jpeg").contains(fileExtension);
        try {
            tempFile = java.nio.file.Files.createTempFile("s3upload", null).toFile();
            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(tempFile)) {
                fos.write(file.getBytes());
            }

            if (isImage) {
                ObjectMetadata metadata = new ObjectMetadata();
                metadata.setCacheControl("public, max-age=31536000");
                metadata.setContentType(file.getContentType());
                metadata.setContentLength(tempFile.length());
                PutObjectRequest putRequest = new PutObjectRequest(bucketName, key, tempFile);
                putRequest.setMetadata(metadata);
                PutObjectResult result = amazonS3.putObject(putRequest);
                String eTag = result.getETag();

                ObjectMetadata existingMetadata = amazonS3.getObjectMetadata(bucketName, key);
                existingMetadata.addUserMetadata("ETag", eTag);
                CopyObjectRequest copyObjRequest = new CopyObjectRequest(bucketName, key, bucketName, key)
                        .withNewObjectMetadata(existingMetadata);
                amazonS3.copyObject(copyObjRequest);
                logger.info("Part upload to S3 with key: {} and ETag {}", key, eTag);
            } else {
                amazonS3.putObject(new PutObjectRequest(bucketName, key, tempFile));
                logger.info("Part non-image uploaded to S3 with key: {}", key);
            }
            return amazonS3.getUrl(bucketName, key).toString();
        } catch (IOException e) {
            logger.error("Error converting multipart file to file", e);
            throw e;
        } catch (Exception e) {
            logger.error("Error uploading file to S3 with key: {}", key, e);
            throw new IOException("Error uploading file to S3", e);
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    private String sanitizeForFilename(String input) {
        if (input == null) return "unknown";
        String trimmed = input.trim().toLowerCase(Locale.ROOT);
        // replace spaces and invalid chars with dash
        String sanitized = Pattern.compile("[^a-z0-9-]").matcher(trimmed.replaceAll("\\s+", "-")).replaceAll("-");
        // collapse multiple dashes
        sanitized = sanitized.replaceAll("-{2,}", "-");
        if (sanitized.startsWith("-")) sanitized = sanitized.substring(1);
        if (sanitized.endsWith("-")) sanitized = sanitized.substring(0, sanitized.length() - 1);
        return sanitized.isEmpty() ? "unknown" : sanitized;
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