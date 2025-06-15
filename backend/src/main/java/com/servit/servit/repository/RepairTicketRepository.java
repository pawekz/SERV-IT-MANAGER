package com.servit.servit.repository;

import com.servit.servit.entity.RepairTicketEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairTicketRepository extends JpaRepository<RepairTicketEntity, Integer> {
    Optional<RepairTicketEntity> findByTicketNumber(String ticketNumber);

    @Query(value = "SELECT ticket_number FROM repair_ticket WHERE ticket_number LIKE 'IORT-%' ORDER BY repair_ticket_id DESC LIMIT 1", nativeQuery = true)
    String findLastTicketNumber();

    List<RepairTicketEntity> findByCustomerEmail(String email);

    @Query("SELECT r FROM RepairTicketEntity r WHERE " +
            "LOWER(r.ticketNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.customerEmail) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.deviceSerialNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.deviceModel) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.deviceBrand) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.reportedIssue) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<RepairTicketEntity> searchRepairTickets(@Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT r FROM RepairTicketEntity r WHERE r.customerEmail = :email AND (" +
            "LOWER(r.ticketNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.deviceSerialNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.deviceModel) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.deviceBrand) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(r.reportedIssue) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<RepairTicketEntity> searchRepairTicketsByEmail(@Param("email") String email, @Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT r FROM RepairTicketEntity r WHERE r.repairStatus IN ('RECEIVED', 'DIAGNOSING', 'AWAITING_PARTS', 'REPAIRING', 'READY_FOR_PICKUP')")
    Page<RepairTicketEntity> findActiveRepairTickets(Pageable pageable);
}
