package com.servit.servit.controller;

import com.servit.servit.dto.PendingApprovalsCountDTO;
import com.servit.servit.dto.warranty.*;
import com.servit.servit.entity.WarrantyEntity;
import com.servit.servit.service.S3Service;
import com.servit.servit.service.WarrantyService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/warranty")
public class WarrantyController {
    private static final Logger logger = LoggerFactory.getLogger(RepairTicketController.class);

    private final WarrantyService warrantyService;

    @Autowired
    public WarrantyController(WarrantyService warrantyService) {
        this.warrantyService = warrantyService;
    }

    @Autowired
    private S3Service s3Service;

    @GetMapping("/getAllWarranties")
    public ResponseEntity<List<GetAllWarrantyDTO>> getAllWarranties() {
        List<GetAllWarrantyDTO> warranty = warrantyService.getAllWarranties();
        return warranty.isEmpty()
                ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                : ResponseEntity.status(HttpStatus.OK).body(warranty);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarrantyEntity> getWarrantyById(@PathVariable Long id) {
        return warrantyService.getWarrantyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // get all warranties under certain customer by email
    @GetMapping("/getWarrantyByCustomerEmail")
    public ResponseEntity<List<GetAllWarrantyDTO>> getWarrantyByCustomerEmail(@RequestParam String email) {
        try {
            List<GetAllWarrantyDTO> warranty = warrantyService.getWarrantiesByCustomerEmail(email);
            return warranty.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                    : ResponseEntity.status(HttpStatus.OK).body(warranty);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // serach all warranties under certain customer by email with a serach term
    @GetMapping("/searchByEmail")
    public ResponseEntity<Page<GetAllWarrantyDTO>> searchWarranties(
            @RequestParam String email,
            @RequestParam String searchTerm,
            Pageable pageable
    ) {
        return ResponseEntity.ok(warrantyService.searchWarrantiesByEmail(email, searchTerm, pageable));
    }

    //submit a new warranty
    @PostMapping("/checkInWarranty")
    public ResponseEntity<?> checkInWarranty(@ModelAttribute CheckInWarrantyDTO req) {
        try {
            WarrantyEntity warranty = warrantyService.checkinWarranty(req);
            return ResponseEntity.status(HttpStatus.OK).body(warranty);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/updateWarrantyStatus")
    public ResponseEntity<?> updateWarrantyStatus(@ModelAttribute UpdateWarrantyStatusDTO request) {
        try {
            WarrantyEntity warranty = warrantyService.updateWarrantyStatus(request);
            return ResponseEntity.ok(warranty);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/generateWarrantyNumber")
    public ResponseEntity<String> generateWarrantyNumber() {
        try {
            String warrantyNumber = warrantyService.generateWarrantyNumber();
            return ResponseEntity.status(HttpStatus.OK).body(warrantyNumber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to generate warranty number");
        }
    }

    //verify warranty by serial number
    @GetMapping("/check/{serialNumber}")
    public VerifyWarrantyDTO checkWarranty(
            @PathVariable String serialNumber,
            @RequestParam(required = false) Boolean isDeviceTampered
    ) {
        return warrantyService.checkWarranty(serialNumber, isDeviceTampered);
    }

    @PatchMapping("/uploadWarrantyDocument/{WarrantyNumber}")
    public ResponseEntity<Void> uploadWarrantyDocument(@PathVariable String WarrantyNumber,
                                                           @RequestParam("file") MultipartFile file) {
        try {
            warrantyService.uploadWarrantyDocument(WarrantyNumber, file);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getWarrantyPdf/{warrantyNumber}")
    public ResponseEntity<byte[]> getWarrantyPdf(@PathVariable String warrantyNumber) {
        try {
            WarrantyPdfResponseDTO pdfResponse = warrantyService.getWarrantyPdf(warrantyNumber);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + pdfResponse.getFileName() + "\"")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(pdfResponse.getFileBytes());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getWarrantyPhotos")
    public ResponseEntity<String> getWarrantyPhotos(@RequestParam("photoUrl") String photoUrl) {
        try {
            String s3Key = photoUrl;
            int idx = photoUrl.indexOf(".amazonaws.com/");
            if (idx != -1) {
                s3Key = photoUrl.substring(idx + ".amazonaws.com/".length());
            }
            String presignedUrl = s3Service.generatePresignedUrl(s3Key, 10); // 10 minutes expiry
            return ResponseEntity.ok(presignedUrl);
        } catch (Exception e) {
            logger.error("Failed to generate presigned URL for warranty photos: {}", photoUrl, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * GET /warranty/getPendingApprovals
     * Returns the number of warranty tickets pending approval.
     * Pending statuses: CHECKED_IN, ITEM_RETURNED, WAITING_FOR_WARRANTY_REPLACEMENT, WARRANTY_REPLACEMENT_ARRIVED
     * Excludes: WARRANTY_REPLACEMENT_COMPLETED, DENIED
     * @return JSON object: { "pendingApprovals": <count> }
     */
    @GetMapping("/getPendingApprovals")
    public ResponseEntity<PendingApprovalsCountDTO> getPendingApprovals() {
        try {
            PendingApprovalsCountDTO dto = warrantyService.getPendingApprovalsCount();
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new PendingApprovalsCountDTO(0));
        }
    }
}
