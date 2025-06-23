package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonBackReference;


@Entity
@Table(name = "digital_signature")
@Data
public class DigitalSignatureEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "digital_signature_id")
    private Long digitalSignatureId;


    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @OneToOne
    @JoinColumn(name = "repair_ticket_id")
    @JsonBackReference
    private RepairTicketEntity repairTicket;


}
