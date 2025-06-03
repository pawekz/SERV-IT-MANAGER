package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import java.time.ZoneId;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;

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
    // Keep TIMESTAMP_FORMATTER if needed for other things, or remove if only DATE_FORMATTER is used for new scheme
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss"); 
    
    // New pattern for directory: backup-yyyyMMdd
    private static final Pattern BACKUP_DIR_PATTERN = Pattern.compile("^backup-(\\d{8})$");
    // New pattern for filename: SERVIT-yyyyMMdd.sql or SERVIT-yyyyMMdd-HHmmss.sql
    private static final Pattern BACKUP_FILENAME_PATTERN = Pattern.compile("^SERVIT-(\\d{8})(?:-(\\d{6}))?\\.sql$");

    // Removed BackupConfig injection
    private final Environment environment;
    private final ConfigurationService configurationService; // Added ConfigurationService
    private final DataSource dataSource;

    @Autowired
    public BackupService(Environment environment, ConfigurationService configurationService, DataSource dataSource) { // Updated constructor
        this.environment = environment;
        this.configurationService = configurationService;
        this.dataSource = dataSource;
    }

    private String getDbUsername() {
        return environment.getProperty("spring.datasource.username", "root");
    }

    private String getDbPassword() {
        // Note: pg_dump typically uses .pgpass or environment variables for passwords.
        // Directly passing password in command line can be a security risk.
        // This is a simplified approach.
        return environment.getProperty("spring.datasource.password", "root");
    }

    private ParsedDbUrl parseDbUrl() {
        String jdbcUrl = environment.getProperty("spring.datasource.url");
        if (jdbcUrl == null) {
            throw new BackupOperationFailedException("spring.datasource.url is not configured.");
        }
        // Expected format: jdbc:mysql://<host>:<port>/<databaseName>
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

    /**
     * Initiates a manual backup of all table data (no schema).
     * Only outputs INSERT statements for each row in each table.
     * @return Path to the backup file created
     */
    public String initiateManualBackup() {
        ParsedDbUrl dbUrl = parseDbUrl();
        String username = getDbUsername();
        String password = getDbPassword();

        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        String currentDate = now.format(DATE_FORMATTER);
        String currentTime = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        String backupDirName = "backup-" + currentDate;
        String backupFileName = "SERVIT-" + currentDate + "-" + currentTime + ".sql";

        String basePath = configurationService.getBackupPath();
        Path backupDirectoryPath = Paths.get(basePath, backupDirName);
        Path backupFilePath = backupDirectoryPath.resolve(backupFileName);

        try {
            Files.createDirectories(backupDirectoryPath);
        } catch (IOException e) {
            throw new BackupOperationFailedException("Failed to create backup directory: " + backupDirectoryPath, e);
        }

        try (Connection connection = DriverManager.getConnection(
                "jdbc:mysql://" + dbUrl.host + ":" + dbUrl.port + "/" + dbUrl.databaseName,
                username, password);
             FileWriter fileWriter = new FileWriter(backupFilePath.toFile());
             PrintWriter printWriter = new PrintWriter(fileWriter)) {

            // Disable FK checks at the start to disable restoration errors
            printWriter.println("SET FOREIGN_KEY_CHECKS=0;");

            // List of tables in dependency order, add additional tables
            List<String> orderedTables = Arrays.asList(
                "user",
                "part",
                "system_configuration",
                "repair_ticket",
                "warranty",
                "repair_status_history",
                "repair_photo",
                "warranty_photo",
                "digital_signature",
                "feedback"
            );

            // Get all tables in the database
            Set<String> dbTables = new HashSet<>();
            DatabaseMetaData metaData = connection.getMetaData();
            try (ResultSet tables = metaData.getTables(dbUrl.databaseName, null, "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    dbTables.add(tableName);
                }
            }

            // Output only tables that exist in the DB, in the correct order
            for (String tableName : orderedTables) {
                if (dbTables.contains(tableName)) {
                    backupTableDataOnly(connection, tableName, printWriter);
                }
            }

            // Enable FK checks at the end
            printWriter.println("SET FOREIGN_KEY_CHECKS=1;");
            return backupFilePath.toString();
        } catch (IOException | SQLException e) {
            throw new BackupOperationFailedException("Backup process failed.", e);
        }
    }

    /**
     * Writes only INSERT statements for all data in the given table, fully qualified with the database name.
     */
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
                        // This is the critical fallback for other object types (like what's causing the error).
                        // It formats the string representation and ensures it's quoted.
                        String strVal = value.toString();
                        // Replace the 'T' separator from ISO 8601 format for MySQL compatibility
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

    public List<Map<String, Object>> listAvailableBackups() {
        // Get base path from ConfigurationService, in short, this is where the user settings for the backup location are defined and stored.
        String basePath = configurationService.getBackupPath(); 
        Path baseBackupPath = Paths.get(basePath);
        List<Map<String, Object>> backups = new ArrayList<>();

        if (!Files.exists(baseBackupPath) || !Files.isDirectory(baseBackupPath)) {
            logger.warn("Base backup path {} (from ConfigurationService) does not exist or is not a directory.", baseBackupPath);
            return backups;
        }

        try (Stream<Path> dateDirs = Files.list(baseBackupPath)) {
            dateDirs
                .filter(Files::isDirectory)
                .filter(dir -> BACKUP_DIR_PATTERN.matcher(dir.getFileName().toString()).matches())
                .forEach(dateDir -> {
                    String dirName = dateDir.getFileName().toString();
                    Matcher dirMatcher = BACKUP_DIR_PATTERN.matcher(dirName);
                    if (!dirMatcher.matches()) return; // Should not happen due to filter
                    String dateFromDir = dirMatcher.group(1);

                    try (Stream<Path> backupFiles = Files.list(dateDir)) {
                        backupFiles
                            .filter(Files::isRegularFile)
                            .filter(file -> {
                                Matcher fileMatcher = BACKUP_FILENAME_PATTERN.matcher(file.getFileName().toString());
                                // Ensure date in filename matches date in directory
                                return fileMatcher.matches() && fileMatcher.group(1).equals(dateFromDir);
                            })
                            .map(filePath -> {
                                Map<String, Object> backupInfo = new HashMap<>();
                                String relativeDir = dateDir.getFileName().toString();
                                String fileNameOnly = filePath.getFileName().toString();
                                // ID is relative path from base backup path
                                backupInfo.put("id", Paths.get(relativeDir, fileNameOnly).toString().replace("\\", "/"));
                                backupInfo.put("fileName", fileNameOnly);
                                try {
                                    Matcher fileMatcher = BACKUP_FILENAME_PATTERN.matcher(fileNameOnly);
                                    if (fileMatcher.matches()) {
                                        String datePart = fileMatcher.group(1);
                                        String timePart = fileMatcher.group(2);
                                        LocalDateTime ldt;
                                        if (timePart != null) {
                                            ldt = LocalDateTime.parse(datePart + timePart, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                                        } else {
                                            // Parse as LocalDate, then atStartOfDay
                                            ldt = LocalDate.parse(datePart, DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
                                        }
                                        backupInfo.put("backupDate", ldt.atZone(ZoneId.systemDefault()).toInstant().toString());
                                    } else {
                                        // fallback to directory date
                                        LocalDateTime ldt = LocalDateTime.parse(dateFromDir, DATE_FORMATTER);
                                        backupInfo.put("backupDate", ldt.atZone(ZoneId.systemDefault()).toInstant().toString());
                                    }
                                } catch (Exception e) {
                                    logger.warn("Could not parse date from directory/filename {}: {}", Paths.get(relativeDir, fileNameOnly), e.getMessage());
                                    // Fallback to file's last modified time if parsing fails
                                    backupInfo.put("backupDate", getFileLastModifiedDate(filePath));
                                }
                                return backupInfo;
                            })
                            .forEach(backups::add);
                    } catch (IOException e) {
                        logger.error("Failed to list backup files in directory: {}", dateDir, e);
                        // Continue to next directory
                    }
                });
        } catch (IOException e) {
            logger.error("Failed to list backup date directories from base path: {}", baseBackupPath, e);
            throw new BackupOperationFailedException("Failed to list backup date directories.", e);
        }
        
        // Sort backups by date descending
        backups.sort(Comparator.comparing((Map<String, Object> m) -> (String) m.get("backupDate")).reversed());
        return backups;
    }
    
    private String getFileLastModifiedDate(Path path) {
        try {
            FileTime fileTime = Files.getLastModifiedTime(path);
            return fileTime.toInstant().toString();
        } catch (IOException e) {
            logger.warn("Could not get last modified date for {}: {}", path.getFileName(), e.getMessage());
            return "Unknown";
        }
    }

    private void clearAllTables() {
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
        // Clear all tables before restore
        clearAllTables();
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            // Disable FK checks
            stmt.execute("SET FOREIGN_KEY_CHECKS=0");
            // Read the SQL file
            String sql = new String(Files.readAllBytes(backupFilePath), StandardCharsets.UTF_8);
            // Split and execute each statement
            for (String statement : sql.split(";\\s*\\n")) {
                String trimmed = statement.trim();
                // Skip restoring ADMIN user (user_id = 1)
                if (trimmed.startsWith("INSERT INTO") && trimmed.contains("`user`") && trimmed.matches("INSERT INTO `[^`]+`\\.user` VALUES \\(1,.*")) {
                    logger.info("[RESTORE] Skipping ADMIN user insert: {}", trimmed);
                    continue;
                }
                if (!trimmed.isEmpty()) {
                    logger.info("[RESTORE] Executing: {}", trimmed);
                    stmt.execute(trimmed);
                }
            }
            // Enable FK checks
            stmt.execute("SET FOREIGN_KEY_CHECKS=1");
            logger.info("Restore completed successfully from: {}", backupIdentifier);
            return "Restore completed successfully from: " + backupIdentifier;
        } catch (Exception e) {
            logger.error("Restore process failed for backup: {}", backupIdentifier, e);
            throw new BackupOperationFailedException("Restore process failed for " + backupIdentifier + ": " + e.getMessage(), e);
        }
    }

    public void deleteBackup(String backupIdentifier) {
        if (backupIdentifier == null || backupIdentifier.isEmpty() || backupIdentifier.contains("..") || !backupIdentifier.contains("/")) {
            throw new BackupNotFoundException("Invalid backup identifier provided. Expected format: backup-<date>/SERVIT-<date>.sql");
        }
        String basePath = configurationService.getBackupPath();
        Path backupFilePath = Paths.get(basePath, backupIdentifier);
        if (!Files.exists(backupFilePath) || !Files.isRegularFile(backupFilePath)) {
            logger.error("Backup file not found: {} (Base path: {})", backupFilePath, basePath);
            throw new BackupNotFoundException("Backup file not found: " + backupFilePath.toString());
        }
        try {
            Files.delete(backupFilePath);
            logger.info("Backup deleted: {}", backupFilePath);
        } catch (IOException e) {
            logger.error("Failed to delete backup file: {}", backupFilePath, e);
            throw new BackupOperationFailedException("Failed to delete backup file: " + backupFilePath.toString(), e);
        }
    }
}
