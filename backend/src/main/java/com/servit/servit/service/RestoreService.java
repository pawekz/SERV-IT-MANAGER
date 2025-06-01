package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.metamodel.EntityType;
import org.springframework.transaction.annotation.Transactional;


import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
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

    public RestoreService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private String getDbName() {
        try {
            return dbUrl.substring(dbUrl.lastIndexOf("/") + 1).split("\?")[0];
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

    @Transactional
    public String restoreBackup(String fileName) {
        String dbName = getDbName();
        if (dbName == null) {
            return "Error: Database name could not be determined for restore.";
        }

        File backupFile = Paths.get(backupDirectoryPath, fileName).toFile();
        if (!backupFile.exists() || !backupFile.isFile()) {
            logger.error("Backup file not found for restore: {}", fileName);
            return "Error: Backup file not found.";
        }
        String filePath = backupFile.getAbsolutePath();

        // Clear data from tables before restoring
        try {
            logger.info("Attempting to clear data from managed tables...");
            Set<EntityType<?>> entities = entityManager.getMetamodel().getEntities();
            List<String> tableNames = new ArrayList<>();
            for (EntityType<?> entity : entities) {
                // Get table name from @Table annotation if present, otherwise use entity name
                jakarta.persistence.Table tableAnnotation = entity.getJavaType().getAnnotation(jakarta.persistence.Table.class);
                String tableName = tableAnnotation != null ? tableAnnotation.name() : entity.getName();
                tableNames.add(tableName);
            }

            // Disable foreign key checks, delete data, then re-enable.
            // Order of deletion might matter if not disabling FK checks, but this is safer.
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
            logger.info("Disabled foreign key checks.");

            for (String tableName : tableNames) {
                logger.info("Deleting data from table: {}", tableName);
                jdbcTemplate.execute("DELETE FROM " + tableName);
            }
            logger.info("Data deleted from all managed tables.");

        } catch (Exception e) {
            logger.error("Error clearing data from tables before restore", e);
            // Re-enable FK checks even if clearing fails, before aborting
            try {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
                logger.info("Re-enabled foreign key checks after error during data clearing.");
            } catch (Exception fke) {
                logger.error("Failed to re-enable foreign key checks after data clearing error.", fke);
            }
            return "Error clearing data from tables: " + e.getMessage();
        }


        // Construct mysql command to import data
        String passwordOption = (dbPassword != null && !dbPassword.isEmpty()) ? "--password=" + dbPassword : "";
        String command = String.format("mysql --host=%s --port=%s --user=%s %s %s < %s",
                getDbHost(), getDbPort(), dbUsername, passwordOption, dbName, filePath);

        logger.info("Executing restore command: mysql --host={} --port={} --user={} --password=**** {} < {}",
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

            // Re-enable foreign key checks after import attempt (success or failure)
            try {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
                logger.info("Re-enabled foreign key checks after restore attempt.");
            } catch (Exception e) {
                 logger.error("Failed to re-enable foreign key checks after restore attempt.", e);
                 // This is problematic, as FK constraints might not be active.
                 // Consider how to handle this, maybe return a special warning.
            }


            if (exitCode == 0) {
                logger.info("Database restore completed successfully from: {}", fileName);
                return "Restore completed successfully from: " + fileName;
            } else {
                String errors = new String(process.getErrorStream().readAllBytes());
                logger.error("Restore failed with exit code {}. Errors: {}", exitCode, errors);
                return "Restore failed. Exit code: " + exitCode + ". Errors: " + errors;
            }
        } catch (IOException | InterruptedException e) {
            logger.error("Error during restore process", e);
            Thread.currentThread().interrupt(); // Restore interrupted status
            // Attempt to re-enable foreign key checks even if process fails
            try {
                jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
                logger.info("Re-enabled foreign key checks after error during restore process.");
            } catch (Exception fke) {
                 logger.error("Failed to re-enable foreign key checks after restore process error.", fke);
            }
            return "Error during restore: " + e.getMessage();
        }
    }
}
