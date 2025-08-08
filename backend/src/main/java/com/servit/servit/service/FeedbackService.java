package com.servit.servit.service;

import com.servit.servit.dto.feedback.FeedbackRequestDTO;
import com.servit.servit.entity.FeedbackEntity;
import com.servit.servit.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;

    @Autowired
    public FeedbackService(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    public List<FeedbackEntity> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public Map<Integer, Long> getAllRatings() {
        List<FeedbackEntity> allFeedback = feedbackRepository.findAll();
        return allFeedback.stream()
                .collect(Collectors.groupingBy(
                    FeedbackEntity::getRating,
                    Collectors.counting()
                ));
    }

    public FeedbackEntity submitFeedback(FeedbackRequestDTO feedbackRequestDTO) {
        // Check if feedback already exists for this ticket
        feedbackRepository.findByRepairTicketId(feedbackRequestDTO.getRepairTicketId())
                .ifPresent(existing -> { throw new IllegalStateException("Feedback already submitted for this ticket"); });

        FeedbackEntity feedback = new FeedbackEntity();
        feedback.setRating(feedbackRequestDTO.getRating());
        feedback.setComments(feedbackRequestDTO.getComments());
        feedback.setRepairTicketId(feedbackRequestDTO.getRepairTicketId());
        feedback.setAnonymous(feedbackRequestDTO.isAnonymous());

        // TODO: Implement logic to get customerId from authenticated user context if not anonymous
        if (!feedbackRequestDTO.isAnonymous()) {
            // Example: Assuming customerId can be obtained from a security context or similar
            // feedback.setCustomerId(getCurrentAuthenticatedUserId());
        }

        // TODO: Implement logic to get technicianId based on the repairTicketId
        // This would likely involve querying the repair ticket to find the assigned technician
        // Long technicianId = getTechnicianIdForRepairTicket(feedbackRequestDTO.getRepairTicketId());
        // feedback.setTechnicianId(technicianId);

        return feedbackRepository.save(feedback);
    }

    public FeedbackEntity updateFeedback(Long id, FeedbackRequestDTO feedbackRequestDTO) {
        Optional<FeedbackEntity> existingFeedbackOptional = feedbackRepository.findById(id);

        if (existingFeedbackOptional.isPresent()) {
            FeedbackEntity existingFeedback = existingFeedbackOptional.get();

            if (feedbackRequestDTO.getRating() != null) {
                existingFeedback.setRating(feedbackRequestDTO.getRating());
            }
            if (feedbackRequestDTO.getComments() != null) {
                existingFeedback.setComments(feedbackRequestDTO.getComments());
            }
            // Note: We might not want to allow updating repairTicketId or anonymous flag via PATCH
            // Consider carefully which fields should be updatable.

            return feedbackRepository.save(existingFeedback);
        } else {
            // Handle case where feedback with the given id is not found
            // For now, returning null, but could throw a custom exception
            return null;
        }
    }
}