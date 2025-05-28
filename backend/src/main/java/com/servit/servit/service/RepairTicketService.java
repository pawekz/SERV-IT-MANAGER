package com.servit.servit.service;

import com.servit.servit.dto.CheckInRepairTicketRequestDTO;
import com.servit.servit.dto.GetRepairTicketResponseDTO;
import com.servit.servit.dto.RepairStatusHistoryResponseDTO;
import com.servit.servit.dto.UpdateRepairStatusRequestDTO;
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

    private static final Logger logger = LoggerFactory.getLogger(RepairTicketService.class);

    public RepairTicketService(RepairTicketRepository repairTicketRepository, UserRepository userRepository) {
        this.repairTicketRepository = repairTicketRepository;
        this.userRepository = userRepository;
    }

    public GetRepairTicketResponseDTO getRepairTicket(String ticketNumber) {
        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new EntityNotFoundException("Repair ticket not found"));

        if (repairTicket.getDeviceModel() == null || repairTicket.getDeviceSerialNumber() == null) {
            throw new IllegalArgumentException("Required fields are missing in the repair ticket");
        }

        return mapToGetRepairTicketResponseDTO(repairTicket);
    }

    public RepairTicketEntity checkInRepairTicket(CheckInRepairTicketRequestDTO req) throws IOException {
        if (repairTicketRepository.findByTicketNumber(req.getTicketNumber()).isPresent()) {
            throw new IllegalArgumentException("A repair ticket with this ticket number already exists.");
        }
        if (req.getCustomerName() == null || req.getDeviceSerialNumber() == null || req.getDeviceModel() == null) {
            throw new IllegalArgumentException("Required fields are missing in the repair ticket form");
        }

        if (req.getRepairPhotos() != null && req.getRepairPhotos().size() > 3) {
            throw new IllegalArgumentException("You can upload a maximum of 3 repair photos.");
        }

        UserEntity technician = userRepository.findByEmail(req.getTechnicianEmail())
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));

        RepairTicketEntity repairTicket = new RepairTicketEntity();
        repairTicket.setCustomerName(req.getCustomerName());
        repairTicket.setCustomerEmail(req.getCustomerEmail());
        repairTicket.setCustomerPhoneNumber(req.getCustomerPhoneNumber());
        repairTicket.setDeviceSerialNumber(req.getDeviceSerialNumber());
        repairTicket.setDeviceModel(req.getDeviceModel());
        repairTicket.setDeviceBrand(req.getDeviceBrand());
        repairTicket.setDeviceColor(req.getDeviceColor());
        repairTicket.setDevicePassword(
                req.getDevicePassword() == null || req.getDevicePassword().isEmpty() ? "N/A" : req.getDevicePassword()
        );
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
        repairTicket.setStatus("CHECKED-IN");
        repairTicket.setCheckInDate(LocalDateTime.now());
        repairTicket.setTicketNumber(req.getTicketNumber());

        AtomicInteger counter = new AtomicInteger(1);
        repairTicket.setRepairPhotos(req.getRepairPhotos().stream()
                .map(photo -> {
                    try {
                        String photoPath = fileUtil.saveRepairPhoto(photo, repairTicket.getTicketNumber(), counter.getAndIncrement());
                        RepairPhotoEntity repairPhoto = new RepairPhotoEntity();
                        repairPhoto.setPhotoUrl(photoPath);
                        repairPhoto.setRepairTicket(repairTicket);
                        return repairPhoto;
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to save repair photo. Please retry.", e);
                    }
                })
                .collect(Collectors.toList()));

        String digitalSignaturePath = fileUtil.saveDigitalSignature(req.getDigitalSignature(), repairTicket.getTicketNumber());

        logger.info("Successfully saved digital signature for repair ticket: {}", repairTicket.getTicketNumber());

        DigitalSignatureEntity digitalSignature = new DigitalSignatureEntity();
        digitalSignature.setImageUrl(digitalSignaturePath);
        digitalSignature.setRepairTicket(repairTicket);

        repairTicket.setDigitalSignature(digitalSignature);

        logger.info("Successfully created repair ticket: {}", repairTicket.getTicketNumber());

        return repairTicketRepository.save(repairTicket);
    }

    public String generateRepairTicketNumber() {
        String lastTicketNumber = repairTicketRepository.findLastTicketNumber();
        int nextId = 1;

        if (lastTicketNumber != null && lastTicketNumber.startsWith("IORT-")) {
            String numericPart = lastTicketNumber.substring(5);
            nextId = Integer.parseInt(numericPart) + 1;
        }

        return "IORT-" + String.format("%06d", nextId);
    }

    public void uploadRepairTicketDocument(String ticketNumber, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is null or empty. Please provide a valid file.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.endsWith(".pdf")) {
            throw new IllegalArgumentException("Invalid file type. Only PDF files are allowed.");
        }

        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(ticketNumber)
                .orElseThrow(() -> new EntityNotFoundException("Repair ticket with ticket number " + ticketNumber + " not found."));

        String pdfPath = fileUtil.saveRepairTicketDocument(file, ticketNumber);
        repairTicket.setDocumentPath(pdfPath);

        repairTicketRepository.save(repairTicket);

        System.out.println("Successfully uploaded document for repair ticket: " + ticketNumber);
    }

    public List<GetRepairTicketResponseDTO> getAllRepairTickets() {
        return repairTicketRepository.findAll().stream()
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
    }

    public List<GetRepairTicketResponseDTO> getRepairTicketsByCustomerEmail(String email) {
        return repairTicketRepository.findByCustomerEmail(email).stream()
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
    }

    public List<GetRepairTicketResponseDTO> searchRepairTickets(String searchTerm) {
        return repairTicketRepository.searchRepairTickets(searchTerm).stream()
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
    }

    public List<GetRepairTicketResponseDTO> searchRepairTicketsByEmail(String email, String searchTerm) {
        return repairTicketRepository.searchRepairTicketsByEmail(email, searchTerm).stream()
                .map(this::mapToGetRepairTicketResponseDTO)
                .collect(Collectors.toList());
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
        RepairTicketEntity repairTicket = repairTicketRepository.findByTicketNumber(request.getTicketNumber())
                .orElseThrow(() -> new EntityNotFoundException("Repair ticket not found"));

        RepairStatusEnum newStatus = RepairStatusEnum.valueOf(request.getRepairStatus());
        repairTicket.setRepairStatusEnum(newStatus);

        RepairStatusHistoryEntity statusHistory = new RepairStatusHistoryEntity();
        statusHistory.setRepairTicket(repairTicket);
        statusHistory.setRepairStatusEnum(newStatus);

        repairTicket.getRepairStatusHistory().add(statusHistory);

        return repairTicketRepository.save(repairTicket);
    }

    public List<RepairStatusHistoryResponseDTO> getRepairStatusHistory(String ticketNumber) {
        List<RepairStatusHistoryEntity> history = repairStatusHistoryRepository.findByRepairTicketTicketNumberOrderByTimestampDesc(ticketNumber);

        return history.stream()
                .map(this::mapToStatusHistoryResponseDTO)
                .collect(Collectors.toList());
    }

    private RepairStatusHistoryResponseDTO mapToStatusHistoryResponseDTO(RepairStatusHistoryEntity entity) {
        RepairStatusHistoryResponseDTO dto = new RepairStatusHistoryResponseDTO();
        dto.setTimestamp(entity.getTimestamp());
        return dto;
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
        dto.setStatus(repairTicket.getStatus());
        dto.setCheckInDate(LocalDate.from(repairTicket.getCheckInDate()));
        dto.setDigitalSignatureImageUrl(repairTicket.getDigitalSignature() != null ? repairTicket.getDigitalSignature().getImageUrl() : null);
        dto.setRepairPhotosUrls(repairTicket.getRepairPhotos().stream()
                .map(RepairPhotoEntity::getPhotoUrl)
                .collect(Collectors.toList()));
        return dto;
    }
}