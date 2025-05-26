package com.servit.servit.controller;

import com.servit.servit.service.PartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.servit.servit.dto.AddPartRequestDTO;
import com.servit.servit.dto.PartResponseDTO;
import com.servit.servit.dto.UpdatePartRequestDTO;
import jakarta.persistence.EntityNotFoundException;

import java.util.List;

@RestController
@RequestMapping("/part")
public class PartController {

    @Autowired
    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @PostMapping("/addPart")
    public ResponseEntity<PartResponseDTO> addPart(@RequestBody AddPartRequestDTO req) {
        return ResponseEntity.ok(partService.addpart(req));
    }

    @PatchMapping("/updatePart/{id}")
    public ResponseEntity<PartResponseDTO> updatePart(@PathVariable Long id, @RequestBody UpdatePartRequestDTO req) {
        try {
            return ResponseEntity.ok(partService.updatePart(id, req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/deletePart/{partId}")
    public ResponseEntity<Void> deletePart(@PathVariable Long partId) {
        try {
            partService.deletePart(partId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            System.err.println("Error deleting part: " + e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            System.err.println("Error deleting part: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Unexpected error deleting part: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/getPartById/{id}")
    public ResponseEntity<PartResponseDTO> getPartById(@PathVariable Long id) {
        return partService.getPartById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/getPartByPartNumber/{partNumber}")
    public ResponseEntity<PartResponseDTO> getPartByPartNumber(@PathVariable String partNumber) {
        return partService.getPartByPartNumber(partNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/getPartBySerialNumber/{serialNumber}")
    public ResponseEntity<PartResponseDTO> getPartBySerialNumber(@PathVariable String serialNumber) {
        return partService.getPartBySerialNumber(serialNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/searchParts")
    public ResponseEntity<List<PartResponseDTO>> searchParts(@RequestParam String searchTerm) {
        return ResponseEntity.ok(partService.searchParts(searchTerm));
    }

    @GetMapping("/getAvailableParts")
    public ResponseEntity<List<PartResponseDTO>> getAvailableParts() {
        return ResponseEntity.ok(partService.getAvailableParts());
    }

    @GetMapping("/stock/getLowStockParts")
    public ResponseEntity<List<PartResponseDTO>> getLowStockParts() {
        return ResponseEntity.ok(partService.getLowStockParts());
    }

    @PatchMapping("/stock/updateStocks/{id}")
    public ResponseEntity<Void> updateStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            partService.updateStock(id, quantity);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/stock/adjustStock/{id}")
    public ResponseEntity<Void> adjustStock(@PathVariable Long id, @RequestParam int quantity, @RequestParam String operationType) {
        try {
            partService.adjustStock(id, quantity, operationType);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/stock/releaseReservedStock/{id}")
    public ResponseEntity<Void> releaseReservedStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            partService.releaseReservedStock(id, quantity);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Admin & Technician - Get All Parts (or paginated/filtered list)
    // This endpoint can serve both roles, with the service handling access control if needed
    @GetMapping("/getAllParts")
    public ResponseEntity<List<PartResponseDTO>> getAllParts() {
        List<PartResponseDTO> parts = partService.getAllParts();
        return parts.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(parts);
    }

    // TODO: Add endpoint for triggering low stock alerts manually if needed,
    // although it's primarily an internal process triggered by stock changes.
}