package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "repair_photo")
@Data
public class RepairPhotoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "repair_photo_id")
    private Long repairPhotoId;

    @Column(name = "photo_url")
    private String photoUrl;

    @ManyToOne
    @JoinColumn(name = "repair_ticket_id")
    private RepairTicketEntity repairTicket;
}
