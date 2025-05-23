package com.servit.servit.repository;

import com.servit.servit.entity.RepairTicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RepairTicketRepository extends JpaRepository<RepairTicketEntity, Integer> {
    Optional<RepairTicketEntity> findByTicketNumber(String ticketNumber);
}
