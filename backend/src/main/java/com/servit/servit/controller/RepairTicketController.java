package com.servit.servit.controller;

import com.servit.servit.dto.repairticket.*;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.service.ConfigurationService;
import com.servit.servit.service.RepairTicketService;
import com.servit.servit.service.S3Service;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import com.servit.servit.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/repairTicket")
public class RepairTicketController {

    private static final Logger logger = LoggerFactory.getLogger(RepairTicketController.class);

    @Autowired
    private final RepairTicketService repairTicketService;

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private com.servit.servit.repository.UserRepository userRepository;

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

    @GetMapping("/searchRepairTickets")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> searchRepairTickets(
            @RequestParam String searchTerm,
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication,
            HttpServletRequest request) {

        String role = authentication.getAuthorities().iterator().next().getAuthority();

        String email = authentication.getName();
        try {
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                String jwt = authorizationHeader.substring(7);
                String extractedEmail = jwtUtil.extractAllClaims(jwt).get("email", String.class);
                // Only use the extracted email if it looks like a real email address (contains '@')
                if (extractedEmail != null && extractedEmail.contains("@")) {
                    email = extractedEmail.trim();
                } else if (extractedEmail != null && !extractedEmail.isBlank()) {
                    // If the token contains a username-like value (without '@'), try to map it via user repository to a real email.
                    String resolved = userRepository.findByUsername(extractedEmail).map(u -> u.getEmail()).orElse(extractedEmail);
                    if (resolved != null && resolved.contains("@")) {
                        email = resolved.trim();
                        logger.debug("Mapped username '{}' from JWT to email '{}'", extractedEmail, email);
                    } else {
                        logger.debug("JWT 'email' claim looks like a username '{}' and could not be resolved to an email; using authentication.getName() ('{}') instead.", extractedEmail, email);
                    }
                }
            }
        } catch (Exception ex) {
            logger.warn("Failed to extract email from JWT for searchRepairTickets; falling back to authentication.getName(): {}", ex.getMessage());
        }

        if (email != null && !email.contains("@")) {
            String resolvedByUsername = userRepository.findByUsername(email).map(u -> u.getEmail()).orElse(email);
            if (resolvedByUsername != null && resolvedByUsername.contains("@")) {
                logger.debug("Resolved authentication name '{}' to email '{}' via UserRepository", email, resolvedByUsername);
                email = resolvedByUsername;
            } else {
                logger.debug("Could not resolve '{}' to an email; proceeding with '{}'. If this is a username, tickets may not be found.", email, email);
            }
        }

        logger.debug("searchRepairTickets invoked by role='{}' using email='{}' and rawSearchTerm='{}'", role, email, searchTerm);

        String term = (searchTerm == null) ? "" : searchTerm.trim();

