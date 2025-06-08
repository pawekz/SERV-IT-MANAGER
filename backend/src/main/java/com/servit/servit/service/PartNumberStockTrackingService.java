package com.servit.servit.service;

import com.servit.servit.dto.PartNumberStockSummaryDTO;
import com.servit.servit.dto.UpdatePartNumberStockTrackingDTO;
import com.servit.servit.entity.PartEntity;
import com.servit.servit.entity.PartNumberStockTrackingEntity;
import com.servit.servit.repository.PartNumberStockTrackingRepository;
import com.servit.servit.repository.PartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PartNumberStockTrackingService {
    
    private final PartNumberStockTrackingRepository trackingRepository;
    private final PartRepository partRepository;
    private final NotificationService notificationService;
    
    @Autowired
    public PartNumberStockTrackingService(
            PartNumberStockTrackingRepository trackingRepository,
            PartRepository partRepository,
            NotificationService notificationService) {
        this.trackingRepository = trackingRepository;
        this.partRepository = partRepository;
        this.notificationService = notificationService;
    }
    
    /**
     * Updates or creates stock tracking for a part number by aggregating all parts with that number
     * Excludes deleted parts from calculations
     * 
     * Stock Logic:
     * - Each part with unique serial number = 1 physical item
     * - Total Stock = count of non-deleted parts (not sum of currentStock fields)
     * - This ensures consistent counting when adding single/bulk items
     */
    public PartNumberStockTrackingEntity updateStockTracking(String partNumber) {
        // Get all non-deleted parts with this part number
        List<PartEntity> parts = partRepository.findAllByPartNumber(partNumber)
                .stream()
                .filter(part -> part.getIsDeleted() == null || !part.getIsDeleted())
                .collect(Collectors.toList());
        
        if (parts.isEmpty()) {
            // If no non-deleted parts exist, we should remove or mark the tracking as inactive
            // For now, we'll keep the tracking but set stock to 0
            PartNumberStockTrackingEntity tracking = trackingRepository.findByPartNumber(partNumber)
                    .orElse(new PartNumberStockTrackingEntity());
            
            if (tracking.getTrackingId() == null) {
                tracking.setPartNumber(partNumber);
                tracking.setPartName("No active parts");
            }
            
            tracking.setCurrentTotalStock(0);
            tracking.setCurrentAvailableStock(0);
            tracking.setTotalPartsCount(0);
            tracking.setLastStockUpdate(LocalDateTime.now());
            
            return trackingRepository.save(tracking);
        }
        
        // Get or create tracking entity
        PartNumberStockTrackingEntity tracking = trackingRepository.findByPartNumber(partNumber)
                .orElse(new PartNumberStockTrackingEntity());
        
        // Set basic info if new
        if (tracking.getTrackingId() == null) {
            tracking.setPartNumber(partNumber);
            tracking.setPartName(parts.get(0).getName()); // Use name from first part
            tracking.setLowStockThreshold(5); // Default threshold if not set
        }
        
        // Aggregate stock information from non-deleted parts only
        // Each part with unique serial number represents 1 physical item
        int totalStock = parts.size(); // Count of individual parts
        int totalReserved = parts.stream().mapToInt(part -> part.getReservedQuantity() != null ? part.getReservedQuantity() : 0).sum();
        int availableStock = totalStock - totalReserved;
        
        // Log stock calculation for debugging
        logger.info("Stock calculation for part number: {}", partNumber);
        logger.info("  - Active parts count: {}", parts.size());
        logger.info("  - Total stock (count of parts): {}", totalStock);
        logger.info("  - Total reserved: {}", totalReserved);
        logger.info("  - Available stock: {}", availableStock);
        logger.info("  - Low stock threshold: {}", tracking.getLowStockThreshold());
        
        // Update tracking entity
        tracking.setCurrentTotalStock(totalStock);
        tracking.setCurrentAvailableStock(availableStock);
        tracking.setTotalPartsCount(parts.size());
        tracking.setLastStockUpdate(LocalDateTime.now());
        
        // Stock tracking updated - alerts are now manual
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Checks if a part number is low stock (for manual alerts)
     */
    private boolean isLowStock(PartNumberStockTrackingEntity tracking) {
        return tracking.getCurrentAvailableStock() < tracking.getLowStockThreshold();
    }
    
    /**
     * Updates stock tracking settings for a part number
     */
    public PartNumberStockTrackingEntity updateTrackingSettings(UpdatePartNumberStockTrackingDTO dto) {
        Optional<PartNumberStockTrackingEntity> existingOpt = trackingRepository.findByPartNumber(dto.getPartNumber());
        
        PartNumberStockTrackingEntity tracking;
        if (existingOpt.isPresent()) {
            tracking = existingOpt.get();
        } else {
            // Create new tracking if doesn't exist
            tracking = new PartNumberStockTrackingEntity();
            tracking.setPartNumber(dto.getPartNumber());
            // Initialize stock data
            updateStockTracking(dto.getPartNumber());
        }
        
        // Update settings
        if (dto.getPartName() != null) tracking.setPartName(dto.getPartName());
        if (dto.getLowStockThreshold() != null) tracking.setLowStockThreshold(dto.getLowStockThreshold());
        if (dto.getPriorityLevel() != null) tracking.setPriorityLevel(dto.getPriorityLevel());
        if (dto.getNotes() != null) tracking.setNotes(dto.getNotes());
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Gets all low stock part numbers
     */
    public List<PartNumberStockSummaryDTO> getLowStockPartNumbers() {
        List<PartNumberStockTrackingEntity> lowStockItems = trackingRepository.findLowStockPartNumbers();
        return lowStockItems.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Gets stock summary for a specific part number
     */
    public PartNumberStockSummaryDTO getStockSummary(String partNumber) {
        Optional<PartNumberStockTrackingEntity> trackingOpt = trackingRepository.findByPartNumber(partNumber);
        
        if (trackingOpt.isPresent()) {
            return convertToSummaryDTO(trackingOpt.get());
        } else {
            // Create tracking if doesn't exist
            PartNumberStockTrackingEntity tracking = updateStockTracking(partNumber);
            return tracking != null ? convertToSummaryDTO(tracking) : null;
        }
    }
    
    /**
     * Gets all part numbers needing reorder
     */
    public List<PartNumberStockSummaryDTO> getPartNumbersNeedingReorder() {
        List<PartNumberStockTrackingEntity> needingReorder = trackingRepository.findPartNumbersNeedingReorder();
        return needingReorder.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Searches part numbers by name or part number
     */
    public List<PartNumberStockSummaryDTO> searchPartNumbers(String searchTerm) {
        List<PartNumberStockTrackingEntity> results = trackingRepository.searchPartNumbers(searchTerm);
        return results.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Updates stock tracking for all part numbers (batch operation)
     * Only processes part numbers that have active (non-deleted) parts
     */
    public void updateAllStockTracking() {
        List<String> distinctPartNumbers = partRepository.findDistinctPartNumbers();
        
        for (String partNumber : distinctPartNumbers) {
            // Check if this part number has any non-deleted parts
            List<PartEntity> activeParts = partRepository.findAllByPartNumber(partNumber)
                    .stream()
                    .filter(part -> part.getIsDeleted() == null || !part.getIsDeleted())
                    .collect(Collectors.toList());
            
            // Only update tracking if there are active parts
            if (!activeParts.isEmpty()) {
                updateStockTracking(partNumber);
            } else {
                // Mark tracking as inactive if no active parts exist
                Optional<PartNumberStockTrackingEntity> existingTracking = 
                    trackingRepository.findByPartNumber(partNumber);
                if (existingTracking.isPresent()) {
                    PartNumberStockTrackingEntity tracking = existingTracking.get();
                    tracking.setCurrentTotalStock(0);
                    tracking.setCurrentAvailableStock(0);
                    tracking.setTotalPartsCount(0);
                    tracking.setLastStockUpdate(LocalDateTime.now());
                    trackingRepository.save(tracking);
                }
            }
        }
    }
    
    /**
     * Manual alert resolution - removed as alerts are now handled manually
     */
    @Deprecated
    public void resolveAlert(String partNumber) {
        // Alert functionality removed - manual inventory management approach
    }
    
    /**
     * Converts entity to DTO with calculated fields
     */
    private PartNumberStockSummaryDTO convertToSummaryDTO(PartNumberStockTrackingEntity tracking) {
        PartNumberStockSummaryDTO dto = new PartNumberStockSummaryDTO();
        
        // Basic fields
        dto.setPartNumber(tracking.getPartNumber());
        dto.setPartName(tracking.getPartName());
        dto.setLowStockThreshold(tracking.getLowStockThreshold());
        dto.setCurrentTotalStock(tracking.getCurrentTotalStock());
        dto.setCurrentAvailableStock(tracking.getCurrentAvailableStock());
        dto.setReservedStock(tracking.getCurrentTotalStock() - tracking.getCurrentAvailableStock());
        dto.setTotalPartsCount(tracking.getTotalPartsCount());
        dto.setPriorityLevel(tracking.getPriorityLevel());
        dto.setLastStockUpdate(tracking.getLastStockUpdate());
        
        // Calculate suppliers count and category from parts data
        List<PartEntity> parts = partRepository.findAllByPartNumber(tracking.getPartNumber())
                .stream()
                .filter(part -> part.getIsDeleted() == null || !part.getIsDeleted())
                .collect(Collectors.toList());
        
        long uniqueSuppliers = parts.stream()
                .map(PartEntity::getSupplierName)
                .filter(supplier -> supplier != null && !supplier.trim().isEmpty())
                .distinct()
                .count();
        dto.setSuppliersCount((int) uniqueSuppliers);
        
        // Category field removed from entity
        dto.setNotes(tracking.getNotes());
        
        // Calculated fields
        dto.setStockStatus(calculateStockStatus(tracking));
        dto.setAlertLevel(calculateAlertLevel(tracking));
        dto.setNeedsReorder(false); // Manual inventory management - no auto-reorder
        
        // Get available suppliers from the already calculated parts data
        List<String> suppliers = parts.stream()
                .map(PartEntity::getSupplierName)
                .filter(supplier -> supplier != null && !supplier.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());
        dto.setAvailableSuppliers(suppliers);
        
        // Add sum of currentStock fields for reference
        int stockSum = parts.stream().mapToInt(PartEntity::getCurrentStock).sum();
        dto.setTotalStockSum(stockSum);
        
        return dto;
    }
    
    private String calculateStockStatus(PartNumberStockTrackingEntity tracking) {
        if (tracking.getCurrentAvailableStock() == 0) return "CRITICAL";
        if (tracking.getCurrentAvailableStock() < tracking.getLowStockThreshold()) return "LOW";
        if (tracking.getCurrentAvailableStock() < tracking.getLowStockThreshold() * 2) return "NORMAL";
        return "GOOD";
    }
    
    private String calculateAlertLevel(PartNumberStockTrackingEntity tracking) {
        if (tracking.getCurrentAvailableStock() == 0) return "CRITICAL";
        if (tracking.getCurrentAvailableStock() < tracking.getLowStockThreshold()) {
            return tracking.getCurrentAvailableStock() <= (tracking.getLowStockThreshold() * 0.5) ? "HIGH" : "WARNING";
        }
        return "NONE";
    }
    
    // Category functionality removed - method no longer needed
} 