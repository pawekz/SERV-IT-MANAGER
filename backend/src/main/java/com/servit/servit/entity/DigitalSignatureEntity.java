package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "digital_signature")
@Data
public class DigitalSignatureEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long digitalSignatureId;

    @Column(name = "image_url")
    private String imageUrl;

    @OneToOne
    @JoinColumn(name = "repair_ticket_id")
    private RepairTicketEntity repairTicket;

}
