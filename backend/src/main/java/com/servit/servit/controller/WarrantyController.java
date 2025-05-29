package com.servit.servit.controller;

import com.servit.servit.dto.GetAllWarrantyDTO;
import com.servit.servit.entity.WarrantyEntity;
import com.servit.servit.enumeration.WarrantyStatus;
import com.servit.servit.service.WarrantyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/warranty")
public class WarrantyController {
    private final WarrantyService warrantyService;

    @Autowired
    public WarrantyController(WarrantyService warrantyService) {
        this.warrantyService = warrantyService;
    }

    @GetMapping
    public ResponseEntity<List<WarrantyEntity>> getAllWarranties() {
        return ResponseEntity.ok(warrantyService.getAllWarranties());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WarrantyEntity> getWarrantyById(@PathVariable Long id) {
        return warrantyService.getWarrantyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email")
    public ResponseEntity<List<GetAllWarrantyDTO>> getWarrantiesByCustomerEmail(@RequestParam String email) {
        return ResponseEntity.ok(warrantyService.getWarrantiesByCustomerEmail(email));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<GetAllWarrantyDTO>> searchWarranties(
            @RequestParam String email,
            @RequestParam String searchTerm,
            Pageable pageable
    ) {
        return ResponseEntity.ok(warrantyService.searchWarrantiesByEmail(email, searchTerm, pageable));
    }

    @PostMapping("/checkin")
    public ResponseEntity<WarrantyEntity> checkinWarranty(@RequestBody WarrantyEntity warranty) {
        return ResponseEntity.ok(warrantyService.checkinWarranty(warranty));
    }

    @PutMapping("/updatestatus")
    public ResponseEntity<Void> updateWarrantyStatus(
            @PathVariable Long id,
            @RequestParam WarrantyStatus status
    ) {
        warrantyService.updateStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/generate-number")
    public ResponseEntity<String> generateWarrantyNumber() {
        return ResponseEntity.ok(warrantyService.generateWarrantyNumber());
    }
}
