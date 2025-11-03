package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

// AWS S3 imports
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ListObjectsV2Request;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;

// Package-private exceptions used by services in this package
class BackupException extends RuntimeException {
    public BackupException(String message) { super(message); }
    public BackupException(String message, Throwable cause) { super(message, cause); }
}

class BackupNotFoundException extends BackupException {
    public BackupNotFoundException(String message) { super(message); }
}

class BackupOperationFailedException extends BackupException {
    public BackupOperationFailedException(String message, Throwable cause) { super(message, cause); }
    public BackupOperationFailedException(String message) { super(message); }
}

@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final Environment environment;
    private final ConfigurationService configurationService;
    private final DataSource dataSource;
    private final AmazonS3 s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Autowired
    public BackupService(Environment environment, ConfigurationService configurationService, DataSource dataSource, AmazonS3 s3Client) {
        this.environment = environment;
        this.configurationService = configurationService;
        this.dataSource = dataSource;
        this.s3Client = s3Client;
    }

    private String getDbUsername() {
        return environment.getProperty("spring.datasource.username", "root");
    }

    private String getDbPassword() {
        return environment.getProperty("spring.datasource.password", "root");
    }

    private ParsedDbUrl parseDbUrl() {
        String jdbcUrl = environment.getProperty("spring.datasource.url");
        if (jdbcUrl == null) {
            throw new BackupOperationFailedException("spring.datasource.url is not configured.");
        }
        Pattern pattern = Pattern.compile("jdbc:mysql://([^:]+):(\\d+)/(\\w+)");
        Matcher matcher = pattern.matcher(jdbcUrl);
        if (matcher.find()) {
            return new ParsedDbUrl(matcher.group(1), matcher.group(2), matcher.group(3));
        } else {
            throw new BackupOperationFailedException("Could not parse spring.datasource.url: " + jdbcUrl + ". Expected format: jdbc:mysql://<host>:<port>/<databaseName>");
        }
    }

    private static class ParsedDbUrl {
        final String host;
        final String port;
        final String databaseName;
        ParsedDbUrl(String host, String port, String databaseName) {
            this.host = host;
            this.port = port;
            this.databaseName = databaseName;
        }
    }

    // ===================== BACKUP (CREATE + UPLOAD) =====================

    public String initiateManualBackup() {
        ParsedDbUrl dbUrl = parseDbUrl();
        String username = getDbUsername();
        String password = getDbPassword();

        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        String currentDate = now.format(DATE_FORMATTER);
        String currentTime = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        String backupFileName = "SERVIT-" + currentDate + "-" + currentTime + ".sql";
        String basePath = configurationService.getBackupPath();
        Path backupDir = Paths.get(basePath);
        Path backupFilePath = backupDir.resolve(backupFileName);
        try {
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
            }
        } catch (IOException e) {
            logger.error("Failed to create backup directory: {}", backupDir, e);
            throw new BackupOperationFailedException("Failed to create backup directory: " + backupDir, e);
        }

        try (Connection connection = DriverManager.getConnection(
                "jdbc:mysql://" + dbUrl.host + ":" + dbUrl.port + "/" + dbUrl.databaseName,
                username, password);
             FileWriter fileWriter = new FileWriter(backupFilePath.toFile());
             PrintWriter printWriter = new PrintWriter(fileWriter)) {

            printWriter.println("SET FOREIGN_KEY_CHECKS=0;");
            List<String> orderedTables = Arrays.asList(
                    // Base tables (no Foreign Key dependencies)
                    "user",                        // 1. Base table
                    "system_configuration",        // 2. Base table
                    "warranty",                    // 3. Base table (part references it)

                    // Part related (depends on warranty)
                    "part",                        // 4. References warranty

                    // Repair ticket (depends on user)
                    "repair_ticket",               // 5. References user

                    // Repair ticket children (depend on repair_ticket)
                    "repair_status_history",       // 6. References repair_ticket
                    "repair_photo",                // 7. References repair_ticket
                    "after_repair_photo",          // 8. References repair_ticket

                    // Warranty children (depend on warranty)
                    "warranty_photo",              // 9. References warranty

                    // Quotation (depends on repair_ticket)
                    "quotation",                   // 10. References repair_ticket
                    "quotation_part_ids",          // 11. Join table for quotation @ElementCollection

                    // Notifications (depends on repair_ticket)
                    "notification",                // 12. References repair_ticket

                    // Part tracking (depends on part)
                    "part_number_stock_tracking",  // 13. References part

                    // Inventory (depends on part)
                    "inventory_transaction",       // 14. References part

                    // Feedback (depends on repair_ticket)
                    "feedback"                     // 15. References repair_ticket
            );
            Set<String> dbTables = new HashSet<>();
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet tables = metaData.getTables(dbUrl.databaseName, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    dbTables.add(tableName);
                }
            }
            for (String tableName : orderedTables) {
                if (dbTables.contains(tableName)) {
                    backupTableDataOnly(connection, tableName, printWriter);
                }
            }
            printWriter.println("SET FOREIGN_KEY_CHECKS=1;");
        } catch (IOException | SQLException e) {
            logger.error("Backup process failed.", e);
            throw new BackupOperationFailedException("Backup process failed.", e);
        }
        return backupFilePath.toString();
    }

    private void backupTableDataOnly(Connection connection, String tableName, PrintWriter printWriter) throws SQLException {
        String dbName = connection.getCatalog();
        printWriter.println("-- Data for table " + tableName);
        String query = "SELECT * FROM `" + tableName + "`";
        if ("user".equalsIgnoreCase(tableName)) {
            query += " WHERE user_id <> 1 AND LOWER(role) NOT LIKE '%admin%'";
        }
        try (Statement stmt = connection.createStatement();
             ResultSet resultSet = stmt.executeQuery(query)) {
            ResultSetMetaData metaData = resultSet.getMetaData();
            int columnCount = metaData.getColumnCount();
            while (resultSet.next()) {
                StringBuilder insertSql = new StringBuilder("INSERT INTO `").append(dbName).append("`.`").append(tableName).append("` VALUES (");
                for (int i = 1; i <= columnCount; i++) {
                    if (i > 1) insertSql.append(", ");
                    Object value = resultSet.getObject(i);
                    if (value == null) {
                        insertSql.append("NULL");
                    } else if (value instanceof String) {
                        String safe = ((String) value).replace("\\", "\\\\").replace("'", "\\'");
                        insertSql.append('\'').append(safe).append('\'');
                    } else if (value instanceof java.sql.Timestamp) {
                        String formatted = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(value);
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof java.sql.Date) {
                        String formatted = new SimpleDateFormat("yyyy-MM-dd").format(value);
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof java.sql.Time) {
                        String formatted = new SimpleDateFormat("HH:mm:ss").format(value);
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof java.time.LocalDateTime) {
                        String formatted = ((java.time.LocalDateTime) value).format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof Number || value instanceof Boolean) {
                        insertSql.append(value.toString());
                    } else {
                        String strVal = value.toString();
                        if (strVal.matches("\\\\d{4}-\\\\d{2}-\\\\d{2}T\\\\d{2}:\\\\d{2}:\\\\d{2}(\\\\.\\\\d+)?")) {
                            strVal = strVal.replace('T', ' ');
                        }
                        String safe = strVal.replace("\\", "\\\\").replace("'", "\\'");
                        insertSql.append('\'').append(safe).append('\'');
                    }
                }
                insertSql.append(");");
                printWriter.println(insertSql.toString());
            }
        }
        printWriter.println();
    }

    public void uploadBackupToS3(String localFilePath, String backupFileName) {
        PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, "backup/" + backupFileName, new java.io.File(localFilePath));
        s3Client.putObject(putObjectRequest);
    }

    public List<Map<String, Object>> listS3BackupsWithPresignedUrls() {
        ListObjectsV2Request req = new ListObjectsV2Request()
            .withBucketName(bucketName)
            .withPrefix("backup/");
        ListObjectsV2Result result = s3Client.listObjectsV2(req);
        return result.getObjectSummaries().stream()
            .filter(obj -> obj.getKey().endsWith(".sql"))
            .map(obj -> {
                Map<String, Object> info = new HashMap<>();
                info.put("fileName", obj.getKey().substring("backup/".length()));
                info.put("s3Key", obj.getKey());
                Date expiration = new Date(System.currentTimeMillis() + 3600 * 1000);
                GeneratePresignedUrlRequest presignedReq = new GeneratePresignedUrlRequest(bucketName, obj.getKey())
                    .withMethod(com.amazonaws.HttpMethod.GET)
                    .withExpiration(expiration);
                String presignedUrl = s3Client.generatePresignedUrl(presignedReq).toString();
                info.put("url", presignedUrl);
                info.put("lastModified", obj.getLastModified());
                info.put("size", obj.getSize());
                return info;
            })
            .collect(Collectors.toList());
    }

    public void deleteS3Backup(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            throw new BackupOperationFailedException("s3Key is required for S3 deletion.");
        }
        try {
            s3Client.deleteObject(bucketName, s3Key);
        } catch (Exception e) {
            throw new BackupOperationFailedException("Failed to delete backup: " + s3Key, e);
        }
    }

    // ===================== RESTORE (LOCAL OR S3) =====================

    public void clearAllTables() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
            ResultSet rs = stmt.executeQuery("SHOW TABLES");
            List<String> tables = new ArrayList<>();
            while (rs.next()) {
                tables.add(rs.getString(1));
            }
            ResultSet adminRs = stmt.executeQuery("SELECT user_id FROM `user` WHERE role = 'ADMIN' ORDER BY user_id ASC LIMIT 1");
            int adminId = 1;
            if (adminRs.next()) {
                adminId = adminRs.getInt(1);
            }
            for (String table : tables) {
                if ("user".equalsIgnoreCase(table)) {
                    stmt.execute("DELETE FROM `user` WHERE user_id <> " + adminId);
                } else {
                    stmt.execute("TRUNCATE TABLE `" + table + "`");
                }
            }
            stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
        } catch (Exception e) {
            logger.error("Failed to clear tables before restore", e);
            throw new BackupOperationFailedException("Failed to clear tables before restore: " + e.getMessage(), e);
        }
    }

    public String restoreBackup(String backupIdentifier) {
        if (backupIdentifier == null || backupIdentifier.isEmpty() || backupIdentifier.contains("..") || !backupIdentifier.contains("/")) {
            throw new BackupNotFoundException("Invalid backup identifier provided. Expected format: backup-<date>/SERVIT-<date>.sql");
        }
        String basePath = configurationService.getBackupPath();
        Path backupFilePath = Paths.get(basePath, backupIdentifier);
        if (!Files.exists(backupFilePath) || !Files.isRegularFile(backupFilePath)) {
            logger.error("Backup file not found: {} (Base path: {})", backupFilePath, basePath);
            throw new BackupNotFoundException("Backup file not found: " + backupFilePath);
        }
        try {
            clearAllTables();
            String sql = Files.readString(backupFilePath, StandardCharsets.UTF_8);
            executeSqlDump(sql);
            logger.info("Restore completed successfully from: {}", backupIdentifier);
            return "Restore completed successfully from: " + backupIdentifier;
        } catch (Exception e) {
            logger.error("Restore process failed for backup: {}", backupIdentifier, e);
            throw new BackupOperationFailedException("Restore process failed for " + backupIdentifier + ": " + e.getMessage(), e);
        }
    }

    public String restoreFromS3(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) {
            throw new BackupNotFoundException("s3Key is required");
        }
        if (s3Key.contains("..")) {
            throw new BackupOperationFailedException("Invalid s3Key");
        }
        if (!s3Key.endsWith(".sql")) {
            throw new BackupOperationFailedException("Unsupported file type for restore: " + s3Key);
        }
        if (!s3Key.startsWith("backup/")) {
            logger.warn("s3Key does not start with expected prefix 'backup/': {}", s3Key);
        }
        try {
            logger.info("Downloading backup from S3: bucket={}, key={}", bucketName, s3Key);
            S3Object object = s3Client.getObject(new GetObjectRequest(bucketName, s3Key));
            try (InputStream in = new BufferedInputStream(object.getObjectContent());
                 InputStreamReader isr = new InputStreamReader(in, StandardCharsets.UTF_8);
                 BufferedReader br = new BufferedReader(isr)) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append('\n');
                }
                clearAllTables();
                executeSqlDump(sb.toString());
            }
            logger.info("Restore completed successfully from S3: {}", s3Key);
            return "Restore completed successfully from: " + s3Key;
        } catch (Exception e) {
            logger.error("Restore from S3 failed for key: {}", s3Key, e);
            throw new BackupOperationFailedException("Restore from S3 failed for " + s3Key + ": " + e.getMessage(), e);
        }
    }

    private void executeSqlDump(String sql) throws SQLException, IOException {
        // Normalize statements: remove USE, strip schema qualifiers to target current DB
        String normalized = sql
            .replaceAll("(?i)\\bUSE\\s+`?[a-zA-Z0-9_]+`?;", "")
            .replaceAll("(?i)INSERT\\s+INTO\\s+`[^`]+`\\.", "INSERT INTO ")
            .replaceAll("(?i)CREATE\\s+TABLE\\s+`[^`]+`\\.", "CREATE TABLE ")
            .replaceAll("(?i)ALTER\\s+TABLE\\s+`[^`]+`\\.", "ALTER TABLE ")
            .replaceAll("(?i)REPLACE\\s+INTO\\s+`[^`]+`\\.", "REPLACE INTO ");

        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            // Session setup for safer cross-environment imports
            stmt.execute("SET FOREIGN_KEY_CHECKS=0");
            safeExecute(stmt, "SET sql_mode=''");
            safeExecute(stmt, "SET time_zone = '+00:00'");
            safeExecute(stmt, "SET NAMES utf8mb4");
            // If needed: safeExecute(stmt, "SET lc_time_names='en_US'");

            // Split and execute by ';' (simple but effective for our generated dumps)
            String[] parts = normalized.split(";");
            for (String raw : parts) {
                String trimmed = raw == null ? "" : raw.trim();
                if (trimmed.isEmpty()) continue;

                // Skip inserting built-in admin user (id=1)
                if (trimmed.matches("(?is)INSERT\\s+INTO\\s+`?(?:[a-zA-Z0-9_]+`?\\.)?`?user`?\\s+VALUES\\s*\\(1,.*")) {
                    logger.info("[RESTORE] Skipping ADMIN user insert");
                    continue;
                }

                logger.info("[RESTORE] Executing: {}", truncateForLog(trimmed));
                stmt.execute(trimmed);
            }

            stmt.execute("SET FOREIGN_KEY_CHECKS=1");
        }
    }

    private void safeExecute(Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (Exception e) {
            logger.warn("[RESTORE] Non-fatal session statement failed: {} -> {}", sql, e.getMessage());
        }
    }

    private String truncateForLog(String s) {
        if (s == null) return "";
        final int max = 400;
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
