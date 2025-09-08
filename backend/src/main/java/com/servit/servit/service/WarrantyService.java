package com.servit.servit.service;

import com.servit.servit.dto.repairticket.CheckInRepairTicketRequestDTO;
import com.servit.servit.dto.warranty.*;
import com.servit.servit.entity.*;
import com.servit.servit.enumeration.WarrantyStatus;
import com.servit.servit.repository.PartRepository;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.repository.WarrantyRepository;
import com.servit.servit.util.FileUtil;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static java.util.Locale.filter;

@Service
public class WarrantyService {


    private final WarrantyRepository warrantyRepository;

    private final PartRepository partRepository;

    private final EmailService emailService;

    private final RepairTicketService repairTicketService;

    private final UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(WarrantyService.class);

    @Autowired
    private FileUtil fileUtil;
    @Autowired
    private PartNumberStockTrackingService partNumberStockTrackingService;

    @Autowired
    public WarrantyService(WarrantyRepository warrantyRepository, PartRepository partRepository, EmailService emailService, RepairTicketService repairTicketService, UserRepository userRepository) {
        this.warrantyRepository = warrantyRepository;
        this.partRepository = partRepository;
        this.emailService = emailService;
        this.repairTicketService = repairTicketService;
        this.userRepository = userRepository;
    }



    public Optional<WarrantyEntity> getWarrantyById(Long id) {
        return warrantyRepository.findById(id);
    }

    public List<GetAllWarrantyDTO> getAllWarranties() {
        logger.info("Fetching all warranties.");
        try {
            List<GetAllWarrantyDTO> warranties = warrantyRepository.findAll().stream()
                    .map(this::mapToGetAllWarrantyDTO)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            logger.info("Fetched {} warranties.", warranties.size());
            return warranties;
        } catch (Exception e) {
            logger.error("Error fetching all warranties.", e);
            throw new RuntimeException("Failed to fetch all warranties", e);
        }
    }

    public List<GetAllWarrantyDTO> getWarrantiesByCustomerEmail(String email) {
        logger.info("Fetching warranties for customer email: {}", email);
        try {
            List<GetAllWarrantyDTO> warranties = warrantyRepository.findByCustomerEmail(email).stream()
                    .map(this::mapToGetAllWarrantyDTO)
                    .collect(Collectors.toList());
            logger.info("Fetched {} warranties for customer email: {}", warranties.size(), email);
            return warranties;
        } catch (Exception e) {
            logger.error("Error fetching warranties for customer email: {}", email, e);
            throw new RuntimeException("Failed to fetch warranties by customer email", e);
        }
    }

    public Page<GetAllWarrantyDTO> searchWarrantiesByEmail(String email, String searchTerm, Pageable pageable) {
        logger.info("Searching warranties for email: {} with searchTerm: {}", email, searchTerm);
        try {
            Page<GetAllWarrantyDTO> result = warrantyRepository.searchWarrantiesByEmail(email, searchTerm, pageable)
                    .map(this::mapToGetAllWarrantyDTO);
            logger.info("Found {} warranties for email: {} and searchTerm: {}", result.getTotalElements(), email, searchTerm);
            return result;
        } catch (Exception e) {
            logger.error("Error searching warranties for email: {} with searchTerm: {}", email, searchTerm, e);
            throw new RuntimeException("Failed to search warranties by email", e);
        }
    }

    private String extractS3KeyFromUrl(String s3Url) {
        int idx = s3Url.indexOf(".amazonaws.com/");
        if (idx == -1) return s3Url;
        return s3Url.substring(idx + ".amazonaws.com/".length());
    }

    private GetAllWarrantyDTO mapToGetAllWarrantyDTO(WarrantyEntity warranty) {

        Optional<PartEntity> part = partRepository.findByWarranty(warranty);
        if (part.isEmpty()) {
            logger.warn("No part found for warranty ID: {}", warranty.getWarrantyId());
            return null;  // or create DTO with partial data
        }
        PartEntity partEntity = part.get();

        GetAllWarrantyDTO dto = new GetAllWarrantyDTO();
        dto.setWarrantyNumber(warranty.getWarrantyNumber());
        dto.setStatus(warranty.getStatus());
        dto.setCustomerName(warranty.getCustomerName());
        dto.setCustomerEmail(warranty.getCustomerEmail());
        dto.setCustomerPhoneNumber(warranty.getCustomerPhoneNumber());
        dto.setReturnReason(warranty.getReturnReason());
        dto.setReportedIssue(warranty.getReportedIssue());
        dto.setExpirationDate(partEntity.getWarrantyExpiration());
        dto.setDeviceName(partEntity.getName());
        dto.setDeviceType(partEntity.getDescription());
        dto.setSerialNumber(partEntity.getSerialNumber());
        dto.setTechObservation(warranty.getTechObservation());
        dto.setBrand(partEntity.getBrand());
        dto.setModel(partEntity.getModel());
        dto.setKind(warranty.getKind());

        if (warranty.getWarrantyPhotos() != null) {
            dto.setWarrantyPhotosUrls(
                warranty.getWarrantyPhotos().stream()
                    .map(WarrantyPhotoEntity::getPhotoUrl)
                    .collect(Collectors.toList())
            );
        } else {
            dto.setWarrantyPhotosUrls(List.of());
        }
        return dto;
    }


