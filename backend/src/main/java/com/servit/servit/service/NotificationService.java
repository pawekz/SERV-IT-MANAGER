package com.servit.servit.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for handling notifications throughout the inventory and repair workflows.
 * Currently implements console logging but can be extended to support email, SMS, push notifications, etc.
 */
@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    /**
     * Sends low stock alert to administrators
     */
    public void sendLowStockAlert(String message, String partName, int currentStock, int threshold) {
        String alertMessage = String.format("LOW STOCK ALERT: %s | Part: %s | Current Stock: %d | Threshold: %d", 
                                           message, partName, currentStock, threshold);
        
        // TODO: Implement actual notification mechanism (email, push notification, etc.)
        logger.warn("ALERT: {}", alertMessage);
        System.out.println("🚨 " + alertMessage);
    }

    /**
     * Sends notification to administrators
     */
    public void sendAdminNotification(String message) {
        String notificationMessage = "ADMIN NOTIFICATION: " + message;
        
        // TODO: Implement actual admin notification mechanism
        logger.info("ADMIN: {}", notificationMessage);
        System.out.println("📋 " + notificationMessage);
    }

    /**
     * Sends notification to technicians
     */
    public void sendTechnicianNotification(String ticketId, String message) {
        String notificationMessage = String.format("TECHNICIAN NOTIFICATION [%s]: %s", ticketId, message);
        
        // TODO: Implement actual technician notification mechanism
        logger.info("TECH: {}", notificationMessage);
        System.out.println("🔧 " + notificationMessage);
    }

    /**
     * Sends notification to customers
     */
    public void sendCustomerNotification(String customerEmail, String ticketId, String message) {
        String notificationMessage = String.format("CUSTOMER NOTIFICATION [%s] to %s: %s", 
                                                   ticketId, customerEmail, message);
        
        // TODO: Implement actual customer notification mechanism (email, SMS, app notification)
        logger.info("CUSTOMER: {}", notificationMessage);
        System.out.println("👤 " + notificationMessage);
    }

    /**
     * Sends general system notification
     */
    public void sendSystemNotification(String component, String message) {
        String notificationMessage = String.format("SYSTEM NOTIFICATION [%s]: %s", component, message);
        
        logger.info("SYSTEM: {}", notificationMessage);
        System.out.println("⚙️ " + notificationMessage);
    }
    
    /**
     * Sends notification when stock is restored above threshold
     */
    public void sendStockRestoreNotification(String message, String partName, int currentStock) {
        String restoreMessage = String.format("STOCK RESTORED: %s | Part: %s | Current Stock: %d", 
                                              message, partName, currentStock);
        logger.info("STOCK_RESTORE: {}", restoreMessage);
        System.out.println("✅ " + restoreMessage);
    }
} 