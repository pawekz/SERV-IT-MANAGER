package com.servit.servit.service;

import com.servit.servit.dto.CheckInRepairTicketRequestDTO;
import com.servit.servit.dto.GetRepairTicketResponseDTO;
import com.servit.servit.entity.DigitalSignatureEntity;
import com.servit.servit.entity.RepairPhotoEntity;
import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.entity.UserEntity;
import com.servit.servit.repository.RepairTicketRepository;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.util.FileUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
public class RepairTicketService {

    @Autowired
    private final RepairTicketRepository repairTicketRepository;

    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private FileUtil fileUtil;

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

        GetRepairTicketResponseDTO getRepairTicketResponseDTO = new GetRepairTicketResponseDTO();

        getRepairTicketResponseDTO.setTicketNumber(repairTicket.getTicketNumber());
        getRepairTicketResponseDTO.setCustomerName(repairTicket.getCustomerName());
        getRepairTicketResponseDTO.setCustomerEmail(repairTicket.getCustomerEmail());
        getRepairTicketResponseDTO.setCustomerPhoneNumber(repairTicket.getCustomerPhoneNumber());
        getRepairTicketResponseDTO.setDeviceType(repairTicket.getDeviceType());
        getRepairTicketResponseDTO.setDeviceColor(repairTicket.getDeviceColor());
        getRepairTicketResponseDTO.setDeviceSerialNumber(repairTicket.getDeviceSerialNumber());
        getRepairTicketResponseDTO.setDeviceModel(repairTicket.getDeviceModel());
        getRepairTicketResponseDTO.setDeviceBrand(repairTicket.getDeviceBrand());
        getRepairTicketResponseDTO.setDevicePassword(repairTicket.getDevicePassword());
        getRepairTicketResponseDTO.setReportedIssue(repairTicket.getReportedIssue());
        getRepairTicketResponseDTO.setTechnicianEmail(repairTicket.getTechnicianEmail().getEmail());
        getRepairTicketResponseDTO.setAccessories(repairTicket.getAccessories());
        getRepairTicketResponseDTO.setObservations(repairTicket.getObservations());
        getRepairTicketResponseDTO.setStatus(repairTicket.getStatus());
        getRepairTicketResponseDTO.setCheckInDate(LocalDate.from(repairTicket.getCheckInDate()));

        getRepairTicketResponseDTO.setDigitalSignatureImageUrl(repairTicket.getDigitalSignature().getImageUrl());

        getRepairTicketResponseDTO.setRepairPhotosUrls(repairTicket.getRepairPhotos().stream()
                .map(RepairPhotoEntity::getPhotoUrl)
                .collect(Collectors.toList()));

        System.out.println("Successfully retrieved repair ticket: " + getRepairTicketResponseDTO.getTicketNumber());

        return getRepairTicketResponseDTO;
    }

    public RepairTicketEntity checkInRepairTicket(CheckInRepairTicketRequestDTO req) throws IOException {
        if (req.getCustomerName() == null || req.getDeviceSerialNumber() == null || req.getDeviceModel() == null) {
            throw new IllegalArgumentException("Required fields are missing in the repair ticket form");
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
        repairTicket.setDeviceType(req.getDeviceType());
        repairTicket.setReportedIssue(req.getReportedIssue());
        repairTicket.setTechnicianEmail(technician);
        repairTicket.setTechnicianName(technician.getFirstName() + " " + technician.getLastName());
        repairTicket.setAccessories(req.getAccessories());
        repairTicket.setObservations(req.getObservations());
        repairTicket.setStatus("CHECKED-IN");
        repairTicket.setCheckInDate(LocalDateTime.now());
        repairTicket.setTicketNumber(req.getTicketNumber());

        repairTicket.setRepairPhotos(req.getRepairPhotos().stream()
                .map(photo -> {
                    try {
                        int index = req.getRepairPhotos().indexOf(photo) + 1;
                        String photoPath = fileUtil.saveRepairPhoto(photo, repairTicket.getTicketNumber(), index);
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

        System.out.println("Successfully saved digital signature for repair ticket: " + repairTicket.getTicketNumber());

        DigitalSignatureEntity digitalSignature = new DigitalSignatureEntity();
        digitalSignature.setImageUrl(digitalSignaturePath);
        digitalSignature.setRepairTicket(repairTicket);

        repairTicket.setDigitalSignature(digitalSignature);

        System.out.println("Successfully created repair ticket: " + repairTicket.getTicketNumber());

        return repairTicketRepository.save(repairTicket);
    }

    public String generateRepairTicketNumber() {
        Long nextId = repairTicketRepository.getNextRepairTicketId();
        return "IORT-" + String.format("%06d", nextId);
    }
}