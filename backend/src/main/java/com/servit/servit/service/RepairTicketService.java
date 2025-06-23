package com.servit.servit.service;

import com.servit.servit.dto.*;
import com.servit.servit.entity.*;
import com.servit.servit.enumeration.RepairStatusEnum;
import com.servit.servit.enumeration.RepairTicketDeviceType;
import com.servit.servit.repository.RepairTicketRepository;
import com.servit.servit.repository.RepairStatusHistoryRepository;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.util.FileUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;

@Service
public class RepairTicketService {

    @Autowired
    private final RepairTicketRepository repairTicketRepository;

    @Autowired
    private RepairStatusHistoryRepository repairStatusHistoryRepository;

    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private FileUtil fileUtil;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final Logger logger = LoggerFactory.getLogger(RepairTicketService.class);

    public RepairTicketService(RepairTicketRepository repairTicketRepository, UserRepository userRepository) {
        this.repairTicketRepository = repairTicketRepository;
        this.userRepository = userRepository;
    }

    public GetRepairTicketResponseDTO getRepairTicket(String ticketNumber) {
        logger.info("Fetching repair ticket with ticketNumber: {}", ticketNumber);
        try {
            RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                    .orElseThrow(() -> {
                        logger.error("Repair ticket not found: {}", ticketNumber);
                        return new EntityNotFoundException("Repair ticket not found");
                    });
            logger.info("Successfully fetched repair ticket: {}", ticketNumber);
            return mapToGetRepairTicketResponseDTO(repairTicket);
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            logger.error("Error fetching repair ticket: {}", ticketNumber, e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error fetching repair ticket: {}", ticketNumber, e);
            throw new RuntimeException("Failed to fetch repair ticket", e);
        }
    }

    public RepairTicketEntity checkInRepairTicket(CheckInRepairTicketRequestDTO req) {
        logger.info("Attempting to check in repair ticket: {}", req.getTicketNumber());

        try {
            if (repairTicketRepository.findByTicketNumber(req.getTicketNumber()).isPresent()) {
                logger.warn("A repair ticket with this ticket number already exists: {}", req.getTicketNumber());
                throw new IllegalArgumentException("A repair ticket with this ticket number already exists.");
            }
            if (req.getCustomerName() == null || req.getDeviceSerialNumber() == null) {
                logger.warn("Required fields are missing in the repair ticket form for ticket: {}", req.getTicketNumber());
                throw new IllegalArgumentException("Required fields are missing in the repair ticket form");
            }
            if (req.getRepairPhotos() != null && req.getRepairPhotos().size() > 3) {
                logger.warn("Too many repair photos uploaded for ticket: {}", req.getTicketNumber());
                throw new IllegalArgumentException("You can upload a maximum of 3 repair photos.");
            }

            UserEntity technician = userRepository.findByEmail(req.getTechnicianEmail())
                    .orElseThrow(() -> {
                        logger.warn("Technician not found: {}", req.getTechnicianEmail());
                        return new IllegalArgumentException("Technician not found");
                    });

            RepairTicketEntity repairTicket = new RepairTicketEntity();
            repairTicket.setCustomerName(req.getCustomerName());
            repairTicket.setCustomerEmail(req.getCustomerEmail());

            String rawPhone = req.getCustomerPhoneNumber().replaceAll("^\\+?63", "");
            repairTicket.setCustomerPhoneNumber("+63" + rawPhone);

            repairTicket.setDeviceSerialNumber(req.getDeviceSerialNumber());
            repairTicket.setDeviceModel(req.getDeviceModel());
            repairTicket.setDeviceBrand(req.getDeviceBrand());
            repairTicket.setDeviceColor(req.getDeviceColor());
            repairTicket.setDevicePassword(
                    req.getDevicePassword() == null || req.getDevicePassword().isEmpty() ? "N/A" : req.getDevicePassword()
            );
            repairTicket.setIsDeviceTampered(req.getIsDeviceTampered() != null && req.getIsDeviceTampered());
            repairTicket.setDeviceType(RepairTicketDeviceType.valueOf(req.getDeviceType().toUpperCase()));
            repairTicket.setReportedIssue(req.getReportedIssue());
            repairTicket.setTechnicianEmail(technician);
            repairTicket.setTechnicianName(technician.getFirstName() + " " + technician.getLastName());
            repairTicket.setAccessories(
                    req.getAccessories() == null || req.getAccessories().isEmpty() ? "N/A" : req.getAccessories()
            );
            repairTicket.setObservations(
                    req.getObservations() == null || req.getObservations().isEmpty() ? "N/A" : req.getObservations()
            );
            repairTicket.setStatus("CHECKED_IN");
            repairTicket.setRepairStatus(RepairStatusEnum.RECEIVED);
            repairTicket.setCheckInDate(LocalDateTime.now());
            repairTicket.setTicketNumber(req.getTicketNumber());

            AtomicInteger counter = new AtomicInteger(1);
            try {
                repairTicket.setRepairPhotos(req.getRepairPhotos().stream()
                        .map(photo -> {
                            try {
                                String photoPath = fileUtil.saveRepairPhoto(photo, repairTicket.getTicketNumber(), counter.getAndIncrement());
                                RepairPhotoEntity repairPhoto = new RepairPhotoEntity();
                                repairPhoto.setPhotoUrl(photoPath);
                                repairPhoto.setRepairTicket(repairTicket);
                                logger.info("Saved repair photo for ticket: {} at {}", repairTicket.getTicketNumber(), photoPath);
                                return repairPhoto;
                            } catch (IOException e) {
                                logger.error("Failed to save repair photo for ticket: {}", repairTicket.getTicketNumber(), e);
                                throw new RuntimeException("Failed to save repair photo. Please retry.", e);
                            }
                        })
                        .collect(Collectors.toList()));
            } catch (Exception e) {
                logger.error("Error processing repair photos for ticket: {}", repairTicket.getTicketNumber(), e);
                throw e;
            }

            logger.info("Successfully created repair ticket: {}", repairTicket.getTicketNumber());

            RepairTicketEntity savedTicket = repairTicketRepository.save(repairTicket);

            // Add initial status history entry for RECEIVED
            try {
                RepairStatusHistoryEntity initHistory = new RepairStatusHistoryEntity();
                initHistory.setRepairTicket(savedTicket);
                initHistory.setRepairStatusEnum(RepairStatusEnum.RECEIVED);
                repairStatusHistoryRepository.save(initHistory);
            } catch (Exception e) {
                logger.error("Failed to save initial status history for ticket: {}", repairTicket.getTicketNumber(), e);
                // continue without blocking the ticket creation
            }

            return savedTicket;
        } catch (IllegalArgumentException e) {
            logger.error("Validation error during check-in for ticket: {}", req.getTicketNumber(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during check-in for ticket: {}", req.getTicketNumber(), e);
            throw new RuntimeException("Failed to check in repair ticket", e);
        }
    }

    public String generateRepairTicketNumber() {
        logger.info("Generating new repair ticket number.");
        String lastTicketNumber = repairTicketRepository.findLastTicketNumber();
        int nextId = 1;

        if (lastTicketNumber != null && lastTicketNumber.startsWith("IORT-")) {
            try {
                String numericPart = lastTicketNumber.substring(5);
                nextId = Integer.parseInt(numericPart) + 1;
                logger.info("Last ticket number found: {}. Next ticket number will be: IORT-{}", lastTicketNumber, String.format("%06d", nextId));
            } catch (NumberFormatException e) {
                logger.error("Failed to parse numeric part of last ticket number: {}", lastTicketNumber, e);
                throw new RuntimeException("Invalid last ticket number format: " + lastTicketNumber, e);
            }
        } else {
            logger.info("No previous ticket number found. Starting from IORT-000001.");
        }

        String newTicketNumber = "IORT-" + String.format("%06d", nextId);
        logger.info("Generated new ticket number: {}", newTicketNumber);
        return newTicketNumber;
    }

    public void uploadRepairTicketPdf(String ticketNumber, MultipartFile file) {
        logger.info("Uploading document for repair ticket: {}", ticketNumber);

        try {
            if (file == null || file.isEmpty()) {
                logger.warn("Uploaded file is null or empty for ticket: {}", ticketNumber);
                throw new IllegalArgumentException("Uploaded file is null or empty. Please provide a valid file.");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.endsWith(".pdf")) {
                logger.warn("Invalid file type for ticket: {}. Only PDF files are allowed.", ticketNumber);
                throw new IllegalArgumentException("Invalid file type. Only PDF files are allowed.");
            }

            RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                    .orElseThrow(() -> {
                        logger.error("Repair ticket not found: {}", ticketNumber);
                        return new EntityNotFoundException("Repair ticket with ticket number " + ticketNumber + " not found.");
                    });

            String pdfPath;
            try {
                pdfPath = fileUtil.saveRepairTicketPdf(file, ticketNumber);
            } catch (IOException ioEx) {
                logger.error("IO error while saving PDF for ticket: {}", ticketNumber, ioEx);
                throw new RuntimeException("Failed to save PDF file. Please try again.", ioEx);
            }

            repairTicket.setDocumentPath(pdfPath);

            try {
                repairTicketRepository.save(repairTicket);
            } catch (Exception dbEx) {
                logger.error("Database error while saving repair ticket: {}", ticketNumber, dbEx);
                throw new RuntimeException("Failed to update repair ticket with document path.", dbEx);
            }

            try {
                emailService.sendRepairTicketPdfEmail(
                        repairTicket.getCustomerEmail(),
                        repairTicket.getTicketNumber(),
                        repairTicket.getCustomerName(),
                        pdfPath
                );
            } catch (Exception emailEx) {
                logger.error("Error sending email for repair ticket document: {}", ticketNumber, emailEx);
                throw new RuntimeException("Failed to send email.", emailEx);
            }

            logger.info("Successfully uploaded document for repair ticket: {}", ticketNumber);
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            logger.error("Validation error while uploading document for ticket: {}", ticketNumber, e);
            throw e;
        } catch (RuntimeException e) {
            logger.error("Runtime error while uploading document for ticket: {}", ticketNumber, e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error while uploading document for ticket: {}", ticketNumber, e);
            throw new RuntimeException("Failed to upload repair ticket document", e);
        }
    }
    //it will get the latest ticket number from the latest to the oldest
    public List<GetRepairTicketResponseDTO> getAllRepairTickets() {
        logger.info("Fetching all repair tickets.");
        try {
            List<GetRepairTicketResponseDTO> tickets = repairTicketRepository
                .findAll(Sort.by(Sort.Direction.DESC, "repairTicketId"))
                .stream()
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
            logger.info("Fetched {} repair tickets.", tickets.size());
            return tickets;
        } catch (Exception e) {
            logger.error("Error fetching all repair tickets.", e);
            throw new RuntimeException("Failed to fetch all repair tickets", e);
        }
    }

    public Page<GetRepairTicketResponseDTO> getAllRepairTicketsPaginated(Pageable pageable) {
        logger.info("Fetching paginated repair tickets.");
        try {
            // Create a new Pageable with the same pagination but with DESC sort
            Pageable pageableWithSort = PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                Sort.by(Sort.Direction.DESC, "repairTicketId")
            );
            
            Page<GetRepairTicketResponseDTO> tickets = repairTicketRepository
                .findAll(pageableWithSort)
                .map(this::mapToGetRepairTicketResponseDTO);
            logger.info("Fetched {} repair tickets (page {} of {}).", 
                tickets.getContent().size(), pageable.getPageNumber(), tickets.getTotalPages());
            return tickets;
        } catch (Exception e) {
            logger.error("Error fetching paginated repair tickets.", e);
            throw new RuntimeException("Failed to fetch paginated repair tickets", e);
        }
    }

    public List<GetRepairTicketResponseDTO> getRepairTicketsByCustomerEmail(String email) {
        logger.info("Fetching repair tickets for customer email: {}", email);
        try {
            List<GetRepairTicketResponseDTO> tickets = repairTicketRepository
                .findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "repairTicketId"))
                .stream()
                .filter(ticket -> email.equalsIgnoreCase(ticket.getCustomerEmail()))
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
            logger.info("Fetched {} repair tickets for customer email: {}", tickets.size(), email);
            return tickets;
        } catch (Exception e) {
            logger.error("Error fetching repair tickets for customer email: {}", email, e);
            throw new RuntimeException("Failed to fetch repair tickets by customer email", e);
        }
    }

    public Page<GetRepairTicketResponseDTO> searchRepairTickets(String searchTerm, Pageable pageable) {
        logger.info("Searching repair tickets with searchTerm: {}", searchTerm);
        try {
            Page<GetRepairTicketResponseDTO> result = repairTicketRepository.searchRepairTickets(searchTerm, pageable)
                    .map(this::mapToGetRepairTicketResponseDTO);
            logger.info("Found {} repair tickets for searchTerm: {}", result.getTotalElements(), searchTerm);
            return result;
        } catch (Exception e) {
            logger.error("Error searching repair tickets with searchTerm: {}", searchTerm, e);
            throw new RuntimeException("Failed to search repair tickets", e);
        }
    }

    public Page<GetRepairTicketResponseDTO> searchRepairTicketsByEmail(String email, String searchTerm, Pageable pageable) {
        logger.info("Searching repair tickets for email: {} with searchTerm: {}", email, searchTerm);
        try {
            Page<GetRepairTicketResponseDTO> result = repairTicketRepository.searchRepairTicketsByEmail(email, searchTerm, pageable)
                    .map(this::mapToGetRepairTicketResponseDTO);
            logger.info("Found {} repair tickets for email: {} and searchTerm: {}", result.getTotalElements(), email, searchTerm);
            return result;
        } catch (Exception e) {
            logger.error("Error searching repair tickets for email: {} with searchTerm: {}", email, searchTerm, e);
            throw new RuntimeException("Failed to search repair tickets by email", e);
        }
    }

    public byte[] getRepairTicketDocument(String ticketNumber) throws IOException {
        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new EntityNotFoundException("Repair ticket not found"));
        String documentPath = repairTicket.getDocumentPath();
        if (documentPath == null) {
            throw new EntityNotFoundException("No document uploaded for this ticket");
        }
        java.nio.file.Path path = java.nio.file.Paths.get(documentPath);
        return java.nio.file.Files.readAllBytes(path);
    }


