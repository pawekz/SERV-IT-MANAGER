package com.servit.servit.dto;

import lombok.Data;

@Data
public class ReservePartRequestDTO {
    private Long partId;
    private Integer quantity;
    private String reservedForTicketId;
    private String reservedBy; // User who made the reservation
    private String reason; // QUOTATION, REPAIR, SUPPLIER_REPLACEMENT, etc.
} 