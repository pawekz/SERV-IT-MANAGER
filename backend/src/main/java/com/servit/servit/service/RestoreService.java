package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.metamodel.EntityType;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Service
public class RestoreService {

    private static final Logger logger = LoggerFactory.getLogger(RestoreService.class);

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${backup.directory:./backups}")
    private String backupDirectoryPath;

    @PersistenceContext
    private EntityManager entityManager;

    private final JdbcTemplate jdbcTemplate;
    private final Environment environment;
    private final ConfigurationService configurationService;

    @Autowired
    public RestoreService(JdbcTemplate jdbcTemplate, Environment environment, ConfigurationService configurationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.environment = environment;
        this.configurationService = configurationService;
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

    private String getDbName() {
        try {
            int protocolEndIndex = dbUrl.indexOf("://");
            if (protocolEndIndex == -1) {
                throw new IllegalArgumentException("Invalid database URL format: missing protocol");
            }

            int lastSlashIndex = dbUrl.lastIndexOf("/");
            if (lastSlashIndex == -1 || lastSlashIndex <= protocolEndIndex) {
                throw new IllegalArgumentException("Invalid database URL format: missing database name");
            }

            String urlSuffix = dbUrl.substring(lastSlashIndex + 1);
            String[] urlParts = urlSuffix.split("\\?");
            String databaseName = urlParts[0];

            if (databaseName.isEmpty()) {
                throw new IllegalArgumentException("Database name is empty in URL");
            }

            return databaseName;
        } catch (Exception e) {
            logger.error("Failed to parse database name from URL: {}", dbUrl, e);
            return null;
        }
    }

    private String getDbHost() {
        try {
            String temp = dbUrl.substring(dbUrl.indexOf("://") + 3);
            return temp.substring(0, temp.indexOf(":"));
        } catch (Exception e) {
            logger.error("Failed to parse database host from URL: {}", dbUrl, e);
            return "localhost";
        }
    }

    private String getDbPort() {
        try {
            String temp = dbUrl.substring(dbUrl.indexOf("://") + 3);
            temp = temp.substring(temp.indexOf(":") + 1);
            return temp.substring(0, temp.indexOf("/"));
        } catch (Exception e) {
            logger.error("Failed to parse database port from URL: {}", dbUrl, e);
            return "3306";
        }
    }

    private ParsedDbUrl parseDbUrl() {
        return new ParsedDbUrl(getDbHost(), getDbPort(), getDbName());
    }

    private String getDbUsername() {
        return dbUsername;
    }

    private String getDbPassword() {
        return dbPassword;
    }

    private ProcessBuilder createProcessBuilder(List<String> command) {
        return new ProcessBuilder(command);
    }

    /**
     * Restores table data from a backup file (INSERT statements only).
     * Clears all managed tables before restore.
     * @param backupIdentifier Relative path to the backup file (e.g., backup-YYYYMMDD/SERVIT-YYYYMMDD.sql)
     * @return Status message
     */
    @Transactional
    public String restoreBackup(String backupIdentifier) {
        if (backupIdentifier == null || backupIdentifier.isEmpty() || backupIdentifier.contains("..") || !backupIdentifier.contains("/")) {
            throw new BackupNotFoundException("Invalid backup identifier provided. Expected format: backup-<date>/SERVIT-<date>.sql");
        }
        String basePath = configurationService.getBackupPath();
        Path backupFilePath = Paths.get(basePath, backupIdentifier);
        if (!Files.exists(backupFilePath) || !Files.isRegularFile(backupFilePath)) {
            throw new BackupNotFoundException("Backup file not found: " + backupFilePath.toString());
        }
        // Clear all managed tables before restore
        try {
            Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();
            List<String> tableNames = new ArrayList<>();
            for (EntityType<?> entity : entities) {
                jakarta.persistence.Table tableAnnotation = entity.getJavaType().getAnnotation(jakarta.persistence.Table.class);
                String tableName = tableAnnotation != null ? tableAnnotation.name() : entity.getName();
                tableNames.add(tableName);
            }
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
            for (String tableName : tableNames) {
                jdbcTemplate.execute("DELETE FROM " + tableName);
            }
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
        } catch (Exception e) {
            try { jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;"); } catch (Exception ignore) {}
            return "Error clearing data from tables: " + e.getMessage();
        }
        // Restore data from backup file
        ParsedDbUrl dbUrl = parseDbUrl();
        String username = getDbUsername();
        String password = getDbPassword();
        List<String> command = Arrays.asList(
            "mysql",
            "--user=" + username,
            "--password=" + password,
            "--host=" + dbUrl.host,
            "--port=" + dbUrl.port,
            dbUrl.databaseName,
            "-e", "source " + backupFilePath.toString().replace("\\", "/")
        );
        try {
            ProcessBuilder processBuilder = createProcessBuilder(command);
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                return "Restore completed successfully from: " + backupIdentifier;
            } else {
                String errors = new String(process.getErrorStream().readAllBytes());
                return "Restore failed. Exit code: " + exitCode + ". Errors: " + errors;
            }
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return "Error during restore: " + e.getMessage();
        }
    }
}
