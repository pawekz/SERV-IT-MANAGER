package com.servit.servit.entity;

import com.servit.servit.enumeration.RepairStatusEnum;
import com.servit.servit.enumeration.RepairTicketDeviceType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "repair_ticket")
@Data
public class RepairTicketEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "repair_ticket_id")
    private Long repairTicketId;

    @Column(name = "ticket_number", nullable = false)
    private String ticketNumber;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @Column(name = "customer_phone_number", nullable = false)
    private String customerPhoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false)
    private RepairTicketDeviceType deviceType;

    @Column(name = "device_color", nullable = false)
    private String deviceColor;

    @Column(name = "device_serial_number", nullable = false)
    private String deviceSerialNumber;

    @Column(name = "device_model", nullable = false)
    private String deviceModel;

    @Column(name = "device_brand", nullable = false)
    private String deviceBrand;

    @Column(name = "device_password")
    private String devicePassword;

    @Column(name = "reported_issue", nullable = false, columnDefinition = "TEXT")
    private String reportedIssue;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @Column(name = "accessories", columnDefinition = "TEXT")
    private String accessories;

    @ManyToOne
    @JoinColumn(name = "technician_email", referencedColumnName = "email", nullable = false)
    private UserEntity technicianEmail;

    @Column(name = "technician_name", nullable = false)
    private String technicianName;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "check_in_date")
    private LocalDateTime checkInDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "repair_status", nullable = false)
    private RepairStatusEnum repairStatus;

    @OneToMany(mappedBy = "repairTicket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<RepairStatusHistoryEntity> repairStatusHistory;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "repairTicket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<RepairPhotoEntity> repairPhotos;

    @OneToOne(mappedBy = "repairTicket", cascade = CascadeType.ALL)
    @JsonManagedReference
    private DigitalSignatureEntity digitalSignature;

    @Column(name = "document_path")
    private String documentPath;
}
