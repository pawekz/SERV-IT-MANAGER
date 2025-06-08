package com.servit.servit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RepairTicketPdfResponseDTO {
    private byte[] fileBytes;
    private String fileName;
}