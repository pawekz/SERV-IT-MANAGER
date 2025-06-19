package com.servit.servit.service;

import com.servit.servit.dto.QuotationDTO;
import com.servit.servit.entity.QuotationEntity;
import com.servit.servit.repository.QuotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuotationService {

    @Autowired
    private QuotationRepository quotationRepository;

    public QuotationDTO addQuotation(QuotationDTO dto) {
        QuotationEntity entity = new QuotationEntity();
        entity.setRepairTicketNumber(dto.getRepairTicketNumber());
        entity.setPartIds(dto.getPartIds());
        entity.setLaborCost(dto.getLaborCost());
        entity.setTotalCost(dto.getTotalCost());
        entity.setStatus("PENDING");
        entity.setCreatedAt(LocalDateTime.now());
        QuotationEntity saved = quotationRepository.save(entity);
        return toDTO(saved);
    }

    public QuotationDTO approveQuotation(Long quotationId, String customerSelection) {
        QuotationEntity entity = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));
        entity.setStatus("APPROVED");
        entity.setRespondedAt(LocalDateTime.now());
        entity.setCustomerSelection(customerSelection);
        quotationRepository.save(entity);
        return toDTO(entity);
    }

    public QuotationDTO denyQuotation(Long quotationId) {
        QuotationEntity entity = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));
        entity.setStatus("REJECTED");
        entity.setRespondedAt(LocalDateTime.now());
        quotationRepository.save(entity);
        return toDTO(entity);
    }

    public void deleteQuotation(Long quotationId) {
        quotationRepository.deleteById(quotationId);
    }

    public QuotationDTO getQuotation(Long quotationId) {
        return quotationRepository.findById(quotationId)
                .map(this::toDTO)
                .orElseThrow(() -> new IllegalArgumentException("Quotation not found"));
    }

    public List<QuotationDTO> getAllQuotation() {
        return quotationRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Page<QuotationDTO> getAllQuotationPaginated(Pageable pageable) {
        return quotationRepository.findAll(pageable).map(this::toDTO);
    }

    public List<QuotationDTO> getQuotationByRepairTicketNumber(String repairTicketNumber) {
        return quotationRepository.findByRepairTicketNumber(repairTicketNumber)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
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