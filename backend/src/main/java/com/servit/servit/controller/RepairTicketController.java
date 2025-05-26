package com.servit.servit.controller;

import com.servit.servit.dto.CheckInRepairTicketRequestDTO;
import com.servit.servit.dto.GetRepairTicketResponseDTO;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.service.RepairTicketService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/repairTicket")
public class RepairTicketController {

    @Autowired
    private final RepairTicketService repairTicketService;

    public RepairTicketController(RepairTicketService repairTicketService) {
        this.repairTicketService = repairTicketService;
    }

    @GetMapping("/getRepairTicket/{ticketNumber}")
    public ResponseEntity<GetRepairTicketResponseDTO> getRepairTicket(@PathVariable String ticketNumber) {
        try {
            GetRepairTicketResponseDTO repairTicket = repairTicketService.getRepairTicket(ticketNumber);
            return ResponseEntity.ok(repairTicket);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/checkInRepairTicket", consumes = {"multipart/form-data"})
    public ResponseEntity<RepairTicketEntity> checkInRepairTicket(
            @ModelAttribute CheckInRepairTicketRequestDTO req) {
        try {
            RepairTicketEntity repairTicket = repairTicketService.checkInRepairTicket(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(repairTicket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/generateRepairTicketNumber")
    public ResponseEntity<String> generateRepairTicketNumber() {
        try {
            String ticketNumber = repairTicketService.generateRepairTicketNumber();
            return ResponseEntity.ok(ticketNumber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to generate ticket number");
        }
    }

    @PostMapping("/uploadRepairTicketDocument/{ticketNumber}")
    public ResponseEntity<Void> uploadRepairTicketDocument(@PathVariable String ticketNumber,
                                                           @RequestParam("file") MultipartFile file) {
        try {
            repairTicketService.uploadRepairTicketDocument(ticketNumber, file);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getAllRepairTickets")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getAllRepairTickets() {
        List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getAllRepairTickets();
        return repairTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(repairTickets);
    }

    @GetMapping("/getRepairTicketsByStatus")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getRepairTicketsByStatus(@RequestParam String status) {
        List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getRepairTicketsByStatus(status);
        return repairTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(repairTickets);
    }
}