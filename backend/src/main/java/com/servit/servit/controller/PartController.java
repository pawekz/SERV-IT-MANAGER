package com.servit.servit.controller;

import com.servit.servit.entity.Part;
import com.servit.servit.service.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/parts")
public class PartController {

    private final PartService partService;

    @Autowired
    public PartController(PartService partService) {this.partService = partService;}

    @PostMapping("/create")
    public ResponseEntity<Part> createPart(@RequestBody Part part) {
        return ResponseEntity.ok(partService.createPart(part));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable Long id, @RequestBody Part part) {
        try {
            return ResponseEntity.ok(partService.updatePart(id, part));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePart(@PathVariable Long id) {
        try {
            partService.deletePart(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Part> getPartById(@PathVariable Long id) {
        return partService.getPartById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{partNumber}")
    public ResponseEntity<Part> getPartByPartNumber(@PathVariable String partNumber) {
        return partService.getPartByPartNumber(partNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/serial/{serialNumber}")
    public ResponseEntity<Part> getPartBySerialNumber(@PathVariable String serialNumber) {
        return partService.getPartBySerialNumber(serialNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partService.getAllParts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Part>> searchParts(@RequestParam String searchTerm) {
        return ResponseEntity.ok(partService.searchParts(searchTerm));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Part>> getAvailableParts() {
        return ResponseEntity.ok(partService.getAvailableParts());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Part>> getLowStockParts() {
        return ResponseEntity.ok(partService.getLowStockParts());
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<Void> updateStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            partService.updateStock(id, quantity);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/stock/adjust")
    public ResponseEntity<Void> adjustStock(
            @PathVariable Long id,
            @RequestParam int quantity,
            @RequestParam String operationType) {
        try {
            partService.adjustStock(id, quantity, operationType);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/stock/release")
    public ResponseEntity<Void> releaseReservedStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        try {
            partService.releaseReservedStock(id, quantity);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Admin & Technician - Get All Parts (or paginated/filtered list)
    // This endpoint can serve both roles, with the service handling access control if needed
    @GetMapping("/all")
    public ResponseEntity<List<Part>> getAllActiveParts() {
        List<Part> parts = partService.getAllActiveParts();
        return new ResponseEntity<>(parts, HttpStatus.OK);
    }

    // TODO: Add endpoint for triggering low stock alerts manually if needed,
    // although it's primarily an internal process triggered by stock changes.
} 