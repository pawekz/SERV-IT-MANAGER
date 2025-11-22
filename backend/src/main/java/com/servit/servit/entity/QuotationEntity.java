// File: backend/src/main/java/com/servit/servit/entity/QuotationEntity.java
package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

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

    @ManyToMany
    @JoinTable(
        name = "quotation_recommended_parts",
        joinColumns = @JoinColumn(name = "quotation_id"),
        inverseJoinColumns = @JoinColumn(name = "part_id")
    )
    @JsonManagedReference
    private List<PartEntity> recommendedPart;

    @ManyToMany
    @JoinTable(
        name = "quotation_alternative_parts",
        joinColumns = @JoinColumn(name = "quotation_id"),
        inverseJoinColumns = @JoinColumn(name = "part_id")
    )
    @JsonManagedReference
    private List<PartEntity> alternativePart;

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

    @Column(name = "expiry_at")
    private LocalDateTime expiryAt;

    @Column(name = "reminder_delay_hours")
    private Integer reminderDelayHours;

    @Column(name = "next_reminder_at")
    private LocalDateTime nextReminderAt;

    @Column(name = "last_reminder_sent_at")
    private LocalDateTime lastReminderSentAt;

    @Column(name = "reminder_send_count")
    private Integer reminderSendCount;

    @Column(name = "approval_summary_sent_at")
    private LocalDateTime approvalSummarySentAt;

    @Column(name = "technician_override")
    private Boolean technicianOverride = Boolean.FALSE;

    @Column(name = "override_timestamp")
    private LocalDateTime overrideTimestamp;

    @Column(name = "override_notes", columnDefinition = "TEXT")
    private String overrideNotes;
}