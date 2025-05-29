package com.servit.servit.service;

import com.servit.servit.dto.GetAllWarrantyDTO;
import com.servit.servit.entity.WarrantyEntity;
import com.servit.servit.entity.WarrantyPhotoEntity;
import com.servit.servit.enumeration.WarrantyStatus;
import com.servit.servit.repository.WarrantyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WarrantyService {


    private final WarrantyRepository warrantyRepository;

    private static final Logger logger = LoggerFactory.getLogger(WarrantyService.class);

    @Autowired
    public WarrantyService(WarrantyRepository warrantyRepository) {
        this.warrantyRepository = warrantyRepository;
    }


    public List<WarrantyEntity> getAllWarranties() {
        return warrantyRepository.findAll();
    }


    public Optional<WarrantyEntity> getWarrantyById(Long id) {
        return warrantyRepository.findById(id);
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
        GetAllWarrantyDTO dto = new GetAllWarrantyDTO();
        dto.setWarrantyNumber(warranty.getWarantyNumber());
        dto.setStatus(warranty.getStatus());
        dto.setCustomerName(warranty.getCustomerName());
        dto.setCustomerEmail(warranty.getCustomerEmail());
        dto.setCustomerPhoneNumber(warranty.getCustomerPhoneNumber());
        dto.setReturnReason(warranty.getReturnReason());
        dto.setReportedIssue(warranty.getReportedIssue());
        dto.setExpirationDate(warranty.getExpirationDate());

        if (warranty.getItem() != null) {
            dto.setPartId(warranty.getItem().getPartId());
        }

        if (warranty.getWarrantyPhotos() != null) {
            dto.setRepairPhotosUrls(
                    warranty.getWarrantyPhotos().stream()
                            .map(WarrantyPhotoEntity::getPhotoUrl)
                            .collect(Collectors.toList())
            );
        } else {
            dto.setRepairPhotosUrls(List.of());
        }
        return dto;
    }


    public WarrantyEntity checkinWarranty(WarrantyEntity warranty) {
        return warrantyRepository.save(warranty);
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

    @Transactional
    public void updateStatus(Long warrantyId, WarrantyStatus status) {
        WarrantyEntity warranty = warrantyRepository.findById(warrantyId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        warranty.setStatus(status);
        warrantyRepository.save(warranty);
    }

}
