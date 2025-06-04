package com.servit.servit.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ScheduledFuture;

@Service
public class ScheduledBackupService implements SchedulingConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledBackupService.class);
    
    private final BackupService backupService;
    private final ConfigurationService configurationService;
    
    private ScheduledTaskRegistrar taskRegistrar;
    private ScheduledFuture<?> scheduledTask;

    @Autowired
    public ScheduledBackupService(BackupService backupService, ConfigurationService configurationService) {
        this.backupService = backupService;
        this.configurationService = configurationService;
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        this.taskRegistrar = taskRegistrar;
        scheduleBackupTask();
    }

    private void scheduleBackupTask() {
        // Cancel existing task if any
        if (scheduledTask != null) {
            scheduledTask.cancel(false);
        }

        String cronExpression = configurationService.getBackupScheduleCron();
        if (StringUtils.hasText(cronExpression) && !cronExpression.equals("DISABLED")) {
            try {
                scheduledTask = taskRegistrar.getScheduler().schedule(
                    this::performScheduledBackup,
                    new CronTrigger(cronExpression)
                );
                logger.info("Scheduled backup task configured with CRON: {}", cronExpression);
            } catch (Exception e) {
                logger.error("Failed to schedule backup task with CRON: {}", cronExpression, e);
            }
        } else {
            logger.info("Backup scheduling is disabled");
        }
    }

    private void performScheduledBackup() {
        try {
            logger.info("Starting scheduled backup at {}", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            String backupPath = backupService.initiateManualBackup();
            logger.info("Scheduled backup completed successfully: {}", backupPath);
        } catch (Exception e) {
            logger.error("Scheduled backup failed", e);
        }
    }

    public void updateSchedule() {
        scheduleBackupTask();
    }

    public boolean isScheduled() {
        return scheduledTask != null && !scheduledTask.isCancelled();
    }

    public String getCurrentSchedule() {
        return configurationService.getBackupScheduleCron();
    }
} 