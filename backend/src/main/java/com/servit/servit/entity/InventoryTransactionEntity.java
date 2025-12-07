package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_transaction")
public class InventoryTransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne
    @JoinColumn(name = "part_id", nullable = false)
    @ToString.Exclude
    private PartEntity part;

    @Column(name = "transaction_type", nullable = false)
    private String transactionType; // ADD, UPDATE, DELETE, RESERVE, RELEASE, CONFIRM_USAGE, STOCK_ADJUSTMENT

    @Column(name = "quantity_changed")
    private Integer quantityChanged;

    @Column(name = "previous_stock")
    private Integer previousStock;

    @Column(name = "new_stock")
    private Integer newStock;

    @Column(name = "previous_reserved")
    private Integer previousReserved;

    @Column(name = "new_reserved")
    private Integer newReserved;

    @Column(name = "related_ticket_id")
    private String relatedTicketId;

    @Column(name = "related_quotation_id")
    private String relatedQuotationId;

    @Column(name = "performed_by", nullable = false)
    private String performedBy;

    @Column(name = "reason")
    private String reason;

    @Column(name = "notes", length = 1000)
    private String notes;

    @CreationTimestamp
    @Column(name = "transaction_timestamp", nullable = false)
    private LocalDateTime transactionTimestamp;

    @Column(name = "workflow_context")
    private String workflowContext; // WARRANTY_VERIFICATION, AUTO_REPLACEMENT, QUOTATION, SUPPLIER_REPLACEMENT
} 