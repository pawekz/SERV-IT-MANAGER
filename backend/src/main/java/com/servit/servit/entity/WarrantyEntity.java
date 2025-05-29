package com.servit.servit.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.servit.servit.enumeration.WarrantyStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "warranty")
@Data
public class WarrantyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warranty_id")
    private Long warantyId;

    @Column(name = "warranty_number")
    private Long warantyNumber;

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

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @OneToOne
    @JoinColumn(name = "part_id", unique = true)
    private PartEntity item;

    @OneToMany(mappedBy = "warranty", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<WarrantyPhotoEntity> warrantyPhotos;

    @OneToOne(mappedBy = "warranty", cascade = CascadeType.ALL)
    @JsonManagedReference
    private DigitalSignatureEntity digitalSignature;

}

