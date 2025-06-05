package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Data
@Entity
@Table(name = "part")
public class PartEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "part_id")
    private Long partId;

    @Column(name = "partNumber", nullable = false, unique = true)
    private String partNumber;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "unit_cost", nullable = false)
    private BigDecimal unitCost;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold;

    @Column(name = "serial_number", nullable = false)
    private String serialNumber;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "date_added", nullable = false)
    private LocalDateTime dateAdded;

    @Column(name = "date_purchased_by_customer")
    private LocalDateTime datePurchasedByCustomer;

    @Column(name = "warranty_expiration")
    private LocalDateTime warrantyExpiration;

    @Column(name = "added_by", nullable = false)
    private String addedBy;

    /*attached the repair ticket number here, see Customer Initiated RMA */
    @Column(name = "quotation_part", nullable = false, columnDefinition = "int default 0")
    private Integer quotationPart = 0;

    @Column(name = "is_reserved", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isReserved = false;

    @OneToOne(mappedBy = "item")
    private WarrantyEntity warranty;
}