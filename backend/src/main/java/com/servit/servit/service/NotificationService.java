package com.servit.servit.service;

import com.servit.servit.dto.NotificationDTO;
import com.servit.servit.entity.NotificationEntity;
import com.servit.servit.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationRepository notificationRepository;

    public void sendNotification(NotificationDTO notification) {
        try {
            NotificationEntity entity = new NotificationEntity();
            entity.setTicketNumber(notification.getTicketNumber());
            entity.setStatus(notification.getStatus());
            entity.setMessage(notification.getMessage());
            entity.setRecipientEmail(notification.getRecipientEmail());
            notificationRepository.save(entity);

            try {
                emailService.sendGenericNotificationEmail(
                        notification.getRecipientEmail(),
                        "Repair Ticket Update: " + notification.getTicketNumber(),
                        notification.getMessage()
                );
                messagingTemplate.convertAndSend("/topic/notifications/" + notification.getRecipientEmail(), notification);
                logger.info("Notification sent to {} for ticket {}", notification.getRecipientEmail(), notification.getTicketNumber());
            } catch (Exception e) {
                logger.error("Failed to send email notification to {}: {}", notification.getRecipientEmail(), e.getMessage(), e);
            }
        } catch (Exception e) {
            logger.error("Failed to save or send notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send notification", e);
        }
    }

    public List<NotificationDTO> getNotificationsFromUserEmail(String email) {
        try {
            return notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Failed to fetch notifications for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch notifications", e);
        }
    }

    private NotificationDTO toDto(NotificationEntity entity) {
        NotificationDTO dto = new NotificationDTO();
        dto.setNotificationId(entity.getNotificationId());
        dto.setTicketNumber(entity.getTicketNumber());
        dto.setStatus(entity.getStatus());
        dto.setMessage(entity.getMessage());
        dto.setRecipientEmail(entity.getRecipientEmail());
        dto.setRead(entity.isRead());
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        return dto;
    }

    public void markAllNotificationsAsRead(String email) {
        try {
            List<NotificationEntity> notifications = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
            for (NotificationEntity notif : notifications) {
                notif.setRead(true);
            }
            notificationRepository.saveAll(notifications);
            logger.info("Marked all notifications as read for {}", email);

            List<NotificationDTO> updatedNotifications = notifications.stream().map(this::toDto).collect(Collectors.toList());
            messagingTemplate.convertAndSend("/topic/notifications/" + email, updatedNotifications);

        } catch (Exception e) {
            logger.error("Failed to mark all notifications as read for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to mark all notifications as read", e);
        }
    }

    public void markNotificationAsReadById(Long notificationId) {
        try {
            NotificationEntity notif = notificationRepository.findById(notificationId).orElse(null);
            if (notif != null && !notif.isRead()) {
                notif.setRead(true);
                notificationRepository.save(notif);
                logger.info("Marked notification {} as read", notificationId);

                List<NotificationDTO> updatedNotifications = getNotificationsFromUserEmail(notif.getRecipientEmail());
                messagingTemplate.convertAndSend("/topic/notifications/" + notif.getRecipientEmail(), updatedNotifications);
            }
        } catch (Exception e) {
            logger.error("Failed to mark notification {} as read: {}", notificationId, e.getMessage(), e);
            throw new RuntimeException("Failed to mark notification as read", e);
        }
    }

    public void deleteNotification(Long notificationId) {
        try {
            NotificationEntity notif = notificationRepository.findById(notificationId).orElse(null);
            String recipientEmail = notif != null ? notif.getRecipientEmail() : null;
            notificationRepository.deleteById(notificationId);
            logger.info("Deleted notification {}", notificationId);

            if (recipientEmail != null) {
                List<NotificationDTO> updatedNotifications = getNotificationsFromUserEmail(recipientEmail);
                messagingTemplate.convertAndSend("/topic/notifications/" + recipientEmail, updatedNotifications);
            }
        } catch (Exception e) {
            logger.error("Failed to delete notification {}: {}", notificationId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete notification", e);
        }
    }

    public void deleteAllNotifications(String email) {
        try {
            List<NotificationEntity> notifications = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
            notificationRepository.deleteAll(notifications);
            logger.info("Deleted all notifications for {}", email);

            messagingTemplate.convertAndSend("/topic/notifications/" + email, List.of());
        } catch (Exception e) {
            logger.error("Failed to delete all notifications for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to delete all notifications", e);
        }
    }

    public List<NotificationDTO> getAllUnreadNotifications(String email) {
        try {
            return notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email)
                    .stream()
                    .filter(notification -> !notification.isRead())
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Failed to fetch unread notifications for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch unread notifications", e);
        }
    }

    public Page<NotificationDTO> getNotificationsFromUserEmailPageable(String email, Pageable pageable) {
        try {
            return notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email, pageable)
                    .map(this::toDto);
        } catch (Exception e) {
            logger.error("Failed to fetch pageable notifications for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch pageable notifications", e);
        }
    }

    public Page<NotificationDTO> getAllUnreadNotificationsFromUserPageable(String email, Pageable pageable) {
        try {
            return notificationRepository.findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc(email, pageable)
                    .map(this::toDto);
        } catch (Exception e) {
            logger.error("Failed to fetch pageable unread notifications for {}: {}", email, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch pageable unread notifications", e);
        }
    }
}