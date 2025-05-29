package com.servit.servit.repository;

import com.servit.servit.entity.RepairTicketEntity;
import com.servit.servit.entity.WarrantyEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarrantyRepository extends JpaRepository<WarrantyEntity, Long> {

    @Query(value = "SELECT warranty_expiration FROM part WHERE part.part_id == partId", nativeQuery = true)
    String verifyItemWarranty(@Param("partId") Long partId);

    List<WarrantyEntity> findByCustomerEmail(String email);

    @Query(value = "SELECT warranty_number FROM warranty WHERE warranty_number LIKE 'IOWR-%' ORDER BY warranty_id DESC LIMIT 1", nativeQuery = true)
    String findLastWarrantyNumber();

    @Query("SELECT w FROM WarrantyEntity w WHERE w.customerEmail = :email AND (" +
            "LOWER(CAST(w.warantyNumber AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.customerPhoneNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.returnReason) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.reportedIssue) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.status) LIKE LOWER(CONCAT('%', :searchTerm, '%'))" +
            ")")
    Page<WarrantyEntity> searchWarrantiesByEmail(
            @Param("email") String email, @Param("searchTerm") String searchTerm, Pageable pageable);

}
