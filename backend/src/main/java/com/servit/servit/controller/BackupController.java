package com.servit.servit.controller;

import com.servit.servit.service.BackupService;
import com.servit.servit.service.ConfigurationService;
import com.servit.servit.service.ScheduledBackupService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);

    private final BackupService backupService;
    private final ConfigurationService configurationService;
    private final ScheduledBackupService scheduledBackupService;

    @Autowired
    public BackupController(BackupService backupService, ConfigurationService configurationService, ScheduledBackupService scheduledBackupService) {
        this.backupService = backupService;
        this.configurationService = configurationService;
        this.scheduledBackupService = scheduledBackupService;
    }

    @PostMapping("/now")
    public ResponseEntity<?> initiateManualBackup() {
        try {
            logger.info("POST /api/backup/now received - initiating manual backup");
            String localBackupPath = backupService.initiateManualBackup();
            String backupFileName = java.nio.file.Paths.get(localBackupPath).getFileName().toString();
            String s3Key = configurationService.getS3BackupKey(backupFileName);
            backupService.uploadBackupToS3(localBackupPath, backupFileName); // Upload to S3 under backup/
            // Optionally delete local file after upload
            try { java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(localBackupPath)); } catch (Exception ex) { logger.warn("Could not delete local backup file: {}", localBackupPath); }
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Backup successfully created");
            result.put("s3Key", s3Key);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Backup failed", e);
            return ResponseEntity.status(500).body("Backup failed: " + e.getMessage());
        }
    }

    @PostMapping("/restore")
    public ResponseEntity<Map<String, Object>> restoreBackup(@RequestBody Map<String, String> payload) {
        String backupIdentifier = payload.getOrDefault("backupId", "N/A");
        logger.info("POST /api/backup/restore received - initiating restore for backup ID: {}", backupIdentifier);
        try {
            String result = backupService.restoreBackup(backupIdentifier);
            Map<String, Object> response = new HashMap<>();
            response.put("message", result);
            response.put("requireSignout", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Restore failed for backup ID: {}", backupIdentifier, e);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Restore failed: " + e.getMessage());
            response.put("requireSignout", true);
            return ResponseEntity.status(500).body(response);
        }
    }

    // Get current backup directory
    @GetMapping("/directory")
    public ResponseEntity<Map<String, String>> getBackupDirectory() {
        String path = configurationService.getBackupPath();
        return ResponseEntity.ok(Map.of("path", path));
    }

    // Set new backup directory
    @PostMapping("/directory")
    public ResponseEntity<?> setBackupDirectory(@RequestBody Map<String, String> payload) {
        String newPath = payload.get("path");
        if (newPath == null || newPath.isBlank()) {
            return ResponseEntity.badRequest().body("Path is required");
        }
        configurationService.setBackupPath(newPath);
        return ResponseEntity.ok(Map.of("path", newPath));
    }

    // Get current backup schedule
    @GetMapping("/schedule")
    public ResponseEntity<Map<String, Object>> getBackupSchedule() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("cronExpression", configurationService.getBackupScheduleCron());
            response.put("enabled", configurationService.isBackupScheduleEnabled());
            response.put("isScheduled", scheduledBackupService.isScheduled());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get backup schedule", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get backup schedule: " + e.getMessage()));
        }
    }

    // Set backup schedule
    @PostMapping("/schedule")
    public ResponseEntity<?> setBackupSchedule(@RequestBody Map<String, String> payload) {
        String cronExpression = payload.get("cronExpression");
        if (cronExpression == null) {
            return ResponseEntity.badRequest().body("cronExpression is required");
        }
        
        try {
            configurationService.setBackupScheduleCron(cronExpression);
            scheduledBackupService.updateSchedule();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", cronExpression.equals("DISABLED") ? "Backup schedule disabled" : "Backup schedule updated");
            response.put("cronExpression", cronExpression);
            response.put("enabled", configurationService.isBackupScheduleEnabled());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to set backup schedule: {}", cronExpression, e);
            return ResponseEntity.status(400).body("Failed to set backup schedule: " + e.getMessage());
        }
    }

    // Disable backup schedule
    @PostMapping("/schedule/disable")
    public ResponseEntity<?> disableBackupSchedule() {
        try {
            configurationService.setBackupScheduleCron("DISABLED");
            scheduledBackupService.updateSchedule();
            return ResponseEntity.ok(Map.of("message", "Backup schedule disabled"));
        } catch (Exception e) {
            logger.error("Failed to disable backup schedule", e);
            return ResponseEntity.status(500).body("Failed to disable backup schedule: " + e.getMessage());
        }
    }

    @GetMapping("/s3-list")
    public ResponseEntity<List<Map<String, Object>>> listS3Backups() {
        logger.info("GET /api/backup/s3-list received - listing S3 backups");
        List<Map<String, Object>> backups = backupService.listS3BackupsWithPresignedUrls();
        return ResponseEntity.ok(backups);
    }

    @PostMapping("/s3-delete")
    public ResponseEntity<?> deleteS3Backup(@RequestBody Map<String, String> payload) {
        String s3Key = payload.get("s3Key");
        if (s3Key == null || s3Key.isBlank()) {
            return ResponseEntity.badRequest().body("s3Key is required");
        }
        try {
            backupService.deleteS3Backup(s3Key);
            return ResponseEntity.ok("Backup successfully deleted: " + s3Key);
        } catch (Exception e) {
            logger.error("Failed to delete S3 backup {}", s3Key, e);
            return ResponseEntity.status(500).body("Failed to delete S3 backup: " + e.getMessage());
        }
    }
}
