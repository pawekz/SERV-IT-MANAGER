package com.servit.servit.repository;

import com.servit.servit.entity.PartEntity;
import com.servit.servit.entity.WarrantyEntity;
import com.servit.servit.enumeration.PartEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<PartEntity, Long> {
    Optional<PartEntity> findByPartNumber(String partNumber);
    
    List<PartEntity> findAllByPartNumber(String partNumber);
    
    @Query("SELECT DISTINCT p.partNumber FROM PartEntity p WHERE p.isDeleted = false")
    List<String> findDistinctPartNumbers();

    Optional<PartEntity> findByWarranty(WarrantyEntity warranty);
    
    Optional<PartEntity> findBySerialNumber(String serialNumber);

    List<PartEntity> findByIsDeletedFalse();
    
    List<PartEntity> findByPartTypeAndIsDeletedFalse(PartEnum partType);
    
    List<PartEntity> findByIsReservedTrueAndIsDeletedFalse();
    
    List<PartEntity> findByReservedForTicketIdAndIsDeletedFalse(String ticketId);

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.serialNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<PartEntity> searchParts(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
            "((p.currentStock - COALESCE(p.reservedQuantity, 0)) > 0)")
    List<PartEntity> findPartsWithAvailableStock();
    
    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
            "p.partType = :partType AND " +
            "((p.currentStock - COALESCE(p.reservedQuantity, 0)) > 0)")
    List<PartEntity> findAvailablePartsByType(@Param("partType") PartEnum partType);
    
    @Query("SELECT COUNT(p) FROM PartEntity p WHERE p.isDeleted = false")
    Long countActiveParts();
    
    @Query("SELECT SUM(p.currentStock) FROM PartEntity p WHERE p.isDeleted = false")
    Long getTotalStock();

    // Warranty-related queries
    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND p.isCustomerPurchased = true")
    List<PartEntity> findCustomerPurchasedParts();

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
           "p.isCustomerPurchased = true AND p.warrantyExpiration IS NOT NULL AND " +
           "p.warrantyExpiration < CURRENT_TIMESTAMP")
    List<PartEntity> findExpiredWarrantyParts();

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
           "p.isCustomerPurchased = true AND p.warrantyExpiration IS NOT NULL AND " +
           "p.warrantyExpiration BETWEEN CURRENT_TIMESTAMP AND :expirationDate")
    List<PartEntity> findPartsWithWarrantyExpiringBefore(@Param("expirationDate") LocalDateTime expirationDate);

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
           "p.isCustomerPurchased = true AND p.warrantyExpiration IS NOT NULL AND " +
           "p.warrantyExpiration > CURRENT_TIMESTAMP")
    List<PartEntity> findPartsWithValidWarranty();

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND p.isReserved = false AND p.isCustomerPurchased = false AND p.partType = com.servit.servit.enumeration.PartEnum.STANDARD AND (p.quotationPart = 0 OR p.quotationPart IS NULL) AND p.datePurchasedByCustomer IS NULL AND p.reservedForTicketId IS NULL AND p.supplierName IS NULL AND p.supplierPartNumber IS NULL AND p.supplierOrderDate IS NULL AND p.supplierExpectedDelivery IS NULL AND p.supplierActualDelivery IS NULL AND p.warrantyExpiration IS NULL AND p.warranty IS NULL")
    List<PartEntity> findEligiblePartsForQuotation();
} 