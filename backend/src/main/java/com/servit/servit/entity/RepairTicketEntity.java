package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "repair_ticket")
@Data
public class RepairTicketEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long repair_ticket_id;

    @Column(name = "ticket_number")
    private String ticketNumber;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "customer_phone_number")
    private String customerPhoneNumber;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "device_color")
    private String deviceColor;

    @Column(name = "device_serial_number")
    private String deviceSerialNumber;

    @Column(name = "device_model")
    private String deviceModel;

    @Column(name = "device_brand")
    private String deviceBrand;

    @Column(name = "device_password")
    private String devicePassword;

    @Column(name = "reported_issue")
    private String reportedIssue;

    @Column(name = "technician_name")
    private String technicianName;

    @Column(name = "status")
    private String status;

    @Column(name = "check_in_date")
    private LocalDateTime checkInDate;

    @OneToMany(mappedBy = "repairTicket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RepairPhotoEntity> repairPhotos;

    @OneToOne(mappedBy = "repairTicket", cascade = CascadeType.ALL)
    private DigitalSignatureEntity digitalSignature;

    @Column(name = "claim_form_path")
    private String claimFormPath;
}
