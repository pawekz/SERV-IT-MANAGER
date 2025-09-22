package com.servit.servit.repository;

import com.servit.servit.entity.WarrantyEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarrantyRepository extends JpaRepository<WarrantyEntity, Long> {

    Optional<WarrantyEntity> findByWarrantyNumber(String warrantyNumber);

    List<WarrantyEntity> findByCustomerEmail(String email);

    @Query(value = "SELECT warranty_number FROM warranty WHERE warranty_number LIKE 'IORMA-%' ORDER BY warranty_id DESC LIMIT 1", nativeQuery = true)
    String findLastWarrantyNumber();

    @Query("SELECT w FROM WarrantyEntity w WHERE w.customerEmail = :email AND (" +
            "LOWER(CAST(w.warrantyNumber AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.customerPhoneNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.returnReason) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.reportedIssue) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(w.status) LIKE LOWER(CONCAT('%', :searchTerm, '%'))" +
            ")")
    Page<WarrantyEntity> searchWarrantiesByEmail(
            @Param("email") String email, @Param("searchTerm") String searchTerm, Pageable pageable);

    @Query("SELECT COUNT(w) FROM WarrantyEntity w WHERE w.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<com.servit.servit.enumeration.WarrantyStatus> statuses);

}
