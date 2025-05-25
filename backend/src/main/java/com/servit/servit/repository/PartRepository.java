package com.servit.servit.repository;

import com.servit.servit.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    // Spring Data JPA automatically provides basic CRUD operations (save, findById, findAll, delete, etc.)

    // You can add custom query methods here if needed, for example:
    Optional<Part> findByPartNumber(String partNumber);
    
    Optional<Part> findBySerialNumber(String serialNumber);
    
    List<Part> findByActiveTrue();
    
    @Query("SELECT p FROM Part p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Part> searchParts(@Param("searchTerm") String searchTerm);
    
    @Query("SELECT p FROM Part p WHERE p.active = true AND p.currentStock <= p.minimumStock")
    List<Part> findLowStockParts();
} 