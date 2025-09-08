package com.servit.servit.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Date;
import java.util.UUID;

@Service
public class S3Service {

    private static final Logger logger = LoggerFactory.getLogger(S3Service.class);
    private final AmazonS3 amazonS3;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    public S3Service(AmazonS3 amazonS3) {
        this.amazonS3 = amazonS3;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        File tempFile = null;
        try {
            tempFile = convertMultiPartToFile(file);
            amazonS3.putObject(new PutObjectRequest(bucketName, fileName, tempFile));
            logger.info("File uploaded to S3: {}", fileName);
            return amazonS3.getUrl(bucketName, fileName).toString();
        } catch (IOException e) {
            logger.error("Error converting multipart file to file", e);
            throw e;
        } catch (Exception e) {
            logger.error("Error uploading file to S3", e);
            throw new IOException("Error uploading file to S3", e);
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    public String uploadFile(MultipartFile file, String key) throws IOException {
        File tempFile = null;
        try {
            tempFile = convertMultiPartToFile(file);
            amazonS3.putObject(new PutObjectRequest(bucketName, key, tempFile));
            logger.info("File uploaded to S3 with key: {}", key);
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

    public S3Object downloadFile(String fileName) {
        try {
            S3Object s3Object = amazonS3.getObject(bucketName, fileName);
            logger.info("File downloaded from S3: {}", fileName);
            return s3Object;
        } catch (Exception e) {
            logger.error("Error downloading file from S3: {}", fileName, e);
            return null;
        }
    }

    public void deleteFile(String fileName) {
        try {
            amazonS3.deleteObject(bucketName, fileName);
            logger.info("File deleted from S3: {}", fileName);
        } catch (Exception e) {
            logger.error("Error deleting file from S3: {}", fileName, e);
            throw new RuntimeException("Error deleting file from S3", e);
        }
    }

    public String generatePresignedUrl(String key, int expirationMinutes) {
        try {
            Date expiration = new Date(System.currentTimeMillis() + expirationMinutes * 60 * 1000);
            GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(bucketName, key)
                    .withMethod(HttpMethod.GET)
                    .withExpiration(expiration);
            return amazonS3.generatePresignedUrl(generatePresignedUrlRequest).toString();
        } catch (Exception e) {
            logger.error("Error generating presigned URL for S3 key: {}", key, e);
            throw new RuntimeException("Error generating presigned URL", e);
        }
    }

    private File convertMultiPartToFile(MultipartFile file) throws IOException {
        File convFile = Files.createTempFile("s3upload", null).toFile();
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        return convFile;
    }
}
