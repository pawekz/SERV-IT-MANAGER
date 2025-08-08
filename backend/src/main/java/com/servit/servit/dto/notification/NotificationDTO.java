package com.servit.servit.dto.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class NotificationDTO {
    private Long notificationId;
    private String ticketNumber;
    private String status;
    private String message;
    private String recipientEmail;

    @JsonProperty("isRead")
    private boolean isRead;

    private String createdAt;
}