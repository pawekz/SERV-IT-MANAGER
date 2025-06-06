package com.servit.servit.repository;

import com.servit.servit.entity.PartEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<PartEntity, Long> {
    Optional<PartEntity> findByPartNumber(String partNumber);
    
    Optional<PartEntity> findBySerialNumber(String serialNumber);

    List<PartEntity> findByIsDeletedFalse();

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<PartEntity> searchParts(@Param("searchTerm") String searchTerm);

    @Query("SELECT p FROM PartEntity p WHERE p.isDeleted = false AND p.currentStock <= p.lowStockThreshold")
    List<PartEntity> findLowStockParts();
}
//