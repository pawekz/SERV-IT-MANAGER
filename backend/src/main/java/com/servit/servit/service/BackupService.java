package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    // Will be configured via application.properties, e.g., backup.directory=./backups
    @Value("${backup.directory:./backups}")
    private String backupDirectoryPath;

    private String getDbName() {
        // Extracts database name from jdbc:mysql://localhost:3306/db_servit
        try {
            return dbUrl.substring(dbUrl.lastIndexOf("/") + 1).split("\?")[0];
        } catch (Exception e) {
            logger.error("Failed to parse database name from URL: {}", dbUrl, e);
            return null; // Or throw an exception
        }
    }

    private String getDbHost() {
        try {
            // jdbc:mysql://localhost:3306/db_servit
            String temp = dbUrl.substring(dbUrl.indexOf("://") + 3); // localhost:3306/db_servit
            return temp.substring(0, temp.indexOf(":"));
        } catch (Exception e) {
            logger.error("Failed to parse database host from URL: {}", dbUrl, e);
            return "localhost"; // Default or throw
        }
    }

    private String getDbPort() {
        try {
            // jdbc:mysql://localhost:3306/db_servit
            String temp = dbUrl.substring(dbUrl.indexOf("://") + 3); // localhost:3306/db_servit
            temp = temp.substring(temp.indexOf(":") + 1); // 3306/db_servit
            return temp.substring(0, temp.indexOf("/"));
        } catch (Exception e) {
            logger.error("Failed to parse database port from URL: {}", dbUrl, e);
            return "3306"; // Default or throw
        }
    }


    public String createBackup() {
        String dbName = getDbName();
        if (dbName == null) {
            return "Error: Database name could not be determined.";
        }

        File backupDir = new File(backupDirectoryPath);
        if (!backupDir.exists()) {
            if (!backupDir.mkdirs()) {
                logger.error("Failed to create backup directory: {}", backupDirectoryPath);
                return "Error: Could not create backup directory.";
            }
        }

        String timestamp = new SimpleDateFormat("yyyyMMdd-HHmmss").format(new Date());
        String fileName = "backup-" + dbName + "-" + timestamp + ".sql";
        String filePath = Paths.get(backupDirectoryPath, fileName).toString();

        // Ensure password is provided if it exists.
        // Handle cases where password might be empty or null if necessary,
        // though for mysqldump it's better to have it.
        String passwordOption = (dbPassword != null && !dbPassword.isEmpty()) ? "--password=" + dbPassword : "";

        // Construct mysqldump command
        // Using --column-statistics=0 for MySQL 8+ to avoid warnings if user lacks certain privileges
        String command = String.format("mysqldump --host=%s --port=%s --user=%s %s --no-create-info --skip-triggers --column-statistics=0 %s > %s",
                getDbHost(), getDbPort(), dbUsername, passwordOption, dbName, filePath);

        logger.info("Executing backup command: mysqldump --host={} --port={} --user={} --password=**** --no-create-info --skip-triggers --column-statistics=0 {} > {}",
            getDbHost(), getDbPort(), dbUsername, dbName, filePath);


        try {
            ProcessBuilder processBuilder = new ProcessBuilder();
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                processBuilder.command("cmd.exe", "/c", command);
            } else {
                processBuilder.command("sh", "-c", command);
            }

            Process process = processBuilder.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                logger.info("Database backup created successfully: {}", fileName);
                return "Backup created successfully: " + fileName;
            } else {
                // Read error stream for more details
                String errors = new String(process.getErrorStream().readAllBytes());
                logger.error("Backup failed with exit code {}. Errors: {}", exitCode, errors);
                // It's good practice to delete the (likely empty or corrupt) backup file on failure
                new File(filePath).delete();
                return "Backup failed. Exit code: " + exitCode + ". Errors: " + errors;
            }
        } catch (IOException | InterruptedException e) {
            logger.error("Error during backup process", e);
            // Also delete partial file on exception
            new File(filePath).delete();
            Thread.currentThread().interrupt(); // Restore interrupted status
            return "Error during backup: " + e.getMessage();
        }
    }

    public List<String> getAvailableBackups() throws IOException {
        File backupDir = new File(backupDirectoryPath);
        if (!backupDir.exists() || !backupDir.isDirectory()) {
            logger.warn("Backup directory does not exist or is not a directory: {}", backupDirectoryPath);
            return List.of(); // Return empty list
        }

        try (Stream<Path> paths = Files.walk(Paths.get(backupDirectoryPath))) {
            return paths
                    .filter(Files::isRegularFile)
                    .map(path -> path.getFileName().toString())
                    .filter(fileName -> fileName.endsWith(".sql"))
                    .sorted((s1, s2) -> s2.compareTo(s1)) // Sort descending, newest first
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("Error listing available backups from directory: {}", backupDirectoryPath, e);
            throw e;
        }
    }

    public File getBackupFile(String fileName) {
        File backupFile = Paths.get(backupDirectoryPath, fileName).toFile();
        if (backupFile.exists() && backupFile.isFile()) {
            return backupFile;
        }
        logger.warn("Backup file not found: {}", fileName);
        return null;
    }
}
