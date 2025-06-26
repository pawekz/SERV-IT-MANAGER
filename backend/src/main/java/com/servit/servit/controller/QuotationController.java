package com.servit.servit.controller;

import com.servit.servit.dto.QuotationDTO;
import com.servit.servit.service.QuotationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/quotation")
public class QuotationController {

    @Autowired
    private QuotationService quotationService;

    @PostMapping("/addQuotation")
    public QuotationDTO addQuotation(@RequestBody QuotationDTO dto) {
        try {
            return quotationService.addQuotation(dto);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to add quotation", e);
        }
    }

    @PatchMapping("/approveQuotation/{quotationId}")
    public QuotationDTO approveQuotation(@PathVariable Long quotationId, @RequestParam String customerSelection) {
        try {
            return quotationService.approveQuotation(quotationId, customerSelection);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to approve quotation", e);
        }
    }

    @PatchMapping("/denyQuotation/{quotationId}")
    public QuotationDTO denyQuotation(@PathVariable Long quotationId) {
        try {
            return quotationService.denyQuotation(quotationId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to deny quotation", e);
        }
    }

    @DeleteMapping("/deleteQuotation/{quotationId}")
    public void deleteQuotation(@PathVariable Long quotationId) {
        try {
            quotationService.deleteQuotation(quotationId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete quotation", e);
        }
    }

    @GetMapping("/getQuotation/{quotationId}")
    public QuotationDTO getQuotation(@PathVariable Long quotationId) {
        try {
            return quotationService.getQuotation(quotationId);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get quotation", e);
        }
    }

    @GetMapping("/getAllQuotation")
    public List<QuotationDTO> getAllQuotation() {
        try {
            return quotationService.getAllQuotation();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get all quotations", e);
        }
    }

    @GetMapping("/getAllQuotationPaginated")
    public Page<QuotationDTO> getAllQuotationPaginated(Pageable pageable) {
        try {
            return quotationService.getAllQuotationPaginated(pageable);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get paginated quotations", e);
        }
    }

    @GetMapping("/getQuotationByRepairTicketNumber/{repairTicketNumber}")
    public List<QuotationDTO> getQuotationByRepairTicketNumber(@PathVariable String repairTicketNumber) {
        try {
            return quotationService.getQuotationByRepairTicketNumber(repairTicketNumber);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get quotations by repair ticket number", e);
        }
    }

    @PatchMapping("/editQuotation/{repairTicketNumber}")
    public QuotationDTO editQuotation(@PathVariable String repairTicketNumber, @RequestBody QuotationDTO dto) {
        try {
            // Find existing quotations for the ticket – assume latest is first after sorting by createdAt desc
            java.util.List<com.servit.servit.dto.QuotationDTO> list = quotationService.getQuotationByRepairTicketNumber(repairTicketNumber);
            if (list.isEmpty()) {
                throw new IllegalArgumentException("No quotation found for ticket " + repairTicketNumber);
            }
            // use the first (most recent)
            Long quotationId = list.get(0).getQuotationId();
            dto.setQuotationId(quotationId);
            return quotationService.updateQuotation(dto);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to edit quotation", e);
        }
    }
}