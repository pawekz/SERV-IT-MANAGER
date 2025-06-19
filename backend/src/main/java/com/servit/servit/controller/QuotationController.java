package com.servit.servit.controller;

import com.servit.servit.dto.QuotationDTO;
import com.servit.servit.service.QuotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RestController
@RequestMapping("/quotation")
public class QuotationController {

    @Autowired
    private QuotationService quotationService;

    @PostMapping("/addQuotation")
    public QuotationDTO addQuotation(@RequestBody QuotationDTO dto) {
        return quotationService.addQuotation(dto);
    }

    @PatchMapping("/approveQuotation/{quotationId}")
    public QuotationDTO approveQuotation(@PathVariable Long quotationId, @RequestParam String customerSelection) {
        return quotationService.approveQuotation(quotationId, customerSelection);
    }

    @PatchMapping("/denyQuotation/{quotationId}")
    public QuotationDTO denyQuotation(@PathVariable Long quotationId) {
        return quotationService.denyQuotation(quotationId);
    }

    @DeleteMapping("/deleteQuotation/{quotationId}")
    public void deleteQuotation(@PathVariable Long quotationId) {
        quotationService.deleteQuotation(quotationId);
    }

    @GetMapping("/getQuotation/{quotationId}")
    public QuotationDTO getQuotation(@PathVariable Long quotationId) {
        return quotationService.getQuotation(quotationId);
    }

    @GetMapping("/getAllQuotation")
    public List<QuotationDTO> getAllQuotation() {
        return quotationService.getAllQuotation();
    }

    @GetMapping("/getAllQuotationPaginated")
    public Page<QuotationDTO> getAllQuotationPaginated(Pageable pageable) {
        return quotationService.getAllQuotationPaginated(pageable);
    }

    @GetMapping("/getQuotationByRepairTicketNumber/{repairTicketNumber}")
    public List<QuotationDTO> getQuotationByRepairTicketNumber(@PathVariable String repairTicketNumber) {
        return quotationService.getQuotationByRepairTicketNumber(repairTicketNumber);
    }
}