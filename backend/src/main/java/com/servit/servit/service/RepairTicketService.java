package com.servit.servit.service;

import com.servit.servit.dto.notification.NotificationDTO;
import com.servit.servit.dto.repairticket.*;
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

import com.servit.servit.dto.repairticket.UpdateRepairStatusWithPhotosRequestDTO;
import com.servit.servit.entity.AfterRepairPhotoEntity;
import com.servit.servit.repository.QuotationRepository;
import com.servit.servit.entity.QuotationEntity;

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

    @Autowired
    private QuotationService quotationService;

    @Autowired
    private QuotationRepository quotationRepository;

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
            // Validate required fields (first name & serial number at minimum)
            if (req.getCustomerFirstName() == null || req.getCustomerFirstName().isBlank() ||
                req.getDeviceSerialNumber() == null || req.getDeviceSerialNumber().isBlank()) {
                logger.warn("Required fields missing (first name / serial) for ticket: {}", req.getTicketNumber());
                throw new IllegalArgumentException("Required fields are missing in the repair ticket form");
            }
            if (req.getRepairPhotos() != null && req.getRepairPhotos().size() > 3) {
                logger.warn("Too many repair photos uploaded for ticket: {}", req.getTicketNumber());
                throw new IllegalArgumentException("You can upload a maximum of 3 repair photos.");
            }

            UserEntity technician = userRepository.findByEmail(req.getTechnicianEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Technician not found"));

            RepairTicketEntity repairTicket = new RepairTicketEntity();
            repairTicket.setCustomerFirstName(req.getCustomerFirstName().trim());
            if (req.getCustomerLastName() != null) {
                repairTicket.setCustomerLastName(req.getCustomerLastName().trim());
            }
            repairTicket.setCustomerEmail(req.getCustomerEmail());
            String rawPhone = req.getCustomerPhoneNumber().replaceAll("^\\+?63", "");
            repairTicket.setCustomerPhoneNumber("+63" + rawPhone);
            repairTicket.setDeviceSerialNumber(req.getDeviceSerialNumber());
            repairTicket.setDeviceModel(req.getDeviceModel());
            repairTicket.setDeviceBrand(req.getDeviceBrand());
            repairTicket.setDeviceColor(req.getDeviceColor());
            repairTicket.setDevicePassword((req.getDevicePassword()==null || req.getDevicePassword().isEmpty())?"N/A":req.getDevicePassword());
            repairTicket.setIsDeviceTampered(req.getIsDeviceTampered()!=null && req.getIsDeviceTampered());
            repairTicket.setDeviceType(RepairTicketDeviceType.valueOf(req.getDeviceType().toUpperCase()));
            repairTicket.setReportedIssue(req.getReportedIssue());
            repairTicket.setTechnicianEmail(technician);
            repairTicket.setTechnicianName(technician.getFirstName() + " " + technician.getLastName());
            repairTicket.setAccessories((req.getAccessories()==null || req.getAccessories().isEmpty())?"N/A":req.getAccessories());
            repairTicket.setObservations((req.getObservations()==null || req.getObservations().isEmpty())?"N/A":req.getObservations());
            repairTicket.setStatus("CHECKED_IN");
            repairTicket.setRepairStatus(RepairStatusEnum.RECEIVED);
            repairTicket.setCheckInDate(LocalDateTime.now());
            repairTicket.setTicketNumber(req.getTicketNumber());

            AtomicInteger counter = new AtomicInteger(1);
            if (req.getRepairPhotos() != null && !req.getRepairPhotos().isEmpty()) {
                List<RepairPhotoEntity> photoEntities = new java.util.ArrayList<>();
                for (MultipartFile photo : req.getRepairPhotos()) {
                    if (photo == null || photo.isEmpty()) {
                        logger.warn("Skipping null or empty photo for ticket: {}", req.getTicketNumber());
                        continue;
                    }
                    try {
                        if (photo.getSize() == 0) {
                            logger.warn("Skipping empty photo (size 0) for ticket: {}", req.getTicketNumber());
                            continue;
                        }
                        int photoIndex = counter.getAndIncrement();
                        String path = fileUtil.saveRepairPhoto(photo, repairTicket.getTicketNumber(), photoIndex);
                        RepairPhotoEntity rp = new RepairPhotoEntity();
                        rp.setPhotoUrl(path);
                        rp.setRepairTicket(repairTicket);
                        photoEntities.add(rp);
                        logger.info("Successfully saved repair photo {} for ticket: {}", photoIndex, req.getTicketNumber());
                    } catch (IllegalArgumentException e) {
                        logger.error("Invalid photo format for ticket {}: {}", req.getTicketNumber(), e.getMessage());
                        throw new IllegalArgumentException("Invalid photo format: " + e.getMessage(), e);
                    } catch (IOException e) {
                        logger.error("IO error saving repair photo for ticket {}: {}", req.getTicketNumber(), e.getMessage(), e);
                        throw new RuntimeException("Failed to save repair photo: " + e.getMessage(), e);
                    } catch (Exception e) {
                        logger.error("Unexpected error saving repair photo for ticket {}: {}", req.getTicketNumber(), e.getMessage(), e);
                        throw new RuntimeException("Failed to save repair photo: " + e.getMessage(), e);
                    }
                }
                if (photoEntities.isEmpty()) {
                    logger.warn("No valid photos were processed for ticket: {}", req.getTicketNumber());
                    throw new IllegalArgumentException("At least one valid repair photo is required");
                }
                repairTicket.setRepairPhotos(photoEntities);
            }

            RepairTicketEntity saved = repairTicketRepository.save(repairTicket);
            try {
                RepairStatusHistoryEntity initHistory = new RepairStatusHistoryEntity();
                initHistory.setRepairTicket(saved);
                initHistory.setRepairStatusEnum(RepairStatusEnum.RECEIVED);
                repairStatusHistoryRepository.save(initHistory);
            } catch (Exception ex) {
                logger.error("Failed to persist initial history for ticket {}", repairTicket.getTicketNumber(), ex);
            }
            return saved;
        } catch (IllegalArgumentException e) {
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
                String fullName = ((repairTicket.getCustomerFirstName()==null?"":repairTicket.getCustomerFirstName()) + " " + (repairTicket.getCustomerLastName()==null?"":repairTicket.getCustomerLastName())).trim();
                emailService.sendRepairTicketPdfEmail(
                        repairTicket.getCustomerEmail(),
                        repairTicket.getTicketNumber(),
                        fullName.isEmpty()?"Customer":fullName,
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

    public Page<GetRepairTicketResponseDTO> getAllRepairTickets(Pageable pageable) {
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

    public List<GetRepairTicketResponseDTO> getAllRepairTicketsByCustomer(String email) {
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

    public Page<GetRepairTicketResponseDTO> getAllRepairTicketsByCustomer(String email, Pageable pageable) {
        logger.info("Fetching paginated repair tickets for customer email: {}", email);
        try {
            Pageable pageableWithSort = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "repairTicketId")
            );
            Page<GetRepairTicketResponseDTO> tickets = repairTicketRepository.findByCustomerEmail(email, pageableWithSort)
                    .map(this::mapToGetRepairTicketResponseDTO);
            logger.info("Fetched {} repair tickets for customer email: {} (page {} of {})", tickets.getContent().size(), email, pageable.getPageNumber(), tickets.getTotalPages());
            return tickets;
        } catch (Exception e) {
            logger.error("Error fetching paginated repair tickets for customer email: {}", email, e);
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

    public Page<GetRepairTicketResponseDTO> searchRepairTicketsByCustomerEmail(String email, String searchTerm, Pageable pageable) {
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

    public Page<GetRepairTicketResponseDTO> searchRepairTicketsByTechnicianEmail(String email, String searchTerm, Pageable pageable) {
        logger.info("Searching repair tickets assigned to technician: {} with searchTerm: {}", email, searchTerm);
        try {
            Page<GetRepairTicketResponseDTO> result = repairTicketRepository.searchRepairTicketsByTechnicianEmail(email, searchTerm, pageable)
                    .map(this::mapToGetRepairTicketResponseDTO);
            logger.info("Found {} repair tickets for technician email: {} and searchTerm: {}", result.getTotalElements(), email, searchTerm);
            return result;
        } catch (Exception e) {
            logger.error("Error searching repair tickets for technician email: {} with searchTerm: {}", email, searchTerm, e);
            throw new RuntimeException("Failed to search repair tickets by technician email", e);
        }
    }

    public byte[] getRepairTicketDocument(String ticketNumber) throws IOException {
        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new EntityNotFoundException("Repair ticket not found"));
        String documentPath = repairTicket.getDocumentPath();
        if (documentPath == null) {
            throw new EntityNotFoundException("No document uploaded for this ticket");
        }
        // If documentPath is an S3 URL, extract the key
        String s3Key = extractS3KeyFromUrl(documentPath);
        com.amazonaws.services.s3.model.S3Object s3Object = fileUtil.downloadFileFromS3(s3Key);
        try (java.io.InputStream is = s3Object.getObjectContent()) {
            return is.readAllBytes();
        }
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

        RepairStatusEnum previousStatus = repairTicket.getRepairStatus();
        RepairStatusEnum newStatus;

        try {
            newStatus = RepairStatusEnum.valueOf(request.getRepairStatus());
        } catch (IllegalArgumentException ex) {
            logger.error("Invalid repair status: {}", request.getRepairStatus(), ex);
            throw new IllegalArgumentException("Invalid repair status: " + request.getRepairStatus(), ex);
        }

        if (newStatus == RepairStatusEnum.REPAIRING) {
            boolean approved = quotationService.hasApprovedSelection(request.getTicketNumber());
            if (!approved) {
                logger.warn("Attempted to move ticket {} to REPAIRING without an approved or overridden quotation", request.getTicketNumber());
                throw new IllegalArgumentException("Cannot move ticket to REPAIRING until the quotation is approved or overridden with a selected part.");
            }
        }

        if (request.getObservations() != null) {
            String trimmed = request.getObservations().trim();
            if (!trimmed.isEmpty()) {
                repairTicket.setObservations(trimmed);
            }
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
                " status changed to: " + formatStatusName(newStatus.name()));

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

        if (previousStatus != newStatus && newStatus == RepairStatusEnum.AWAITING_PARTS) {
            try {
                quotationService.publishAwaitingApprovalEmail(request.getTicketNumber());
            } catch (IllegalArgumentException ex) {
                logger.info("Skipping awaiting-parts notification for ticket {}: {}", request.getTicketNumber(), ex.getMessage());
            }
        }

        if (newStatus.ordinal() >= RepairStatusEnum.REPAIRING.ordinal()) {
            quotationService.sendApprovalSummaryIfNeeded(request.getTicketNumber());
        }

        logger.info("Repair status updated to {} for ticket: {}", newStatus, request.getTicketNumber());
        return savedTicket;
    }

    public RepairTicketEntity updateRepairStatusWithAfterPhotos(UpdateRepairStatusWithPhotosRequestDTO request) {
        logger.info("Updating repair status with after-repair photos for ticket: {}", request.getTicketNumber());

        if (request.getTicketNumber() == null || request.getTicketNumber().isEmpty()) {
            logger.warn("Ticket number is null or empty.");
            throw new IllegalArgumentException("Ticket number must not be null or empty.");
        }
        if (request.getRepairStatus() == null || request.getRepairStatus().isEmpty()) {
            logger.warn("Repair status is null or empty for ticket: {}", request.getTicketNumber());
            throw new IllegalArgumentException("Repair status must not be null or empty.");
        }

        // Ensure the target status is READY_FOR_PICKUP as per business rule
        if (!"READY_FOR_PICKUP".equalsIgnoreCase(request.getRepairStatus())) {
            logger.warn("Invalid target status '{}' for after-repair photo upload. Only READY_FOR_PICKUP is supported.", request.getRepairStatus());
            throw new IllegalArgumentException("After-repair photos can only be uploaded when setting status to READY_FOR_PICKUP.");
        }

        List<MultipartFile> photos = request.getAfterRepairPhotos();
        if (photos == null || photos.isEmpty()) {
            logger.warn("No after-repair photos provided for ticket: {}", request.getTicketNumber());
            throw new IllegalArgumentException("At least one after-repair photo is required.");
        }
        if (photos.size() > 3) {
            logger.warn("Too many after-repair photos ({} provided) for ticket: {}", photos.size(), request.getTicketNumber());
            throw new IllegalArgumentException("You can upload a maximum of 3 after-repair photos.");
        }

        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(request.getTicketNumber())
                .orElseThrow(() -> {
                    logger.error("Repair ticket not found: {}", request.getTicketNumber());
                    return new EntityNotFoundException("Repair ticket not found");
                });

        // Save photos
        AtomicInteger counter = new AtomicInteger(1);
        List<AfterRepairPhotoEntity> afterPhotos = photos.stream().map(photo -> {
            try {
                String photoPath = fileUtil.saveAfterRepairPhoto(photo, repairTicket.getTicketNumber(), counter.getAndIncrement());
                AfterRepairPhotoEntity entity = new AfterRepairPhotoEntity();
                entity.setPhotoUrl(photoPath);
                entity.setRepairTicket(repairTicket);
                return entity;
            } catch (IOException e) {
                logger.error("Failed to save after-repair photo for ticket: {}", repairTicket.getTicketNumber(), e);
                throw new RuntimeException("Failed to save after-repair photo. Please retry.", e);
            }
        }).collect(Collectors.toList());

        // Attach to ticket
        if (repairTicket.getAfterRepairPhotos() != null) {
            repairTicket.getAfterRepairPhotos().clear();
            repairTicket.getAfterRepairPhotos().addAll(afterPhotos);
        } else {
            repairTicket.setAfterRepairPhotos(afterPhotos);
        }

        // Persist ticket with new photos
        repairTicketRepository.save(repairTicket);

        // Update status and history using existing logic
        UpdateRepairStatusRequestDTO bareDto = new UpdateRepairStatusRequestDTO();
        bareDto.setTicketNumber(request.getTicketNumber());
        bareDto.setRepairStatus(request.getRepairStatus());
        // We reuse the existing method to handle notification, broadcast, etc.
        RepairTicketEntity updatedTicket = updateRepairStatus(bareDto);

        return updatedTicket;
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
        dto.setCustomerFirstName(repairTicket.getCustomerFirstName());
        dto.setCustomerLastName(repairTicket.getCustomerLastName());
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
        dto.setCheckInDate(LocalDate.from(repairTicket.getCheckInDate()));
        dto.setRepairPhotosUrls(repairTicket.getRepairPhotos().stream()
                .map(RepairPhotoEntity::getPhotoUrl)
                .collect(Collectors.toList()));
        dto.setAfterRepairPhotosUrls(repairTicket.getAfterRepairPhotos() != null ? repairTicket.getAfterRepairPhotos().stream()
                .map(AfterRepairPhotoEntity::getPhotoUrl)
                .collect(Collectors.toList()) : null);
        dto.setRepairTicketId(repairTicket.getRepairTicketId());
        return dto;
    }

    private String extractS3KeyFromUrl(String s3Url) {
        // Example: https://servit-bucket.s3.ap-southeast-2.amazonaws.com/documents/claim_forms/IORT-000001-repair-ticket-2025-05-28.pdf
        int idx = s3Url.indexOf(".amazonaws.com/");
        if (idx == -1) return s3Url; // fallback: assume it's already a key
        return s3Url.substring(idx + ".amazonaws.com/".length());
    }

    public RepairTicketStatusDistributionDTO getStatusDistribution() {
        List<Object[]> results = repairTicketRepository.countTicketsByStatus();
        int totalTickets = 0;
        Map<RepairStatusEnum, Integer> statusCountMap = new java.util.EnumMap<>(RepairStatusEnum.class);
        for (Object[] row : results) {
            RepairStatusEnum status = (RepairStatusEnum) row[0];
            int count = ((Number) row[1]).intValue();
            statusCountMap.put(status, count);
            totalTickets += count;
        }
        List<RepairTicketStatusDistributionDTO.StatusCountDTO> statusCounts = new java.util.ArrayList<>();
        for (RepairStatusEnum status : RepairStatusEnum.values()) {
            int count = statusCountMap.getOrDefault(status, 0);
            double percentage = totalTickets > 0 ? (count * 100.0) / totalTickets : 0.0;
            statusCounts.add(new RepairTicketStatusDistributionDTO.StatusCountDTO(status.name(), count, percentage));
        }
        return new RepairTicketStatusDistributionDTO(statusCounts, totalTickets);
    }

    public Page<RecentUpdateDTO> getRecentUpdatesForCustomer(String email, Pageable pageable) {
        logger.info("Fetching recent updates for customer: {}", email);
        try {
            List<RecentUpdateDTO> allUpdates = new java.util.ArrayList<>();

            // 1. Get ticket creation events
            List<RepairTicketEntity> customerTickets = repairTicketRepository.findByCustomerEmail(email);
            for (RepairTicketEntity ticket : customerTickets) {
                if (ticket.getCheckInDate() != null) {
                    RecentUpdateDTO update = new RecentUpdateDTO();
                    update.setEventType("TICKET_CREATED");
                    update.setTicketNumber(ticket.getTicketNumber());
                    update.setMessage("Ticket created");
                    update.setTimestamp(ticket.getCheckInDate());
                    update.setStatus(ticket.getRepairStatus() != null ? ticket.getRepairStatus().name() : null);
                    update.setUpdatedBy(ticket.getTechnicianName());
                    allUpdates.add(update);
                }
            }

            // 2. Get status change events
            List<RepairStatusHistoryEntity> statusHistory = repairStatusHistoryRepository
                    .findByRepairTicketCustomerEmailOrderByTimestampDesc(email);
            for (RepairStatusHistoryEntity history : statusHistory) {
                RecentUpdateDTO update = new RecentUpdateDTO();
                update.setEventType("STATUS_CHANGED");
                update.setTicketNumber(history.getRepairTicket().getTicketNumber());
                String statusName = history.getRepairStatusEnum() != null ? history.getRepairStatusEnum().name() : "";
                String message = getStatusChangeMessage(statusName);
                update.setMessage(message);
                update.setTimestamp(history.getTimestamp());
                update.setStatus(statusName);
                update.setUpdatedBy(history.getRepairTicket().getTechnicianName());
                allUpdates.add(update);
            }

            // 3. Get quotation events
            for (RepairTicketEntity ticket : customerTickets) {
                List<QuotationEntity> quotations = quotationRepository.findByRepairTicketNumber(ticket.getTicketNumber());
                for (QuotationEntity quotation : quotations) {
                    RecentUpdateDTO update = new RecentUpdateDTO();
                    update.setTicketNumber(ticket.getTicketNumber());
                    LocalDateTime quoteTimestamp = quotation.getCreatedAt();
                    
                    if ("APPROVED".equalsIgnoreCase(quotation.getStatus()) || "DENIED".equalsIgnoreCase(quotation.getStatus())) {
                        // For approved/denied, use respondedAt if available, otherwise createdAt
                        if (quotation.getRespondedAt() != null) {
                            quoteTimestamp = quotation.getRespondedAt();
                        }
                    }
                    
                    if (quoteTimestamp == null) {
                        quoteTimestamp = LocalDateTime.now();
                    }
                    
                    if ("PENDING".equalsIgnoreCase(quotation.getStatus())) {
                        update.setEventType("QUOTATION_CREATED");
                        update.setMessage("Quotation created");
                    } else if ("APPROVED".equalsIgnoreCase(quotation.getStatus())) {
                        update.setEventType("QUOTATION_APPROVED");
                        update.setMessage("Quotation approved");
                    } else if ("DENIED".equalsIgnoreCase(quotation.getStatus())) {
                        update.setEventType("QUOTATION_DENIED");
                        update.setMessage("Quotation denied");
                    } else {
                        update.setEventType("QUOTATION_UPDATED");
                        update.setMessage("Quotation updated");
                    }
                    update.setTimestamp(quoteTimestamp);
                    update.setStatus(quotation.getStatus());
                    allUpdates.add(update);
                }
            }

            // Sort all updates by timestamp (most recent first)
            allUpdates.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

            // Apply pagination manually
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), allUpdates.size());
            List<RecentUpdateDTO> pagedUpdates = allUpdates.subList(start, end);

            // Create a Page object
            Page<RecentUpdateDTO> result = new org.springframework.data.domain.PageImpl<>(
                    pagedUpdates, 
                    pageable, 
                    allUpdates.size()
            );

            logger.info("Found {} recent updates for customer: {}", allUpdates.size(), email);
            return result;
        } catch (Exception e) {
            logger.error("Error fetching recent updates for customer: {}", email, e);
            throw new RuntimeException("Failed to fetch recent updates", e);
        }
    }

    private String getStatusChangeMessage(String status) {
        switch (status.toUpperCase()) {
            case "RECEIVED":
                return "Ticket received";
            case "DIAGNOSING":
            case "DIAGNOSED":
                return "Diagnosis complete";
            case "AWAITING_PARTS":
                return "Awaiting parts";
            case "REPAIRING":
                return "Repair in progress";
            case "READY_FOR_PICKUP":
                return "Ready for pickup";
            case "COMPLETED":
            case "COMPLETE":
                return "Ticket completed";
            default:
                return "Status updated to " + status.replace("_", " ").toLowerCase();
        }
    }

    private String formatStatusName(String statusName) {
        if (statusName == null || statusName.isEmpty()) {
            return statusName;
        }
        String[] words = statusName.replace("_", " ").toLowerCase().split(" ");
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i > 0) {
                formatted.append(" ");
            }
            if (!words[i].isEmpty()) {
                formatted.append(Character.toUpperCase(words[i].charAt(0)));
                if (words[i].length() > 1) {
                    formatted.append(words[i].substring(1));
                }
            }
        }
        return formatted.toString();
    }
}
