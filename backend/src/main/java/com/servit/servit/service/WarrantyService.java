package com.servit.servit.service;

import com.servit.servit.dto.CheckInWarrantyDTO;
import com.servit.servit.dto.GetAllWarrantyDTO;
import com.servit.servit.dto.UpdateWarrantyStatusDTO;
import com.servit.servit.dto.VerifyWarrantyDTO;
import com.servit.servit.entity.*;
import com.servit.servit.enumeration.RepairStatusEnum;
import com.servit.servit.enumeration.RepairTicketDeviceType;
import com.servit.servit.enumeration.WarrantyStatus;
import com.servit.servit.repository.PartRepository;
import com.servit.servit.repository.WarrantyRepository;
import com.servit.servit.util.FileUtil;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    private static final Logger logger = LoggerFactory.getLogger(WarrantyService.class);

    @Autowired
    private FileUtil fileUtil;
    @Autowired
    private PartNumberStockTrackingService partNumberStockTrackingService;

    @Autowired
    public WarrantyService(WarrantyRepository warrantyRepository, PartRepository partRepository) {
        this.warrantyRepository = warrantyRepository;
        this.partRepository = partRepository;
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

//        if (warranty.getWarrantyPhotos() != null) {
//            dto.setRepairPhotosUrls(
//                    warranty.getWarrantyPhotos().stream()
//                            .map(WarrantyPhotoEntity::getPhotoUrl)
//                            .collect(Collectors.toList())
//            );
//        } else {
//            dto.setRepairPhotosUrls(List.of());
//        }
        return dto;
    }


    public WarrantyEntity checkinWarranty(CheckInWarrantyDTO req) throws IOException {
        logger.info("Attempting to check in repair ticket: {}", req.getWarrantyNumber());

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

            warranty = warrantyRepository.save(warranty);

            part.setWarranty(warranty);
            partRepository.save(part);

// Finally set the reverse relationship if needed
            warranty.setItem(part);

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

        if (lastWarrantyNumber != null && lastWarrantyNumber.startsWith("IOWR-")) {
            String numericPart = lastWarrantyNumber.substring(5);
            nextId = Integer.parseInt(numericPart) + 1;
        }

        return "IOWR-" + String.format("%06d", nextId);
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

        logger.info("Warranty status updated to {} for warranty number: {}", newStatus, request.getWarrantyNumber());
        return warrantyRepository.save(warranty);
    }

//    public void uploadWarrantyDocument(String warrantyNumber, MultipartFile file) throws IOException {
//        logger.info("Uploading document for repair ticket: {}", warrantyNumber);
//
//        try {
//            if (file == null || file.isEmpty()) {
//                logger.warn("Uploaded file is null or empty for warranty: {}", warrantyNumber);
//                throw new IllegalArgumentException("Uploaded file is null or empty. Please provide a valid file.");
//            }
//
//            String originalFilename = file.getOriginalFilename();
//            if (originalFilename == null || !originalFilename.endsWith(".pdf")) {
//                logger.warn("Invalid file type for warranty: {}. Only PDF files are allowed.", warrantyNumber);
//                throw new IllegalArgumentException("Invalid file type. Only PDF files are allowed.");
//            }
//
//            WarrantyEntity warranty = warrantyRepository.findByWarrantyNumber(warrantyNumber)
//                    .orElseThrow(() -> {
//                        logger.error("Repair ticket not found: {}", warrantyNumber);
//                        return new EntityNotFoundException("Repair warranty with warranty number " + warrantyNumber + " not found.");
//                    });
//
//            String pdfPath = fileUtil.saveRepairTicketDocument(file, warrantyNumber);
//            warranty.setDocumentPath(pdfPath);
//
//            warrantyRepository.save(warranty);
//
//            logger.info("Successfully uploaded document for warranty: {}", warrantyNumber);
//        } catch (IllegalArgumentException | EntityNotFoundException e) {
//            logger.error("Validation error while uploading document for warranty: {}", warrantyNumber, e);
//            throw e;
//        } catch (Exception e) {
//            logger.error("Unexpected error while uploading document for warranty: {}", warrantyNumber, e);
//            throw new RuntimeException("Failed to upload warranty document", e);
//        }
//    }

    public VerifyWarrantyDTO checkWarranty(String serialNumber) {
        Optional<PartEntity> optionalPart = partRepository.findBySerialNumber(serialNumber);

        VerifyWarrantyDTO dto = new VerifyWarrantyDTO();
        dto.setSerialNumber(serialNumber);

        if (optionalPart.isEmpty()) {
            dto.setWithinWarranty(false);
            dto.setMessage("Serial number not found");
            dto.setDaysLeft(null); // Or consider using Optional<LocalDate> or -1 to represent "not applicable"
            return dto;
        }

        PartEntity part = optionalPart.get();
        dto.setDeviceName(part.getName());
        dto.setDeviceType(part.getDescription());
        LocalDateTime expiration = part.getWarrantyExpiration();
        LocalDateTime now = LocalDateTime.now();

        if (expiration == null) {
            dto.setWithinWarranty(false);
            dto.setMessage("An Issue has been found. Please contact support.");
            dto.setDaysLeft(null);
            return dto;
        }

        boolean isWithinWarranty = now.isBefore(expiration);
        dto.setWithinWarranty(isWithinWarranty);

        if (isWithinWarranty) {
            long days = ChronoUnit.DAYS.between(now.toLocalDate(), expiration.toLocalDate());
            dto.setDaysLeft(days);
            dto.setMessage("Item still with in warranty: " + days + " days left");
        } else {
            dto.setDaysLeft(0L); // Warranty expired
            dto.setMessage("Item is passed warranty: " + expiration);
        }

        return dto;
    }

}
