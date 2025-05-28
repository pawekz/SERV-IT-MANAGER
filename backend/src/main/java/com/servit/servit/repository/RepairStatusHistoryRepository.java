package com.servit.servit.repository;

import com.servit.servit.entity.RepairStatusHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairStatusHistoryRepository extends JpaRepository<RepairStatusHistoryEntity, Long> {
    List<RepairStatusHistoryEntity> findByRepairTicketTicketNumberOrderByTimestampDesc(String ticketNumber);
}