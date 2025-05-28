package com.servit.servit.entity;

import com.servit.servit.enumeration.RepairStatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_status_history")
@Data
public class RepairStatusHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long repairStatusHistoryId;

    @ManyToOne
    @JoinColumn(name = "repair_ticket_id", nullable = false)
    private RepairTicketEntity repairTicket;

    @Enumerated(EnumType.STRING)
    @Column(name = "repair_status", nullable = false)
    private RepairStatusEnum repairStatusEnum;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
}