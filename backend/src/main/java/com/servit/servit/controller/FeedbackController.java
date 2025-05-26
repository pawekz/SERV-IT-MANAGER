package com.servit.servit.controller;

import com.servit.servit.dto.FeedbackRequestDTO;
import com.servit.servit.entity.FeedbackEntity;
import com.servit.servit.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("/submitFeedback")
    public ResponseEntity<FeedbackEntity> submitFeedback(@RequestBody FeedbackRequestDTO feedbackRequestDTO) {
        FeedbackEntity feedback = feedbackService.submitFeedback(feedbackRequestDTO);
        return ResponseEntity.ok(feedback);
    }

    @PatchMapping("/updateFeedback/{id}")
    public ResponseEntity<FeedbackEntity> updateFeedback(
            @PathVariable Long id,
            @RequestBody FeedbackRequestDTO feedbackRequestDTO) {
        FeedbackEntity updatedFeedback = feedbackService.updateFeedback(id, feedbackRequestDTO);
        if (updatedFeedback == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedFeedback);
    }
} 