    public RepairTicketEntity updateRepairStatus(UpdateRepairStatusRequestDTO request) {
        logger.info("Updating repair status for ticket: {}", request.getTicketNumber());
        if (request.getTicketNumber() == null || request.getTicketNumber().isEmpty()) {
            logger.warn("Ticket number is null or empty.");
            throw new IllegalArgumentException("Ticket number must not be null or empty.");
        }
        if (request.getRepairStatus() == null || request.getRepairStatus().isEmpty()) {
            logger.warn("Repair status is null or empty for ticket: {}", request.getTicketNumber());
            throw new IllegalArgumentException("Repair status must not be null or empty.");
        }

        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(request.getTicketNumber())
                .orElseThrow(() -> {
                    logger.error("Repair ticket not found: {}", request.getTicketNumber());
                    return new EntityNotFoundException("Repair ticket not found");
                });

        RepairStatusEnum newStatus;

        try {
            newStatus = RepairStatusEnum.valueOf(request.getRepairStatus());
        } catch (IllegalArgumentException ex) {
            logger.error("Invalid repair status: {}", request.getRepairStatus(), ex);
            throw new IllegalArgumentException("Invalid repair status: " + request.getRepairStatus(), ex);
        }

        repairTicket.setRepairStatus(newStatus);

        RepairStatusHistoryEntity statusHistory = new RepairStatusHistoryEntity();
        statusHistory.setRepairTicket(repairTicket);
        statusHistory.setRepairStatusEnum(newStatus);

        repairTicket.getRepairStatusHistory().add(statusHistory);

        // Compose notification
        NotificationDTO notification = new NotificationDTO();
        notification.setTicketNumber(repairTicket.getTicketNumber());
        notification.setStatus(newStatus.name());
        notification.setRecipientEmail(repairTicket.getCustomerEmail());
        notification.setMessage("Your repair ticket " + repairTicket.getTicketNumber() +
                " status changed to: " + newStatus.name());

        notificationService.sendNotification(notification);

        // Save the updated repair ticket
        RepairTicketEntity savedTicket = repairTicketRepository.save(repairTicket);

        // Broadcast repair ticket update to all connected clients via WebSocket
        try {
            // Create a simplified DTO for WebSocket broadcast
            Map<String, Object> broadcastUpdate = Map.of(
                "ticketNumber", repairTicket.getTicketNumber(),
                "newStatus", newStatus.name(),
                "customerEmail", repairTicket.getCustomerEmail(),
                "updatedAt", LocalDateTime.now().toString(),
                "message", "Repair ticket " + repairTicket.getTicketNumber() + " status updated to " + newStatus.name()
            );
            
            // Broadcast to general repair tickets topic
            messagingTemplate.convertAndSend("/topic/repair-tickets", broadcastUpdate);
            
            // Also broadcast to technician-specific topic for real-time updates
            messagingTemplate.convertAndSend("/topic/technician-updates", broadcastUpdate);
            
            logger.info("Broadcasted repair ticket update for ticket: {}", repairTicket.getTicketNumber());
        } catch (Exception e) {
            logger.error("Failed to broadcast repair ticket update: {}", e.getMessage(), e);
            // Don't throw exception here as the main operation succeeded
        }

        logger.info("Repair status updated to {} for ticket: {}", newStatus, request.getTicketNumber());
        return savedTicket;
    }

