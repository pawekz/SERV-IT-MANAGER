package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "feedback")
@Data
public class FeedbackEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comments;

    @Column(name = "repair_ticket_id", nullable = false)
    private Long repairTicketId;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "technician_id")
    private Long technicianId;

    @Column(nullable = false)
    private boolean anonymous;
} 