        if (role.equals("ROLE_CUSTOMER")) {
            return ResponseEntity.ok(
                repairTicketService.searchRepairTicketsByCustomerEmail(email, term, pageable)
            );
        } else if (role.equals("ROLE_TECHNICIAN")) {
            return ResponseEntity.ok(
                repairTicketService.searchRepairTicketsByTechnicianEmail(email, term, pageable)
            );
        } else {
            return ResponseEntity.ok(
                repairTicketService.searchRepairTickets(term, pageable)
            );
        }
    }

    @GetMapping("/getAllRepairTickets")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> getAllRepairTickets(
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            Page<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getAllRepairTickets(pageable);
            if (repairTickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.status(HttpStatus.OK).body(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getAllRepairTicketsByCustomer")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getAllRepairTicketsByCustomer(@RequestParam String email) {
        try {
            List<GetRepairTicketResponseDTO> repairTickets = repairTicketService.getAllRepairTicketsByCustomer(email);
            return repairTickets.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                    : ResponseEntity.status(HttpStatus.OK).body(repairTickets);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

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
            UpdateRepairStatusResponseDTO response = new UpdateRepairStatusResponseDTO(
                ticket.getTicketNumber(),
                ticket.getRepairStatus().name(),
                "Ticket " + ticket.getTicketNumber() + " status updated to " + ticket.getRepairStatus().name()
            );
            return ResponseEntity.ok(response);
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

    // this is the new endpoint for getting the files, the old one is still working (possible bug due to capturing only the first part of the path)
    @GetMapping("/files/{category}/{subfolder}/{filename:.+}")
    public ResponseEntity<Resource> getTicketFileV2(@PathVariable String category,
                                                    @PathVariable String subfolder,
                                                    @PathVariable String filename) {
        try {
            String basePath = configurationService.getTicketFilesBasePath();
            Path filePath = Paths.get(basePath, category, subfolder, filename);
            System.out.println("DEBUG: [V2] Full file path: " + filePath);
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                System.out.println("DEBUG: [V2] File not found or not readable: " + filePath);
                return ResponseEntity.notFound().build();
            }
            String contentDisposition = "inline; filename=\"" + filename + "\"";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
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

    @GetMapping("/getRepairTicketsByStatus")
    public ResponseEntity<List<GetRepairTicketResponseDTO>> getRepairTicketsByStatus(@RequestParam String status) {
        try {
            List<GetRepairTicketResponseDTO> tickets = repairTicketService.getRepairTicketsByStatus(status);
            return tickets.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NO_CONTENT).build()
                    : ResponseEntity.ok(tickets);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getRepairTicketsByStatusPageable")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> getRepairTicketsByStatusPageable(
            @RequestParam String status,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            Page<GetRepairTicketResponseDTO> tickets = repairTicketService.getRepairTicketsByStatusPageable(status, pageable);
            if (tickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.ok(tickets);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/getRepairTicketsByStatusPageableAssignedToTech")
    public ResponseEntity<Page<GetRepairTicketResponseDTO>> getRepairTicketsByStatusPageableAssignedToTech(
            @RequestParam String status,
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest request) {
        try {
            // Extract JWT token from Authorization header
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                logger.warn("Missing or invalid Authorization header for getRepairTicketsByStatusPageableAssignedToTech");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            String jwt = authorizationHeader.substring(7);

            // Extract email claim from JWT token (prefer full email). If token only contains username, try to resolve to full email via UserRepository.
            String email;
            try {
                String extracted = jwtUtil.extractAllClaims(jwt).get("email", String.class);
                if (extracted != null && extracted.contains("@")) {
                    email = extracted.trim();
                } else if (extracted != null && !extracted.isBlank()) {
                    // extracted looks like a username; try to resolve to email
                    email = userRepository.findByUsername(extracted)
                            .map(u -> u.getEmail())
                            .orElse(extracted);
                    logger.debug("Resolved username '{}' to email '{}' for technician query", extracted, email);
                } else {
                    logger.error("JWT did not contain an email claim when fetching tickets by status. JWT: {}", jwt);
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }
            } catch (Exception e) {
                logger.error("Failed to extract/resolve email claim from JWT when fetching tickets by status. JWT: {}", jwt, e);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            logger.debug("Fetching tickets for status '{}' assigned to technician '{}'. Page: {}, Size: {}", status, email, pageable.getPageNumber(), pageable.getPageSize());

            Page<GetRepairTicketResponseDTO> tickets = repairTicketService.getRepairTicketsByStatusPageableAssignedToTech(status, email, pageable);
            if (tickets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }
            return ResponseEntity.ok(tickets);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/updateRepairStatusWithPhotos")
    public ResponseEntity<?> updateRepairStatusWithPhotos(@ModelAttribute UpdateRepairStatusWithPhotosRequestDTO request) {
        try {
            RepairTicketEntity ticket = repairTicketService.updateRepairStatusWithAfterPhotos(request);
            UpdateRepairStatusResponseDTO response = new UpdateRepairStatusResponseDTO(
                ticket.getTicketNumber(),
                ticket.getRepairStatus().name(),
                "Ticket " + ticket.getTicketNumber() + " status updated to " + ticket.getRepairStatus().name()
            );
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/getRepairPhotos")
    public ResponseEntity<String> getRepairPhotos(@RequestParam("photoUrl") String photoUrl) {
        try {
            String s3Key = photoUrl;
            int idx = photoUrl.indexOf(".amazonaws.com/");
            if (idx != -1) {
                s3Key = photoUrl.substring(idx + ".amazonaws.com/".length());
            }
            String presignedUrl = s3Service.generatePresignedUrl(s3Key, 10); // 10 minutes expiry
            return ResponseEntity.ok(presignedUrl);
        } catch (Exception e) {
            logger.error("Failed to generate presigned URL for repair photo: {}", photoUrl, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/getStatusDistribution")
    public ResponseEntity<RepairTicketStatusDistributionDTO> getStatusDistribution() {
        try {
            RepairTicketStatusDistributionDTO dto = repairTicketService.getStatusDistribution();
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to get repair ticket status distribution", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

