package com.servit.servit.controller;

import com.servit.servit.dto.CheckInRepairTicketRequestDTO;
import com.servit.servit.dto.GetRepairTicketResponseDTO;
import com.servit.servit.dto.RepairStatusHistoryResponseDTO;
import com.servit.servit.dto.UpdateRepairStatusRequestDTO;
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

    @PostMapping("/checkInRepairTicket")
    public ResponseEntity<?> checkInRepairTicket(@ModelAttribute CheckInRepairTicketRequestDTO req) {
        try {
            RepairTicketEntity ticket = repairTicketService.checkInRepairTicket(req);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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

    @PatchMapping("/uploadRepairTicketDocument/{ticketNumber}")
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

    // Search and fetch tickets by customer email, (ADMIN SIDE)
    // Note: Ticket History, Ticket List, etc. etc.
    @GetMapping("/searchRepairTickets")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> searchRepairTickets(@RequestParam String searchTerm) {
        try {
            List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.searchRepairTickets(searchTerm);
            return repairTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Search and fetch tickets by customer email, displaying all tickets related to the associated user via email
    // Note: User's Ticket List, User's Ticket History, etc. etc.
    @GetMapping("/searchRepairTicketsByEmail")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> searchRepairTicketsByEmail(
            @RequestParam String email,
            @RequestParam String searchTerm) {
        try {
            List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.searchRepairTicketsByEmail(email, searchTerm);
            return repairTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // OPTIONAL ra ni, mas preferred ang search sa taas for Tickets List and History
    // This endpoint fetches all repair tickets, regardless of the user (ADMIN SIDE)
    @GetMapping("/getAllRepairTickets")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getAllRepairTickets() {
        List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getAllRepairTickets();
        return repairTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(repairTickets);
    }

    // OPTIONAL ra ni, mas preferred ang search sa taas for Tickets List and History
    // This endpoint fetches all repair tickets associated with a specific customer email
    @GetMapping("/getRepairTicketsByCustomerEmail")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getRepairTicketsByCustomerEmail(@RequestParam String email) {
        try {
            List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getRepairTicketsByCustomerEmail(email);
            return repairTickets.isEmpty() ? ResponseEntity.noContent().build() : ResponseEntity.ok(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Ma fetch/download ang repair ticket document from the backend
    @GetMapping("/getRepairTicketDocument/{ticketNumber}")
    public ResponseEntity<byte[]> getRepairTicketDocument(@PathVariable String ticketNumber) {
        try {
            byte[] document = repairTicketService.getRepairTicketDocument(ticketNumber);
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=" + ticketNumber + ".pdf")
                    .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                    .body(document);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/updateRepairStatus")
    public ResponseEntity<?> updateRepairStatus(@RequestBody UpdateRepairStatusRequestDTO request) {
        try {
            RepairTicketEntity ticket = repairTicketService.updateRepairStatus(request);
            return ResponseEntity.ok(ticket);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/getRepairStatusHistory/{ticketNumber}")
    public ResponseEntity<List<RepairStatusHistoryResponseDTO>> getRepairStatusHistory(@PathVariable String ticketNumber) {
        try {
            List<RepairStatusHistoryResponseDTO> history = repairTicketService.getRepairStatusHistory(ticketNumber);
            return ResponseEntity.ok(history);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}