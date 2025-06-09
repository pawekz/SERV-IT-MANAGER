package com.servit.servit.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "warranty_photo")
@Data
public class WarrantyPhotoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "warranty_photo_id")
    private Long warrantyPhotoId;

    @Column(name = "photo_url")
    private String photoUrl;

    @ManyToOne
    @JoinColumn(name = "warranty_id")
    @JsonBackReference
    private WarrantyEntity warranty;

    @Column(name = "document_path")
    private String documentPath;
}
