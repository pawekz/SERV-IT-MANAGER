package com.servit.servit.service;

import com.servit.servit.dto.QuotationDTO;
import com.servit.servit.entity.QuotationEntity;
import com.servit.servit.repository.QuotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuotationService {

    private static final Logger logger = LoggerFactory.getLogger(QuotationService.class);

    @Autowired
    private QuotationRepository quotationRepository;

    public QuotationDTO addQuotation(QuotationDTO dto) {
        try {
            QuotationEntity entity = new QuotationEntity();
            entity.setRepairTicketNumber(dto.getRepairTicketNumber());
            entity.setPartIds(dto.getPartIds());
            entity.setLaborCost(dto.getLaborCost());
            entity.setTotalCost(dto.getTotalCost());
            entity.setStatus("PENDING");
            entity.setCreatedAt(LocalDateTime.now());
            QuotationEntity saved = quotationRepository.save(entity);
            logger.info("Quotation added successfully: {}", saved.getQuotationId());
            return toDTO(saved);
        } catch (Exception e) {
            logger.error("Error adding quotation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add quotation", e);
        }
    }

    public QuotationDTO approveQuotation(Long quotationId, String customerSelection) {
        try {
            QuotationEntity entity = quotationRepository.findById(quotationId)
                    .orElseThrow(() -> {
                        logger.warn("Quotation not found for approval: {}", quotationId);
                        return new IllegalArgumentException("Quotation not found");
                    });
            entity.setStatus("APPROVED");
            entity.setRespondedAt(LocalDateTime.now());
            entity.setCustomerSelection(customerSelection);
            quotationRepository.save(entity);
            logger.info("Quotation approved: {}", quotationId);
            return toDTO(entity);
        } catch (Exception e) {
            logger.error("Error approving quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to approve quotation", e);
        }
    }

    public QuotationDTO denyQuotation(Long quotationId) {
        try {
            QuotationEntity entity = quotationRepository.findById(quotationId)
                    .orElseThrow(() -> {
                        logger.warn("Quotation not found for denial: {}", quotationId);
                        return new IllegalArgumentException("Quotation not found");
                    });
            entity.setStatus("REJECTED");
            entity.setRespondedAt(LocalDateTime.now());
            quotationRepository.save(entity);
            logger.info("Quotation denied: {}", quotationId);
            return toDTO(entity);
        } catch (Exception e) {
            logger.error("Error denying quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to deny quotation", e);
        }
    }

    public void deleteQuotation(Long quotationId) {
        try {
            if (!quotationRepository.existsById(quotationId)) {
                logger.warn("Quotation not found for deletion: {}", quotationId);
                throw new IllegalArgumentException("Quotation not found");
            }
            quotationRepository.deleteById(quotationId);
            logger.info("Quotation deleted: {}", quotationId);
        } catch (Exception e) {
            logger.error("Error deleting quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete quotation", e);
        }
    }

    public QuotationDTO getQuotation(Long quotationId) {
        try {
            return quotationRepository.findById(quotationId)
                    .map(this::toDTO)
                    .orElseThrow(() -> {
                        logger.warn("Quotation not found: {}", quotationId);
                        return new IllegalArgumentException("Quotation not found");
                    });
        } catch (Exception e) {
            logger.error("Error retrieving quotation {}: {}", quotationId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve quotation", e);
        }
    }

    public List<QuotationDTO> getAllQuotation() {
        try {
            List<QuotationDTO> quotations = quotationRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
            logger.info("Retrieved all quotations, count: {}", quotations.size());
            return quotations;
        } catch (Exception e) {
            logger.error("Error retrieving all quotations: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve all quotations", e);
        }
    }

    public Page<QuotationDTO> getAllQuotationPaginated(Pageable pageable) {
        try {
            Page<QuotationDTO> page = quotationRepository.findAll(pageable).map(this::toDTO);
            logger.info("Retrieved paginated quotations, page: {}", pageable.getPageNumber());
            return page;
        } catch (Exception e) {
            logger.error("Error retrieving paginated quotations: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve paginated quotations", e);
        }
    }

    public List<QuotationDTO> getQuotationByRepairTicketNumber(String repairTicketNumber) {
        try {
            List<QuotationDTO> quotations = quotationRepository.findByRepairTicketNumber(repairTicketNumber)
                    .stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
            logger.info("Retrieved quotations for repair ticket number {}: count {}", repairTicketNumber, quotations.size());
            return quotations;
        } catch (Exception e) {
            logger.error("Error retrieving quotations by repair ticket number {}: {}", repairTicketNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve quotations by repair ticket number", e);
        }
    }

    private QuotationDTO toDTO(QuotationEntity entity) {
        QuotationDTO dto = new QuotationDTO();
        dto.setQuotationId(entity.getQuotationId());
        dto.setRepairTicketNumber(entity.getRepairTicketNumber());
        dto.setPartIds(entity.getPartIds());
        dto.setLaborCost(entity.getLaborCost());
        dto.setTotalCost(entity.getTotalCost());
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setRespondedAt(entity.getRespondedAt());
        dto.setCustomerSelection(entity.getCustomerSelection());
        return dto;
    }
}