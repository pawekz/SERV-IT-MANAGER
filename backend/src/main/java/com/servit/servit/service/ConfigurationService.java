package com.servit.servit.service;

import com.servit.servit.entity.SystemConfiguration;
import com.servit.servit.repository.SystemConfigurationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.file.InvalidPathException;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class ConfigurationService {

    private static final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);

    public static final String BACKUP_PATH_CONFIG_KEY = "backup.base.path";
    public static final String BACKUP_SCHEDULE_CRON_KEY = "backup.schedule.cron";
    public static final String BACKUP_SCHEDULE_ENABLED_KEY = "backup.schedule.enabled";
    public static final String TICKET_FILES_PATH_CONFIG_KEY = "ticketfiles.base.path";
    
    private static final String DEFAULT_BACKUP_PATH = "./src/main/resources/"; // Changed to avoid conflict, default SQL dump location
    private static final String DEFAULT_BACKUP_SCHEDULE = "DISABLED";
    private static final String DEFAULT_TICKET_FILES_PATH = "./src/main/resources/static/";

    private final SystemConfigurationRepository systemConfigurationRepository;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.s3.backup-prefix:backups/}")
    private String backupPrefix;

    @Autowired
    public ConfigurationService(SystemConfigurationRepository systemConfigurationRepository) {
        this.systemConfigurationRepository = systemConfigurationRepository;
    }

    // Returns the S3 key for a given backup file (.sql only, always under backup/)
    public String getS3BackupKey(String backupFileName) {
        return "backup/" + backupFileName;
    }

    @Transactional(readOnly = true)
    public String getConfigurationValue(String key, String defaultValue) {
        if (!StringUtils.hasText(key)) {
            logger.warn("Attempted to get configuration with null or empty key. Returning default value.");
            return defaultValue;
        }
        return systemConfigurationRepository.findByConfigKey(key)
                .map(SystemConfiguration::getConfigValue)
                .orElse(defaultValue);
    }

    @Transactional
    public void setConfigurationValue(String key, String value) {
        if (!StringUtils.hasText(key)) {
            logger.error("Configuration key cannot be null or empty.");
            throw new IllegalArgumentException("Configuration key cannot be null or empty.");
        }
        if (value == null) { // Allowing empty string for value, but not null
            logger.error("Configuration value for key '{}' cannot be null.", key);
            throw new IllegalArgumentException("Configuration value cannot be null.");
        }

        SystemConfiguration configuration = systemConfigurationRepository.findByConfigKey(key)
                .orElse(new SystemConfiguration(key, value));

        configuration.setConfigValue(value);
        systemConfigurationRepository.save(configuration);
        logger.info("Set configuration for key '{}'.", key);
    }

    @Transactional(readOnly = true)
    public String getBackupPath() {
        return getConfigurationValue(BACKUP_PATH_CONFIG_KEY, DEFAULT_BACKUP_PATH);
    }

    @Transactional
    public void setBackupPath(String path) {
        if (!StringUtils.hasText(path)) {
            logger.error("Backup path cannot be null, empty or blank.");
            throw new IllegalArgumentException("Backup path cannot be null, empty or blank.");
        }

        // Basic path validation - check if it's a valid path format, not if it exists or is a directory.
        try {
            Paths.get(path); // This will throw InvalidPathException if the path string is malformed
        } catch (InvalidPathException e) {
            logger.error("Invalid backup path format: {}", path, e);
            throw new IllegalArgumentException("Invalid backup path format: " + path, e);
        }
        
        logger.info("Setting backup path to: {}", path);
        setConfigurationValue(BACKUP_PATH_CONFIG_KEY, path);
    }

    @Transactional(readOnly = true)
    public String getBackupScheduleCron() {
        return getConfigurationValue(BACKUP_SCHEDULE_CRON_KEY, DEFAULT_BACKUP_SCHEDULE);
    }

    @Transactional
    public void setBackupScheduleCron(String cronExpression) {
        if (cronExpression == null) {
            logger.error("CRON expression cannot be null.");
            throw new IllegalArgumentException("CRON expression cannot be null.");
        }

        if (cronExpression.equals("DISABLED")) {
            logger.info("Disabling backup schedule");
            setConfigurationValue(BACKUP_SCHEDULE_CRON_KEY, cronExpression);
            setConfigurationValue(BACKUP_SCHEDULE_ENABLED_KEY, "false");
            return;
        }

        // Validate CRON expression
        try {
            CronExpression.parse(cronExpression);
        } catch (Exception e) {
            logger.error("Invalid CRON expression: {}", cronExpression, e);
            throw new IllegalArgumentException("Invalid CRON expression: " + cronExpression, e);
        }

        // Validate minimum 5-minute interval
        validateMinimumInterval(cronExpression);

        logger.info("Setting backup schedule CRON to: {}", cronExpression);
        setConfigurationValue(BACKUP_SCHEDULE_CRON_KEY, cronExpression);
        setConfigurationValue(BACKUP_SCHEDULE_ENABLED_KEY, "true");
    }

    @Transactional(readOnly = true)
    public boolean isBackupScheduleEnabled() {
        String enabled = getConfigurationValue(BACKUP_SCHEDULE_ENABLED_KEY, "false");
        return "true".equalsIgnoreCase(enabled);
    }

    private void validateMinimumInterval(String cronExpression) {
        try {
            CronExpression cron = CronExpression.parse(cronExpression);
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime next1 = cron.next(now);
            LocalDateTime next2 = cron.next(next1);
            
            if (next1 != null && next2 != null) {
                Duration interval = Duration.between(next1, next2);
                if (interval.toMinutes() < 5) {
                    throw new IllegalArgumentException("Backup interval must be at least 5 minutes. Current interval: " + interval.toMinutes() + " minutes");
                }
            }
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException) {
                throw e;
            }
            logger.warn("Could not validate interval for CRON expression: {}", cronExpression, e);
            // Allow the CRON expression if we can't validate the interval
        }
    }

    @Transactional(readOnly = true)
    public String getTicketFilesBasePath() {
        return getConfigurationValue(TICKET_FILES_PATH_CONFIG_KEY, DEFAULT_TICKET_FILES_PATH);
    }

    @Transactional
    public void setTicketFilesBasePath(String path) {
        if (!StringUtils.hasText(path)) {
            logger.error("Ticket files path cannot be null, empty or blank.");
            throw new IllegalArgumentException("Ticket files path cannot be null, empty or blank.");
        }
        try {
            Paths.get(path);
        } catch (InvalidPathException e) {
            logger.error("Invalid ticket files path format: {}", path, e);
            throw new IllegalArgumentException("Invalid ticket files path format: " + path, e);
        }
        logger.info("Setting ticket files path to: {}", path);
        setConfigurationValue(TICKET_FILES_PATH_CONFIG_KEY, path);
    }
}
