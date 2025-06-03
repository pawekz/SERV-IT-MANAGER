package com.servit.servit.controller;

import com.servit.servit.service.BackupService;
import com.servit.servit.service.ConfigurationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.SimpleDateFormat;
import java.sql.Timestamp;
import java.sql.Time;
import java.sql.Date;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);

    private final BackupService backupService;
    private final ConfigurationService configurationService;

    @Autowired
    public BackupController(BackupService backupService, ConfigurationService configurationService) {
        this.backupService = backupService;
        this.configurationService = configurationService;
    }

    @PostMapping("/now")
    public ResponseEntity<?> initiateManualBackup() {
        try {
            logger.info("POST /api/backup/now received - initiating manual backup");
            String backupPath = backupService.initiateManualBackup();
            return ResponseEntity.ok("Backup successful: " + backupPath);
        } catch (Exception e) {
            logger.error("Backup failed", e);
            return ResponseEntity.status(500).body("Backup failed: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<Map<String, Object>>> listBackups() {
        logger.info("GET /api/backup/list received - listing backups");
        List<Map<String, Object>> backups = backupService.listAvailableBackups();
        return ResponseEntity.ok(backups);
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

    // Delete a specific backup file
    @PostMapping("/delete")
    public ResponseEntity<?> deleteBackup(@RequestBody Map<String, String> payload) {
        String backupIdentifier = payload.get("backupId");
        if (backupIdentifier == null || backupIdentifier.isBlank()) {
            return ResponseEntity.badRequest().body("backupId is required");
        }
        try {
            backupService.deleteBackup(backupIdentifier);
            return ResponseEntity.ok("Backup deleted: " + backupIdentifier);
        } catch (Exception e) {
            logger.error("Failed to delete backup {}", backupIdentifier, e);
            return ResponseEntity.status(500).body("Failed to delete backup: " + e.getMessage());
        }
    }
}
