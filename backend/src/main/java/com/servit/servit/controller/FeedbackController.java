package com.servit.servit.controller;

import com.servit.servit.dto.FeedbackRequestDTO;
import com.servit.servit.entity.FeedbackEntity;
import com.servit.servit.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping("/getAllRatings")
    public ResponseEntity<Map<Integer, Long>> getAllRatings() {
        Map<Integer, Long> ratings = feedbackService.getAllRatings();
        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/getAllFeedback")
    public ResponseEntity<List<FeedbackEntity>> getAllFeedback() {
        List<FeedbackEntity> feedbackList = feedbackService.getAllFeedback();
        return ResponseEntity.ok(feedbackList);
    }

    @PostMapping("/submitFeedback")
    public ResponseEntity<?> submitFeedback(@RequestBody FeedbackRequestDTO feedbackRequestDTO) {
        try {
            FeedbackEntity feedback = feedbackService.submitFeedback(feedbackRequestDTO);
            return ResponseEntity.ok(feedback);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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