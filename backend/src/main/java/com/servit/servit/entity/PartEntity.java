package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Entity class representing a part/inventory item in the system.
 * Maps to the 'parts' table in the database.
 */
@Data
@Entity
@Table(name = "parts")
public class PartEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String partNumber;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private BigDecimal unitCost;

    @Column(nullable = false)
    private Integer currentStock;

    @Column(nullable = false)
    private Integer lowStockThreshold;

    @Column(nullable = false)
    private String serialNumber;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime dateAdded;

    @Column
    private LocalDateTime datePurchasedByCustomer;

    @Column
    private LocalDateTime warrantyExpiration;

    @Column
    private String addedBy;
} 