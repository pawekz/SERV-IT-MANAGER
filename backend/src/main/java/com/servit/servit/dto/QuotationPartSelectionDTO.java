package com.servit.servit.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class QuotationPartSelectionDTO {
    private String repairTicketId;
    private String technicianRecommendedPartId;
    private List<AlternativePartDTO> alternativeParts;
    private String selectionReason; // TECHNICIAN_RECOMMENDED, CUSTOMER_UPGRADE, COST_EFFECTIVE, etc.
    private String quotationId;
    
    @Data
    public static class AlternativePartDTO {
        private Long partId;
        private String partNumber;
        private String name;
        private String description;
        private BigDecimal unitCost;
        private String brand;
        private Integer availableStock;
        private String compatibility; // COMPATIBLE, UPGRADE, DOWNGRADE
        private Integer priority; // For carousel ordering
    }
} 