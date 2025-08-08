
package com.servit.servit.dto.feedback;

import lombok.Data;

@Data
public class FeedbackRequestDTO {
    private Integer rating;
    private String comments;
    private Long repairTicketId;
    private boolean anonymous;
} 
