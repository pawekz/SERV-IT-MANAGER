package com.servit.servit.repository;

import com.servit.servit.entity.PartNumberStockTrackingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartNumberStockTrackingRepository extends JpaRepository<PartNumberStockTrackingEntity, Long> {
    
    Optional<PartNumberStockTrackingEntity> findByPartNumber(String partNumber);
    
    // Find all part numbers that are at or below threshold (excluding zero stock)
    @Query("SELECT p FROM PartNumberStockTrackingEntity p WHERE " +
           "p.currentAvailableStock > 0 AND " +
           "p.currentAvailableStock <= p.lowStockThreshold AND " +
           "p.currentTotalStock > 0")
    List<PartNumberStockTrackingEntity> findLowStockPartNumbers();
    
    // Find part numbers by priority level
    List<PartNumberStockTrackingEntity> findByPriorityLevelOrderByCurrentAvailableStockAsc(String priorityLevel);
    
    // Find part numbers by category - REMOVED: category field no longer exists
    
    // Manual inventory management - no auto-reorder functionality
    @Deprecated
    default List<PartNumberStockTrackingEntity> findPartNumbersNeedingReorder() {
        return List.of(); // Return empty list - manual inventory management
    }
    
    // Find critical low stock items (available stock = 0)
    @Query("SELECT p FROM PartNumberStockTrackingEntity p WHERE p.currentAvailableStock = 0")
    List<PartNumberStockTrackingEntity> findOutOfStockPartNumbers();
    
    // Search part numbers by name or part number
    @Query("SELECT p FROM PartNumberStockTrackingEntity p WHERE " +
           "LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(p.partName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<PartNumberStockTrackingEntity> searchPartNumbers(@Param("searchTerm") String searchTerm);
    
    // Get stock summary statistics (excluding zero stock items)
    @Query("SELECT COUNT(p) FROM PartNumberStockTrackingEntity p WHERE " +
           "p.currentAvailableStock > 0 AND " +
           "p.currentAvailableStock <= p.lowStockThreshold AND " +
           "p.currentTotalStock > 0")
    long countLowStockPartNumbers();
    
    @Query("SELECT COUNT(p) FROM PartNumberStockTrackingEntity p WHERE " +
           "p.currentAvailableStock = 0 AND " +
           "p.currentTotalStock > 0")
    long countOutOfStockPartNumbers();
    
    // Manual inventory management - no automatic alerts
    @Deprecated
    default long countActiveAlerts() {
        return 0; // No automatic alerts in manual management
    }
} 