    public List<RepairStatusHistoryResponseDTO> getRepairStatusHistory(String ticketNumber) {
        logger.info("Fetching repair status history for ticket: {}", ticketNumber);
        if (ticketNumber == null || ticketNumber.isEmpty()) {
            logger.warn("Ticket number is null or empty.");
            throw new IllegalArgumentException("Ticket number must not be null or empty.");
        }

        List<RepairStatusHistoryEntity> history = repairStatusHistoryRepository
                .findByRepairTicketTicketNumberOrderByTimestampDesc(ticketNumber);

        if (history == null || history.isEmpty()) {
            logger.warn("No repair status history found for ticket: {}", ticketNumber);
            throw new jakarta.persistence.EntityNotFoundException("No repair status history found for ticket: " + ticketNumber);
        }

        logger.info("Found {} status history records for ticket: {}", history.size(), ticketNumber);
        return history.stream()
                .map(this::mapToStatusHistoryResponseDTO)
                .collect(Collectors.toList());
    }

    public Page<GetRepairTicketResponseDTO> getActiveRepairTickets(Pageable pageable) {
        logger.info("Fetching active repair tickets");
        try {
            Page<GetRepairTicketResponseDTO> activeTickets = repairTicketRepository.findActiveRepairTickets(pageable)
                    .map(this::mapToGetRepairTicketResponseDTO);
            logger.info("Found {} active repair tickets", activeTickets.getTotalElements());
            return activeTickets;
        } catch (Exception e) {
            logger.error("Error fetching active repair tickets", e);
            throw new RuntimeException("Failed to fetch active repair tickets", e);
        }
    }

