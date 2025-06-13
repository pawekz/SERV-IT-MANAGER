package com.servit.servit.repository;

import com.servit.servit.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);

    Page<NotificationEntity> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail, Pageable pageable);
    Page<NotificationEntity> findByRecipientEmailAndIsReadFalseOrderByCreatedAtDesc(String recipientEmail, Pageable pageable);
}