package com.servit.servit.repository;

import com.servit.servit.entity.RepairTicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairTicketRepository extends JpaRepository<RepairTicketEntity, Integer> {
    Optional<RepairTicketEntity> findByTicketNumber(String ticketNumber);

    @Query(value = "SELECT ticket_number FROM repair_ticket WHERE ticket_number LIKE 'IORT-%' ORDER BY repair_ticket_id DESC LIMIT 1", nativeQuery = true)
    String findLastTicketNumber();

    List<RepairTicketEntity> findByCustomerEmail(String email);
}
