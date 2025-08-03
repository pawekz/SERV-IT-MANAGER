package com.servit.servit.dto.repairticket;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class UpdateRepairStatusWithPhotosRequestDTO {
    private String ticketNumber;
    private String repairStatus; // Expected to be READY_FOR_PICKUP
    private List<MultipartFile> afterRepairPhotos;
} 