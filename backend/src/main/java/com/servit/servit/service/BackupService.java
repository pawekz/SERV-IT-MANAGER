package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.time.ZoneId;
import java.nio.charset.StandardCharsets;

// AWS S3 imports
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.ListObjectsV2Request;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import org.springframework.beans.factory.annotation.Value;

// Custom Exceptions
class BackupException extends RuntimeException {
    public BackupException(String message) {
        super(message);
    }
    public BackupException(String message, Throwable cause) {
        super(message, cause);
    }
}

class BackupNotFoundException extends BackupException {
    public BackupNotFoundException(String message) {
        super(message);
    }
}

class BackupOperationFailedException extends BackupException {
    public BackupOperationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
     public BackupOperationFailedException(String message) {
        super(message);
    }
}


@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    // DATE_FORMATTER for "yyyyMMdd"
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd"); 

    private static final Pattern BACKUP_DIR_PATTERN = Pattern.compile("^backup-(\\d{8})$");
    private static final Pattern BACKUP_FILENAME_PATTERN = Pattern.compile("^SERVIT-(\\d{8})(?:-(\\d{6}))?\\.sql$");

    private final Environment environment;
    private final ConfigurationService configurationService;
    private final DataSource dataSource;
    private final AmazonS3 s3Client;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Autowired
    public BackupService(Environment environment, ConfigurationService configurationService, DataSource dataSource, AmazonS3 s3Client) { // Updated constructor
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
        Path backupFilePath = backupDir.resolve(backupFileName); // Declare here for wider scope
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
                "user", "part", "system_configuration", "repair_ticket", "warranty",
                "repair_status_history", "repair_photo", "warranty_photo", "digital_signature",
                "part_number_stock_tracking", "inventory_transaction", "feedback"
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
        return backupFilePath.toString(); // Now accessible here
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
                    if (i > 1) {
                        insertSql.append(", ");
                    }
                    Object value = resultSet.getObject(i);

                    if (value == null) {
                        insertSql.append("NULL");
                    } else if (value instanceof String) {
                        String safe = ((String) value).replace("\\", "\\\\").replace("'", "\\'");
                        insertSql.append('\'').append(safe).append('\'');
                    } else if (value instanceof java.sql.Timestamp) {
                        String formatted = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(value);
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof java.sql.Date) {
                        String formatted = new java.text.SimpleDateFormat("yyyy-MM-dd").format(value);
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof java.sql.Time) {
                        String formatted = new java.text.SimpleDateFormat("HH:mm:ss").format(value);
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof java.time.LocalDateTime) {
                        String formatted = ((java.time.LocalDateTime) value).format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                        insertSql.append('\'').append(formatted).append('\'');
                    } else if (value instanceof Number || value instanceof Boolean) {
                        insertSql.append(value.toString());
                    } else {
                        String strVal = value.toString();
                        if (strVal.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?")) {
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
            throw new BackupNotFoundException("Backup file not found: " + backupFilePath.toString());
        }
        clearAllTables();
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("SET FOREIGN_KEY_CHECKS=0");
            String sql = new String(Files.readAllBytes(backupFilePath), StandardCharsets.UTF_8);
            for (String statement : sql.split(";\\s*\\n")) {
                String trimmed = statement.trim();
                if (trimmed.startsWith("INSERT INTO") && trimmed.contains("`user`") && trimmed.matches("INSERT INTO `[^`]+`\\.user` VALUES \\(1,.*")) {
                    logger.info("[RESTORE] Skipping ADMIN user insert: {}", trimmed);
                    continue;
                }
                if (!trimmed.isEmpty()) {
                    logger.info("[RESTORE] Executing: {}", trimmed);
                    stmt.execute(trimmed);
                }
            }
            stmt.execute("SET FOREIGN_KEY_CHECKS=1");
            logger.info("Restore completed successfully from: {}", backupIdentifier);
            return "Restore completed successfully from: " + backupIdentifier;
        } catch (Exception e) {
            logger.error("Restore process failed for backup: {}", backupIdentifier, e);
            throw new BackupOperationFailedException("Restore process failed for " + backupIdentifier + ": " + e.getMessage(), e);
        }
    }

    public void uploadBackupToS3(String localFilePath, String s3Key) {
        PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, "backup/" + s3Key, new java.io.File(localFilePath));
        s3Client.putObject(putObjectRequest);
    }


    public List<Map<String, Object>> listS3BackupsWithPresignedUrls() {
        ListObjectsV2Request req = new ListObjectsV2Request()
            .withBucketName(bucketName)
            .withPrefix("backup/");
        ListObjectsV2Result result = s3Client.listObjectsV2(req);
        List<Map<String, Object>> backups = result.getObjectSummaries().stream()
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
        return backups;
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
}
