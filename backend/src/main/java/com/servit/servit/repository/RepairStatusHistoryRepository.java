package com.servit.servit.repository;

import com.servit.servit.entity.RepairStatusHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairStatusHistoryRepository extends JpaRepository<RepairStatusHistoryEntity, Long> {
    List<RepairStatusHistoryEntity> findByRepairTicketTicketNumberOrderByTimestampDesc(String ticketNumber);
    
    @Query("SELECT h FROM RepairStatusHistoryEntity h WHERE h.repairTicket.customerEmail = :email ORDER BY h.timestamp DESC")
    List<RepairStatusHistoryEntity> findByRepairTicketCustomerEmailOrderByTimestampDesc(@Param("email") String email);
}