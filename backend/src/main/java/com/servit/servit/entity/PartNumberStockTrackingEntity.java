package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "part_number_stock_tracking")
public class PartNumberStockTrackingEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tracking_id")
    private Long trackingId;
    
    @Column(name = "part_number", nullable = false, unique = true)
    private String partNumber;
    
    @Column(name = "part_name")
    private String partName; // For easier identification
    
    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold = 5; // Default threshold
    
    @Column(name = "current_total_stock")
    private Integer currentTotalStock = 0; // Aggregated from all parts with this part_number
    
    @Column(name = "current_available_stock")
    private Integer currentAvailableStock = 0; // Total stock minus reserved
    
    @Column(name = "total_parts_count")
    private Integer totalPartsCount = 0; // How many individual PartEntity records have this part_number
    
    @Column(name = "priority_level") //convert to enum if needed
    private String priorityLevel = "NORMAL"; // CRITICAL, HIGH, NORMAL, LOW

    
    @Column(name = "notes")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "last_stock_update")
    private LocalDateTime lastStockUpdate;
} 