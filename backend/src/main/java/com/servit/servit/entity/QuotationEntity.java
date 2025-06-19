// File: backend/src/main/java/com/servit/servit/entity/QuotationEntity.java
package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "quotation")
@Data
public class QuotationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quotation_id")
    private Long quotationId;

    @Column(name = "repair_ticket_number", nullable = false)
    private String repairTicketNumber;

    @ElementCollection
    private List<Long> partIds;

    @Column(name = "labor_cost", nullable = false)
    private Double laborCost;

    @Column(name = "total_cost", nullable = false)
    private Double totalCost;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "customer_selection")
    private String customerSelection;
}