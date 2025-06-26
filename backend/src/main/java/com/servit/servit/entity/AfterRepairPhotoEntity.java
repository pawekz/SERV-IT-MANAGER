package com.servit.servit.entity;

import jakarta.persistence.*;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "after_repair_photo")
@Data
public class AfterRepairPhotoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "after_repair_photo_id")
    private Long afterRepairPhotoId;

    @Column(name = "photo_url")
    private String photoUrl;

    @ManyToOne
    @JoinColumn(name = "repair_ticket_id")
    @JsonBackReference
    private RepairTicketEntity repairTicket;
} 