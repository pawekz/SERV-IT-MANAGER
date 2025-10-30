package com.servit.servit.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.servit.servit.enumeration.PartEnum;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Entity
@Table(name = "part", indexes = {
    @Index(name = "idx_part_number", columnList = "partNumber"),
    @Index(name = "idx_part_serial_number", columnList = "serial_number", unique = true),
    @Index(name = "idx_part_type", columnList = "part_type"),
    @Index(name = "idx_part_is_deleted", columnList = "is_deleted"),
    @Index(name = "idx_part_is_reserved", columnList = "is_reserved"),
    @Index(name = "idx_part_reserved_for_ticket", columnList = "reserved_for_ticket_id"),
    @Index(name = "idx_part_type_deleted", columnList = "part_type, is_deleted"),
    @Index(name = "idx_part_customer_purchased", columnList = "is_customer_purchased"),
    @Index(name = "idx_part_quotation", columnList = "quotation_part")
})
public class PartEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "part_id")
    private Long partId;

    @Column(name = "partNumber", nullable = false)
    private String partNumber;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "unit_cost", nullable = false)
    private BigDecimal unitCost;

    @Column(name = "current_stock", nullable = false)
    private Integer currentStock;

    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "part_type", nullable = false)
    private PartEnum partType = PartEnum.STANDARD;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "date_added", nullable = false)
    private LocalDateTime dateAdded;

    @UpdateTimestamp
    @Column(name = "date_modified")
    private LocalDateTime dateModified;

    @Column(name = "date_purchased_by_customer")
    private LocalDateTime datePurchasedByCustomer;

    @Column(name = "warranty_expiration")
    private LocalDateTime warrantyExpiration;

    @Column(name = "is_customer_purchased", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isCustomerPurchased = false;

    @Column(name = "added_by", nullable = false)
    private String addedBy;

    @Column(name = "modified_by")
    private String modifiedBy;

    /*attached the repair ticket number here, see Customer Initiated RMA */
    @Column(name = "quotation_part", nullable = false, columnDefinition = "int default 0")
    private Integer quotationPart = 0;

    @Column(name = "is_reserved", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isReserved = false;

    @Column(name = "reserved_quantity", columnDefinition = "int default 0")
    private Integer reservedQuantity = 0;

    @Column(name = "reserved_for_ticket_id")
    private String reservedForTicketId;

    // Supplier information for SUPPLIER_REPLACEMENT parts
    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "supplier_part_number")
    private String supplierPartNumber;

    @Column(name = "supplier_order_date")
    private LocalDateTime supplierOrderDate;

    @Column(name = "supplier_expected_delivery")
    private LocalDateTime supplierExpectedDelivery;

    @Column(name = "supplier_actual_delivery")
    private LocalDateTime supplierActualDelivery;

    // Version field for optimistic locking
    @Version
    @Column(name = "version")
    private Long version;

    @OneToOne
    @JoinColumn(name = "warranty_id")
    @JsonBackReference
    private WarrantyEntity warranty;

    @Column(name = "brand")
    private String brand;

    @Column(name = "model")
    private String model;
}