    private RepairStatusHistoryResponseDTO mapToStatusHistoryResponseDTO(RepairStatusHistoryEntity entity) {
        if (entity == null) {
            logger.error("RepairStatusHistoryEntity is null.");
            throw new IllegalArgumentException("RepairStatusHistoryEntity must not be null.");
        }
        RepairStatusHistoryResponseDTO dto = new RepairStatusHistoryResponseDTO();
        dto.setRepairStatus(entity.getRepairStatusEnum() != null ? entity.getRepairStatusEnum().name() : null);
        dto.setUpdatedBy(entity.getRepairTicket() != null ? entity.getRepairTicket().getTechnicianName() : null);
        dto.setTimestamp(entity.getTimestamp());
        return dto;
    }

    public RepairTicketPdfResponseDTO getRepairTicketPdf(String ticketNumber) throws IOException {
        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new EntityNotFoundException("Repair ticket not found"));
        String documentPath = repairTicket.getDocumentPath();
        if (documentPath == null) {
            throw new EntityNotFoundException("No document uploaded for this ticket");
        }
        java.nio.file.Path path = java.nio.file.Paths.get(documentPath);
        byte[] fileBytes = java.nio.file.Files.readAllBytes(path);
        String fileName = path.getFileName().toString();
        return new RepairTicketPdfResponseDTO(fileBytes, fileName);
    }

    public List<GetRepairTicketResponseDTO> getRepairTicketsByStatus(String status) {
        RepairStatusEnum repairStatus = RepairStatusEnum.valueOf(status);
        return repairTicketRepository.findByRepairStatus(repairStatus)
                .stream()
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
    }

    public Page<GetRepairTicketResponseDTO> getRepairTicketsByStatusPageable(String status, Pageable pageable) {
        RepairStatusEnum repairStatus = RepairStatusEnum.valueOf(status);
        Pageable pageableWithSort = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            Sort.by(Sort.Direction.DESC, "repairTicketId")
        );
        return repairTicketRepository.findByRepairStatus(repairStatus, pageableWithSort)
                .map(this::mapToGetRepairTicketResponseDTO);
    }

    public Page<GetRepairTicketResponseDTO> getRepairTicketsByStatusPageableAssignedToTech(String status, String email, Pageable pageable) {
        RepairStatusEnum repairStatus = RepairStatusEnum.valueOf(status);
        Pageable pageableWithSort = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            Sort.by(Sort.Direction.DESC, "repairTicketId")
        );
        return repairTicketRepository.findByRepairStatusAndTechnicianEmail_Email(repairStatus, email, pageableWithSort)
                .map(this::mapToGetRepairTicketResponseDTO);
    }

    private GetRepairTicketResponseDTO mapToGetRepairTicketResponseDTO(RepairTicketEntity repairTicket) {
        GetRepairTicketResponseDTO dto = new GetRepairTicketResponseDTO();
        dto.setTicketNumber(repairTicket.getTicketNumber());
        dto.setCustomerName(repairTicket.getCustomerName());
        dto.setCustomerEmail(repairTicket.getCustomerEmail());
        dto.setCustomerPhoneNumber(repairTicket.getCustomerPhoneNumber());
        dto.setDeviceType(repairTicket.getDeviceType() != null ? repairTicket.getDeviceType().name() : null);
        dto.setDeviceColor(repairTicket.getDeviceColor());
        dto.setDeviceSerialNumber(repairTicket.getDeviceSerialNumber());
        dto.setDeviceModel(repairTicket.getDeviceModel());
        dto.setDeviceBrand(repairTicket.getDeviceBrand());
        dto.setDevicePassword(repairTicket.getDevicePassword());
        dto.setTechnicianEmail(repairTicket.getTechnicianEmail().getEmail());
        dto.setTechnicianName(repairTicket.getTechnicianName());
        dto.setAccessories(repairTicket.getAccessories());
        dto.setObservations(repairTicket.getObservations());
        dto.setReportedIssue(repairTicket.getReportedIssue());
        dto.setRepairStatus(repairTicket.getRepairStatus().name());
        /*dto.setStatus(repairTicket.getStatus());*/
        dto.setCheckInDate(LocalDate.from(repairTicket.getCheckInDate()));
        dto.setRepairPhotosUrls(repairTicket.getRepairPhotos().stream()
                .map(RepairPhotoEntity::getPhotoUrl)
                .collect(Collectors.toList()));
        return dto;
    }
}

