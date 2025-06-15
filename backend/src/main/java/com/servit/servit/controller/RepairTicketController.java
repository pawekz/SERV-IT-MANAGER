package com.servit.servit.controller;

import com.servit.servit.dto.*;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.service.ConfigurationService;
import com.servit.servit.service.RepairTicketService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/repairTicket")
public class RepairTicketController {

    @Autowired
    private final RepairTicketService repairTicketService;

    @Autowired
    private ConfigurationService configurationService;

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
            return ResponseEntity.status(HttpStatus.OK).body(ticket);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/generateRepairTicketNumber")
    public ResponseEntity<String> generateRepairTicketNumber() {
        try {
            String ticketNumber = repairTicketService.generateRepairTicketNumber();
            return ResponseEntity.status(HttpStatus.OK).body(ticketNumber);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to generate ticket number");
        }
    }

    @PatchMapping("/uploadRepairTicketPdf/{ticketNumber}")
    public ResponseEntity<Void> uploadRepairTicketPdf(@PathVariable String ticketNumber,
                                                      @RequestParam("file") MultipartFile file) {
        try {
            repairTicketService.uploadRepairTicketPdf(ticketNumber, file);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Search and fetch a paginated tickets list (ADMIN SIDE)
    // Note: Ticket History, Ticket List, etc. etc.
    @GetMapping("/searchRepairTickets")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> searchRepairTickets(
            @RequestParam String searchTerm,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            Page<GetRepairTicketResponseDTO> repairTickets = repairTicketService.searchRepairTickets(searchTerm, pageable);
            if (repairTickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.status(HttpStatus.OK).body(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Search and fetch paginated ticket list by customer email, displaying all tickets related to the associated user via email
    // Note: User's Ticket List, User's Ticket History, etc. etc.
    @GetMapping("/searchRepairTicketsByEmail")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> searchRepairTicketsByEmail(
            @RequestParam String email,
            @RequestParam String searchTerm,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            Page<GetRepairTicketResponseDTO> repairTickets = repairTicketService.searchRepairTicketsByEmail(email, searchTerm, pageable);
            if (repairTickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.status(HttpStatus.OK).body(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // OPTIONAL ra ni, mas preferred ang search sa taas for Tickets List and History
    // This endpoint fetches all repair tickets, regardless of the user (ADMIN SIDE)
    // NOT PAGEABLE
    @GetMapping("/getAllRepairTickets")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getAllRepairTickets() {
        List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getAllRepairTickets();
        return repairTickets.isEmpty()
                ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                : ResponseEntity.status(HttpStatus.OK).body(repairTickets);
    }

    // OPTIONAL ra ni, mas preferred ang search sa taas for Tickets List and History
    // This endpoint fetches all repair tickets associated with a specific customer email
    // NOT PAGEABLE
    @GetMapping("/getRepairTicketsByCustomerEmail")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getRepairTicketsByCustomerEmail(@RequestParam String email) {
        try {
            List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getRepairTicketsByCustomerEmail(email);
            return repairTickets.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                    : ResponseEntity.status(HttpStatus.OK).body(repairTickets);
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

    @GetMapping("/getRepairTicketPdf/{ticketNumber}")
    public ResponseEntity<byte[]> getRepairTicketPdf(@PathVariable String ticketNumber) {
        try {
            RepairTicketPdfResponseDTO pdfResponse = repairTicketService.getRepairTicketPdf(ticketNumber);
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

    @GetMapping("/getActiveRepairTickets")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> getActiveRepairTickets(
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            Page<GetRepairTicketResponseDTO> activeTickets = repairTicketService.getActiveRepairTickets(pageable);
            if (activeTickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.status(HttpStatus.OK).body(activeTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/files/{type}/{filename:.+}")
    public ResponseEntity<Resource> getTicketFile(@PathVariable String type, @PathVariable String filename) {
        try {
            // Path traversal protection
            if (type.contains("..") || filename.contains("..")) {
                return ResponseEntity.badRequest().build();
            }
            String basePath = configurationService.getTicketFilesBasePath();
            // Split type by '/' to support nested folders
            Path file = Paths.get(basePath, type.split("/"));
            file = file.resolve(filename);
            org.slf4j.LoggerFactory.getLogger(getClass()).info("Serving ticket file: {}", file);
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            String contentDisposition = "inline; filename=\"" + filename + "\"";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .body(resource);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(getClass()).error("Error serving ticket file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/ticketfiles/directory")
    public ResponseEntity<Map<String, String>> getTicketFilesDirectory() {
        String path = configurationService.getTicketFilesBasePath();
        return ResponseEntity.ok(Map.of("path", path));
    }

    @PostMapping("/ticketfiles/directory")
    public ResponseEntity<?> setTicketFilesDirectory(@RequestBody Map<String, String> payload) {
        String newPath = payload.get("path");
        if (newPath == null || newPath.isBlank()) {
            return ResponseEntity.badRequest().body("Path is required");
        }
        configurationService.setTicketFilesBasePath(newPath);
        return ResponseEntity.ok(Map.of("path", newPath));
    }
}