package com.servit.servit.controller;

import com.servit.servit.service.BackupService;
import com.servit.servit.service.RestoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/backup")
// @PreAuthorize("hasRole('ADMIN')") // Class-level security, can also be applied per method
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);

    private final BackupService backupService;
    private final RestoreService restoreService;

    @Autowired
    public BackupController(BackupService backupService, RestoreService restoreService) {
        this.backupService = backupService;
        this.restoreService = restoreService;
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> createBackup() {
        try {
            String result = backupService.createBackup();
            if (result.startsWith("Error:")) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Exception in createBackup endpoint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create backup: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> listBackups() {
        try {
            List<String> backups = backupService.getAvailableBackups();
            return ResponseEntity.ok(backups);
        } catch (IOException e) {
            logger.error("IOException in listBackups endpoint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null); // Or an error DTO
        } catch (Exception e) {
            logger.error("Exception in listBackups endpoint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/restore/{fileName:.+}") // :.+ to match filenames with dots
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> restoreBackup(@PathVariable String fileName) {
        try {
            // Basic validation for filename
            if (fileName == null || fileName.isEmpty() || fileName.contains("..")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid backup file name.");
            }
            String result = restoreService.restoreBackup(fileName);
            if (result.startsWith("Error:")) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Exception in restoreBackup endpoint for file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to restore backup: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileName:.+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadBackupFile(@PathVariable String fileName) {
        try {
            // Basic validation for filename
            if (fileName == null || fileName.isEmpty() || fileName.contains("..")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
            File backupFile = backupService.getBackupFile(fileName);
            if (backupFile == null || !backupFile.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            InputStreamResource resource = new InputStreamResource(new FileInputStream(backupFile));
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + backupFile.getName() + "\"");
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);
            headers.add(HttpHeaders.CONTENT_LENGTH, String.valueOf(backupFile.length()));

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(backupFile.length())
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);

        } catch (FileNotFoundException e) {
             logger.warn("Backup file not found for download: {}", fileName, e);
             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
        catch (Exception e) {
            logger.error("Exception in downloadBackupFile endpoint for file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
