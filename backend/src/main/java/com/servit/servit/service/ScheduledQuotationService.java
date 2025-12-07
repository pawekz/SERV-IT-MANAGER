package com.servit.servit.service;

import com.servit.servit.entity.QuotationEntity;
import com.servit.servit.repository.QuotationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ScheduledFuture;

@Service
public class ScheduledQuotationService implements SchedulingConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledQuotationService.class);

    private final QuotationRepository quotationRepository;
    private final ConfigurationService configurationService;
    private final QuotationService quotationService;

    private ScheduledTaskRegistrar taskRegistrar;
    private ScheduledFuture<?> scheduledTask;

    @Autowired
    public ScheduledQuotationService(QuotationRepository quotationRepository,
                                     ConfigurationService configurationService,
                                     QuotationService quotationService) {
        this.quotationRepository = quotationRepository;
        this.configurationService = configurationService;
        this.quotationService = quotationService;
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        this.taskRegistrar = taskRegistrar;
        scheduleTask();
    }

    private void scheduleTask() {
        if (scheduledTask != null) {
            scheduledTask.cancel(false);
        }
        String cron = configurationService.getConfigurationValue("quotation.schedule.cron", "0 0 * * * *");
        if (StringUtils.hasText(cron) && !"DISABLED".equalsIgnoreCase(cron)) {
            scheduledTask = taskRegistrar.getScheduler().schedule(this::runMonitor, new CronTrigger(cron));
            logger.info("Scheduled quotation monitor with CRON {}", cron);
        } else {
            logger.info("Quotation monitor scheduling disabled");
        }
    }

    // Maximum age for reminder - skip if nextReminderAt is older than this (prevents re-sends after restore)
    private static final int MAX_REMINDER_AGE_HOURS = 2;

    private void runMonitor() {
        try {
            logger.debug("Running quotation monitor at {}", LocalDateTime.now());
            List<QuotationEntity> pending = quotationRepository.findByStatus("PENDING");
            for (QuotationEntity q : pending) {
                LocalDateTime now = LocalDateTime.now();
                
                // Check if reminder is due and not too old (prevents mass re-sends after backup restore)
                if (q.getNextReminderAt() != null && (q.getLastReminderSentAt() == null || now.isAfter(q.getNextReminderAt()))) {
                    // Skip if reminder is too old (likely from a restored backup)
                    if (q.getNextReminderAt().isBefore(now.minusHours(MAX_REMINDER_AGE_HOURS))) {
                        logger.warn("Skipping stale reminder for quotation {} - nextReminderAt {} is more than {} hours old", 
                            q.getQuotationId(), q.getNextReminderAt(), MAX_REMINDER_AGE_HOURS);
                        // Update nextReminderAt to prevent repeated warnings
                        q.setNextReminderAt(now.plusHours(q.getReminderDelayHours() != null ? q.getReminderDelayHours() : 24));
                        quotationRepository.save(q);
                        continue;
                    }
                    quotationService.sendReminder(q.getQuotationId());
                }
                
                // Check for expiry - also skip if expiry is too old (prevents duplicate expired notifications after restore)
                LocalDateTime expiry = q.getExpiryAt();
                if (expiry != null && now.isAfter(expiry)) {
                    // Skip if already way past expiry (likely already processed before backup)
                    if (expiry.isBefore(now.minusHours(MAX_REMINDER_AGE_HOURS))) {
                        logger.warn("Skipping stale expiry for quotation {} - expiryAt {} is more than {} hours old", 
                            q.getQuotationId(), expiry, MAX_REMINDER_AGE_HOURS);
                        q.setStatus("EXPIRED");
                        quotationRepository.save(q);
                        continue;
                    }
                    q.setStatus("EXPIRED");
                    quotationRepository.save(q);
                    logger.info("Quotation {} expired", q.getQuotationId());
                }
            }
        } catch (Exception e) {
            logger.error("Error in quotation monitor", e);
        }
    }

    public void updateSchedule() {
        scheduleTask();
    }
} 