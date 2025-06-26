package com.servit.servit.repository;

import com.servit.servit.entity.FeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<FeedbackEntity, Long> {
    // Custom query methods can be added here if needed
    Optional<FeedbackEntity> findByRepairTicketId(Long repairTicketId);
}