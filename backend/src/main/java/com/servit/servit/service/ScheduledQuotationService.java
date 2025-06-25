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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.ScheduledFuture;

@Service
public class ScheduledQuotationService implements SchedulingConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(ScheduledQuotationService.class);

    private final QuotationRepository quotationRepository;
    private final ConfigurationService configurationService;
    private final NotificationService notificationService;

    private ScheduledTaskRegistrar taskRegistrar;
    private ScheduledFuture<?> scheduledTask;

    @Autowired
    public ScheduledQuotationService(QuotationRepository quotationRepository,
                                     ConfigurationService configurationService,
                                     NotificationService notificationService) {
        this.quotationRepository = quotationRepository;
        this.configurationService = configurationService;
        this.notificationService = notificationService;
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

    private void runMonitor() {
        try {
            logger.debug("Running quotation monitor at {}", LocalDateTime.now());
            List<QuotationEntity> pending = quotationRepository.findByStatus("PENDING");
            int defaultReminderHours = Integer.parseInt(configurationService.getConfigurationValue("quotation.reminder.delay.hours", "24"));
            for (QuotationEntity q : pending) {
                LocalDateTime now = LocalDateTime.now();
                // Reminder
                int reminderDelay = q.getReminderDelayHours() != null ? q.getReminderDelayHours() : defaultReminderHours;
                if (q.getCreatedAt() != null && q.getRespondedAt() == null) {
                    long hrs = ChronoUnit.HOURS.between(q.getCreatedAt(), now);
                    if (hrs >= reminderDelay) {
                        // Send reminder notification
                        try {
                            com.servit.servit.dto.NotificationDTO dto = new com.servit.servit.dto.NotificationDTO();
                            dto.setTicketNumber(q.getRepairTicketNumber());
                            dto.setStatus("QUOTATION_REMINDER");
                            dto.setMessage("You have a pending quotation to review.");
                            dto.setRecipientEmail("TODO");
                            notificationService.sendNotification(dto);
                        } catch (Exception e) {
                            logger.warn("Failed to send reminder for quotation {}", q.getQuotationId());
                        }
                    }
                }
                // Expiry check
                LocalDateTime expiry = q.getExpiryAt();
                if (expiry != null && now.isAfter(expiry)) {
                    q.setStatus("EXPIRED");
                    quotationRepository.save(q);
                    // Notify expiry
                    try {
                        com.servit.servit.dto.NotificationDTO dto = new com.servit.servit.dto.NotificationDTO();
                        dto.setTicketNumber(q.getRepairTicketNumber());
                        dto.setStatus("QUOTATION_EXPIRED");
                        dto.setMessage("Quotation has expired.");
                        dto.setRecipientEmail("TODO");
                        notificationService.sendNotification(dto);
                    } catch (Exception e) {
                        logger.warn("Failed to send expiry notification for quotation {}", q.getQuotationId());
                    }
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