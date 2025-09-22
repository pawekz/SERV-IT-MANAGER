package com.servit.servit.dto.repairticket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairTicketStatusDistributionDTO {
    private List<StatusCountDTO> statusCounts;
    private int totalTickets;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCountDTO {
        private String status;
        private int count;
        private double percentage;
    }
}

