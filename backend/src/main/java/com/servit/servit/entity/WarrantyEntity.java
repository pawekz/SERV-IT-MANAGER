package com.servit.servit.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.servit.servit.enumeration.WarrantyStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "warranty", indexes = {
    @Index(name = "idx_warranty_number", columnList = "warranty_number", unique = true),
    @Index(name = "idx_warranty_customer_email", columnList = "customer_email"),
    @Index(name = "idx_warranty_status", columnList = "status"),
    @Index(name = "idx_warranty_customer_status", columnList = "customer_email, status"),
    @Index(name = "idx_warranty_created_at", columnList = "created_at")
})
@Data
public class WarrantyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warranty_id")
    private Long warrantyId;

    @Column(name = "warranty_number")
    private String warrantyNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WarrantyStatus status = WarrantyStatus.CHECKED_IN;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @Column(name = "customer_phone_number", nullable = false)
    private String customerPhoneNumber;

    @Column(name = "return_reason", nullable = false)
    private String returnReason;

    @Column(name = "reported_issue", nullable = false, columnDefinition = "TEXT")
    private String reportedIssue;

    @Column(name = "tech_observation")
    private String techObservation;

    @Column(name = "kind", nullable = false)
    private String kind;

    @Column(name = "is_device_tampered")
    private Boolean isDeviceTampered;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "warranty", cascade = CascadeType.ALL)
    @JsonManagedReference
    private PartEntity item;

    @OneToMany(mappedBy = "warranty", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<WarrantyPhotoEntity> warrantyPhotos;

    @Column(name = "document_path")
    private String documentPath;

}

