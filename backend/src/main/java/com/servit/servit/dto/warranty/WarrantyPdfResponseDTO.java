package com.servit.servit.dto.warranty;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WarrantyPdfResponseDTO {
    private byte[] fileBytes;
    private String fileName;
}
