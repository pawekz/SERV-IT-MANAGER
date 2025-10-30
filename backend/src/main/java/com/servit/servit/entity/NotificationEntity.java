package com.servit.servit.entity;

import com.servit.servit.enumeration.RepairStatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification", indexes = {
    @Index(name = "idx_notification_recipient_email", columnList = "recipient_email"),
    @Index(name = "idx_notification_is_read", columnList = "is_read"),
    @Index(name = "idx_notification_recipient_read", columnList = "recipient_email, is_read"),
    @Index(name = "idx_notification_created_at", columnList = "created_at"),
    @Index(name = "idx_notification_ticket_number", columnList = "ticket_number")
})
@Data
public class NotificationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;

    @Column(name = "ticket_number")
    private String ticketNumber;

    @Column(name = "status")
    private String status;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;
}