    public WarrantyEntity checkinWarranty(CheckInWarrantyDTO req) throws IOException {
        logger.info("Attempting to check in warranty request: {}", req.getWarrantyNumber());

        try {
            if (warrantyRepository.findByWarrantyNumber(req.getWarrantyNumber()).isPresent()) {
                logger.warn("A warranty with this warranty number already exists: {}", req.getWarrantyNumber());
                throw new IllegalArgumentException("A warranty with this warranty number already exists.");
            }
            if (req.getCustomerName() == null || req.getSerialNumber() == null) {
                logger.warn("Required fields are missing in the warranty form for ticket: {}", req.getWarrantyNumber());
                throw new IllegalArgumentException("Required fields are missing in the warranty form");
            }

            PartEntity part = partRepository.findBySerialNumber(req.getSerialNumber())
                    .orElseThrow(() -> new EntityNotFoundException("Part not found"));

            WarrantyEntity warranty = new WarrantyEntity();
            warranty.setCustomerName(req.getCustomerName());
            warranty.setCustomerEmail(req.getCustomerEmail());
            warranty.setCustomerPhoneNumber(req.getCustomerPhoneNumber());
            warranty.setItem(part);
            warranty.setReturnReason(req.getReturnReason());
            warranty.setStatus(WarrantyStatus.CHECKED_IN);
            warranty.setCreatedAt(LocalDateTime.now());
            warranty.setWarrantyNumber(req.getWarrantyNumber());
            warranty.setReportedIssue(req.getReportedIssue());

            LocalDateTime expiration = part.getDatePurchasedByCustomer();
            LocalDateTime now = LocalDateTime.now();
            long days = ChronoUnit.DAYS.between(expiration.toLocalDate(),now.toLocalDate()) + 1;
            if (days <= 7) {
                warranty.setKind("AUTO_REPLACEMENT");
            } else {
                warranty.setKind("IN_WARRANTY_REPAIR");
            }

            warranty = warrantyRepository.save(warranty);

            part.setWarranty(warranty);
            partRepository.save(part);

// Finally set the reverse relationship if needed
            logger.info("Successfully created Warranty ticket: {}", warranty.getWarrantyNumber());

            return warrantyRepository.save(warranty);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error during check-in for ticket: {}", req.getWarrantyNumber(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during check-in for ticket: {}", req.getWarrantyNumber(), e);
            throw new RuntimeException("Failed to check in repair ticket", e);
        }
    }


    public String generateWarrantyNumber() {
        String lastWarrantyNumber = warrantyRepository.findLastWarrantyNumber();
        int nextId = 1;

        if (lastWarrantyNumber != null && lastWarrantyNumber.startsWith("IORMA-")) {
            try {
                String numericPart = lastWarrantyNumber.substring(6);
                nextId = Integer.parseInt(numericPart) + 1;
                logger.info("Last warranty number found: {}. Next warranty number will be: IORMA-{}", lastWarrantyNumber, String.format("%06d", nextId));
            } catch (NumberFormatException e) {
                logger.error("Failed to parse numeric part of last warranty number: {}", lastWarrantyNumber, e);
                throw new RuntimeException("Invalid last warranty number format: " + lastWarrantyNumber, e);
            }
        } else {
            logger.info("No previous ticket number found. Starting from IORMA-000001.");
        }

        String newWarrantyNumber = "IORMA-" + String.format("%06d", nextId);
        logger.info("Generated new ticket number: {}", newWarrantyNumber);

        return newWarrantyNumber;
    }

    public WarrantyEntity updateWarrantyStatus(UpdateWarrantyStatusDTO request) {
        logger.info("Updating warranty status for warranty number: {}", request.getWarrantyNumber());

        if (request.getWarrantyNumber() == null || request.getWarrantyNumber().isEmpty()) {
            logger.warn("Warranty number is null or empty.");
            throw new IllegalArgumentException("Warranty number must not be null or empty.");
        }

        if (request.getStatus() == null || request.getStatus().isEmpty()) {
            logger.warn("Warranty status is null or empty for warranty number: {}", request.getWarrantyNumber());
            throw new IllegalArgumentException("Warranty status must not be null or empty.");
        }

        WarrantyEntity warranty = warrantyRepository.findByWarrantyNumber(request.getWarrantyNumber())
                .orElseThrow(() -> {
                    logger.error("Warranty not found: {}", request.getWarrantyNumber());
                    return new EntityNotFoundException("Warranty not found");
                });

        WarrantyStatus newStatus;
        try {
            newStatus = WarrantyStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException ex) {
            logger.error("Invalid warranty status: {}", request.getStatus(), ex);
            throw new IllegalArgumentException("Invalid warranty status: " + request.getStatus(), ex);
        }

        warranty.setStatus(newStatus);

        if (newStatus == WarrantyStatus.ITEM_RETURNED) {
            warranty.setTechObservation(request.getTechObservation());

            UserEntity technician = userRepository.findByEmail(request.getTechnicianEmail())
                    .orElseThrow(() -> {
                        logger.warn("Technician not found: {}", request.getTechnicianEmail());
                        return new IllegalArgumentException("Technician not found" + request.getTechnicianEmail());
                    });

            AtomicInteger counter = new AtomicInteger(1);
            try {
                // ⚠️ DO NOT REPLACE COLLECTION — clear and add instead
                List<WarrantyPhotoEntity> newPhotos = request.getWarrantyPhotosUrls().stream()
                        .map(photo -> {
                            try {
                                String photoPath = fileUtil.saveWarrantyPhoto(photo, warranty.getWarrantyNumber(), counter.getAndIncrement());
                                WarrantyPhotoEntity warrantyPhoto = new WarrantyPhotoEntity();
                                warrantyPhoto.setPhotoUrl(photoPath);
                                warrantyPhoto.setWarranty(warranty);
                                logger.info("Saved repair photo for ticket: {} at {}", warranty.getWarrantyNumber(), photoPath);
                                return warrantyPhoto;
                            } catch (IOException e) {
                                logger.error("Failed to save repair photo for ticket: {}", warranty.getWarrantyNumber(), e);
                                throw new RuntimeException("Failed to save repair photo. Please retry.", e);
                            }
                        })
                        .collect(Collectors.toList());

                // ✅ Clear existing photos and add new ones (to avoid orphan cascade issues)
                if (warranty.getWarrantyPhotos() != null) {
                    warranty.getWarrantyPhotos().clear();
                    warranty.getWarrantyPhotos().addAll(newPhotos);
                } else {
                    warranty.setWarrantyPhotos(newPhotos);
                }

            } catch (Exception e) {
                logger.error("Error processing repair photos for ticket: {}", warranty.getWarrantyNumber(), e);
                throw e;
            }

            // if confirmed to be a Warranty Repair, create a repair ticket
            if(Objects.equals(warranty.getKind(), "IN_WARRANTY_REPAIR")){
                CheckInRepairTicketRequestDTO ticket = new CheckInRepairTicketRequestDTO();

                // Map basic customer and issue details
                ticket.setTicketNumber(warranty.getWarrantyNumber());
                ticket.setCustomerName(warranty.getCustomerName());
                ticket.setCustomerEmail(warranty.getCustomerEmail());
                ticket.setCustomerPhoneNumber(warranty.getCustomerPhoneNumber());
                ticket.setReportedIssue(warranty.getReportedIssue());
                ticket.setObservations(warranty.getTechObservation());

                ticket.setTechnicianEmail(technician.getEmail());
                ticket.setTechnicianName(technician.getFirstName() + " " + technician.getLastName());
                ticket.setRepairPhotos(request.getWarrantyPhotosUrls());

                if (warranty.getItem() != null) {
                    ticket.setDeviceType(request.getDeviceType());
                    ticket.setDeviceColor(request.getColor());
                    ticket.setDeviceSerialNumber(warranty.getItem().getSerialNumber());
                    ticket.setDeviceModel(warranty.getItem().getModel());
                    ticket.setDeviceBrand(warranty.getItem().getBrand());
                    ticket.setDevicePassword(request.getPassword());
                    ticket.setAccessories(request.getAccessories());
                    ticket.setIsDeviceTampered(false);

                }

                repairTicketService.checkInRepairTicket(ticket);
            }
        }

        logger.info("Warranty status updated to {} for warranty number: {}", newStatus, request.getWarrantyNumber());
        return warrantyRepository.save(warranty);
    }

    public void uploadWarrantyDocument(String warrantyNumber, MultipartFile file) throws IOException {
        logger.info("Uploading document for repair ticket: {}", warrantyNumber);

        try {
            if (file == null || file.isEmpty()) {
                logger.warn("Uploaded file is null or empty for warranty: {}", warrantyNumber);
                throw new IllegalArgumentException("Uploaded file is null or empty. Please provide a valid file.");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.endsWith(".pdf")) {
                logger.warn("Invalid file type for warranty: {}. Only PDF files are allowed.", warrantyNumber);
                throw new IllegalArgumentException("Invalid file type. Only PDF files are allowed.");
            }

            WarrantyEntity warranty = warrantyRepository.findByWarrantyNumber(warrantyNumber)
                    .orElseThrow(() -> {
                        logger.error("Repair ticket not found: {}", warrantyNumber);
                        return new EntityNotFoundException("Repair warranty with warranty number " + warrantyNumber + " not found.");
                    });

            String pdfPath = fileUtil.saveWarrantyTicketPdf(file, warrantyNumber);
            warranty.setDocumentPath(pdfPath);

            warrantyRepository.save(warranty);

            if(Objects.equals(warranty.getKind(), "IN_WARRANTY_REPAIR")){

                repairTicketService.uploadRepairTicketPdf(warrantyNumber,file);
            }


            try {
                emailService.sendWarrrantyPdfEmail(
                        warranty.getCustomerEmail(),
                        warranty.getWarrantyNumber(),
                        warranty.getCustomerName(),
                        pdfPath
                );
            } catch (Exception emailEx) {
                logger.error("Error sending email for repair ticket document: {}", warrantyNumber, emailEx);
                throw new RuntimeException("Failed to send email.", emailEx);
            }


            logger.info("Successfully uploaded document for warranty: {}", warrantyNumber);
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            logger.error("Validation error while uploading document for warranty: {}", warrantyNumber, e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error while uploading document for warranty: {}", warrantyNumber, e);
            throw new RuntimeException("Failed to upload warranty document", e);
        }
    }

    public VerifyWarrantyDTO checkWarranty(String serialNumber, Boolean isDeviceTampered) {
        VerifyWarrantyDTO dto = new VerifyWarrantyDTO();
        dto.setSerialNumber(serialNumber);

        if (Boolean.TRUE.equals(isDeviceTampered)) {
            dto.setWithinWarranty(false);
            dto.setMessage("Device is tampered. Out-of-Warranty (Chargeable).");
            dto.setDaysLeft(null);
            return dto;
        }

        Optional<PartEntity> optionalPart = partRepository.findBySerialNumber(serialNumber);

        if (optionalPart.isEmpty()) {
            dto.setWithinWarranty(false);
            dto.setMessage("Serial number not found");
            dto.setDaysLeft(null);
            return dto;
        }

        PartEntity part = optionalPart.get();

            if (part.getWarranty() != null) {

                if (!part.getWarranty().getStatus().equals(WarrantyStatus.DENIED)) {

                dto.setWithinWarranty(false);
                dto.setMessage("This item already has a warranty: " + part.getWarranty().getWarrantyNumber());
                dto.setDaysLeft(null);
                return dto;
                }
            }

            dto.setDeviceName(part.getName());
            dto.setDeviceType(part.getDescription());
            dto.setBrand(part.getBrand());
            dto.setModel(part.getModel());
            LocalDateTime expiration = part.getWarrantyExpiration();
            LocalDateTime now = LocalDateTime.now();

            // determine if the item is inventory but not sold yet
            if (expiration == null) {
                dto.setWithinWarranty(false);
                dto.setMessage("This item does not have a warranty expiration date set.");
                dto.setDaysLeft(null);
                return dto;
            }

            boolean isWithinWarranty = now.isBefore(expiration);
            dto.setWithinWarranty(isWithinWarranty);


            if (isWithinWarranty) {
                long days = ChronoUnit.DAYS.between(now.toLocalDate(), expiration.toLocalDate()) + 1;
                dto.setDaysLeft(days);
                dto.setMessage("Item still within warranty: " + days + " days left");
            } else {
                dto.setDaysLeft(0L);
                dto.setMessage("Item is past warranty: " + expiration);
            }
            return dto;

    }

    public WarrantyPdfResponseDTO getWarrantyPdf(String warrantyNumber) throws IOException {
        WarrantyEntity warranty = warrantyRepository.findByWarrantyNumber(warrantyNumber)
                .orElseThrow(() -> new EntityNotFoundException("Warranty not found: " + warrantyNumber));

        String documentPath = warranty.getDocumentPath();
        if (documentPath == null) {
            throw new EntityNotFoundException("No document uploaded for this warranty: " + warrantyNumber);
        }

        String s3Key = extractS3KeyFromUrl(documentPath);
        com.amazonaws.services.s3.model.S3Object s3Object = fileUtil.downloadFileFromS3(s3Key);
        byte[] fileBytes;
        try (java.io.InputStream is = s3Object.getObjectContent()) {
            fileBytes = is.readAllBytes();
        }
        String fileName = s3Key.substring(s3Key.lastIndexOf("/") + 1);
        return new WarrantyPdfResponseDTO(fileBytes, fileName);
    }

};
