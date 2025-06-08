package com.servit.servit.service;

import com.servit.servit.entity.PartEntity;
import com.servit.servit.repository.PartRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.servit.servit.dto.AddPartRequestDTO;
import com.servit.servit.dto.PartResponseDTO;
import com.servit.servit.dto.UpdatePartRequestDTO;
import com.servit.servit.dto.UpdatePartNumberStockTrackingDTO;
import com.servit.servit.dto.BulkAddPartRequestDTO;
import com.servit.servit.dto.ReservePartRequestDTO;
import com.servit.servit.dto.PartNumberStockSummaryDTO;
import com.servit.servit.enumeration.PartEnum;
import com.servit.servit.service.NotificationService;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.entity.UserEntity;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service class for managing parts/inventory items in the system.
 * Handles all operations related to parts including CRUD, stock management, and search functionality.
 */
@Service
@Transactional
public class PartService {

    private final PartRepository partRepository;
    private final NotificationService notificationService;
    private final PartNumberStockTrackingService stockTrackingService;
    private final UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(PartService.class);

    @Autowired
    public PartService(PartRepository partRepository, NotificationService notificationService, PartNumberStockTrackingService stockTrackingService, UserRepository userRepository) {
        this.partRepository = partRepository;
        this.notificationService = notificationService;
        this.stockTrackingService = stockTrackingService;
        this.userRepository = userRepository;
    }

    // ================ CRUD Operations ================

    /**
     * Creates a new part in the system. Only ADMIN and TECHNICIAN roles can add parts.
     * @param partDto The DTO containing part information to create
     * @return The created part as a DTO
     * @throws IllegalArgumentException if serial number already exists
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public PartResponseDTO addpart(AddPartRequestDTO partDto) {
        logger.info("Adding new part: {}", partDto);
        // Check for duplicate serial number instead of part number
        if (partRepository.findBySerialNumber(partDto.getSerialNumber()).isPresent()) {
            throw new IllegalArgumentException("Serial number already exists");
        }
        
        String currentUser = getCurrentUserEmail();
        
        PartEntity partEntity = new PartEntity();
        partEntity.setPartNumber(partDto.getPartNumber());
        partEntity.setName(partDto.getName());
        partEntity.setDescription(partDto.getDescription());
        partEntity.setUnitCost(partDto.getUnitCost());
        // Default to 1 if currentStock is null or 0 (since we're adding 1 item)
        partEntity.setCurrentStock(partDto.getCurrentStock() != null && partDto.getCurrentStock() > 0 ? 
                                  partDto.getCurrentStock() : 1);
        // Low stock threshold is now managed in PartNumberStockTrackingEntity
        partEntity.setSerialNumber(partDto.getSerialNumber());
        partEntity.setPartType(partDto.getPartType() != null ? partDto.getPartType() : PartEnum.STANDARD);
        // dateAdded is handled by @CreationTimestamp annotation - don't set manually
        // Only set datePurchasedByCustomer if it's actually provided (not null)
        if (partDto.getDatePurchasedByCustomer() != null) {
            partEntity.setDatePurchasedByCustomer(partDto.getDatePurchasedByCustomer());
        }
        partEntity.setWarrantyExpiration(partDto.getWarrantyExpiration());
        partEntity.setAddedBy(currentUser);
        
        // Set supplier information if it's a supplier replacement part
        if (partDto.getPartType() == PartEnum.SUPPLIER_REPLACEMENT) {
            partEntity.setSupplierName(partDto.getSupplierName());
            partEntity.setSupplierPartNumber(partDto.getSupplierPartNumber());
            partEntity.setSupplierOrderDate(partDto.getSupplierOrderDate());
            partEntity.setSupplierExpectedDelivery(partDto.getSupplierExpectedDelivery());
        }

        PartEntity savedPartEntity = partRepository.save(partEntity);
        
        // Update stock tracking for this part number
        stockTrackingService.updateStockTracking(savedPartEntity.getPartNumber());
        
        // If low stock threshold was provided, update the tracking entity
        if (partDto.getLowStockThreshold() != null) {
            UpdatePartNumberStockTrackingDTO trackingDto = new UpdatePartNumberStockTrackingDTO();
            trackingDto.setPartNumber(savedPartEntity.getPartNumber());
            trackingDto.setLowStockThreshold(partDto.getLowStockThreshold());
            stockTrackingService.updateTrackingSettings(trackingDto);
        }
        
        logger.info("Part added successfully: {}", savedPartEntity);
        return convertToDto(savedPartEntity);
    }

    /**
     * Creates multiple parts with the same part number but different serial numbers.
     * All parts will have the same part number for proper stock tracking aggregation.
     * Only ADMIN and TECHNICIAN roles can add parts.
     * @param bulkDto The DTO containing bulk part information
     * @return List of created parts as DTOs
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public List<PartResponseDTO> addBulkParts(BulkAddPartRequestDTO bulkDto) {
        logger.info("Adding bulk parts: {}", bulkDto);
        if (!bulkDto.isValid()) {
            throw new IllegalArgumentException("Invalid bulk part request");
        }
        
        String currentUser = getCurrentUserEmail();
        List<PartEntity> partsToSave = new ArrayList<>();
        
        // Use the same part number for all items - this is the key change
        String partNumber = bulkDto.getBasePartNumber();
        
        // First, check for duplicates within the request itself
        Set<String> serialNumbersInRequest = new HashSet<>();
        List<String> duplicatesInRequest = new ArrayList<>();
        
        for (String serialNumber : bulkDto.getSerialNumbers()) {
            if (!serialNumbersInRequest.add(serialNumber)) {
                duplicatesInRequest.add(serialNumber);
            }
        }
        
        if (!duplicatesInRequest.isEmpty()) {
            throw new IllegalArgumentException("Duplicate serial numbers found in request: " + 
                String.join(", ", duplicatesInRequest));
        }
        
        // Then check for duplicates against the database
        List<String> conflictingSerialNumbers = new ArrayList<>();
        
        for (String serialNumber : bulkDto.getSerialNumbers()) {
            if (partRepository.findBySerialNumber(serialNumber).isPresent()) {
                conflictingSerialNumbers.add(serialNumber);
            }
        }
        
        if (!conflictingSerialNumbers.isEmpty()) {
            throw new IllegalArgumentException("Serial number(s) already exist in database: " + 
                String.join(", ", conflictingSerialNumbers));
        }
        
        for (int i = 0; i < bulkDto.getSerialNumbers().size(); i++) {
            String serialNumber = bulkDto.getSerialNumbers().get(i);
            
            PartEntity partEntity = new PartEntity();
            partEntity.setPartNumber(partNumber); // Same part number for all items
            partEntity.setName(bulkDto.getName());
            partEntity.setDescription(bulkDto.getDescription());
            partEntity.setUnitCost(bulkDto.getUnitCost());
            // Each individual part represents 1 physical item
            partEntity.setCurrentStock(1);
            // Low stock threshold is now managed in PartNumberStockTrackingEntity
            partEntity.setSerialNumber(serialNumber); // Unique serial number per item
            partEntity.setPartType(bulkDto.getPartType());
            // dateAdded is handled by @CreationTimestamp annotation - don't set manually
            // Only set datePurchasedByCustomer if it's actually provided (not null)
            if (bulkDto.getDatePurchasedByCustomer() != null) {
                partEntity.setDatePurchasedByCustomer(bulkDto.getDatePurchasedByCustomer());
            }
            partEntity.setWarrantyExpiration(bulkDto.getWarrantyExpiration());
            partEntity.setAddedBy(currentUser);
            
            // Set supplier information if it's a supplier replacement part
            if (bulkDto.getPartType() == PartEnum.SUPPLIER_REPLACEMENT) {
                partEntity.setSupplierName(bulkDto.getSupplierName());
                partEntity.setSupplierPartNumber(bulkDto.getSupplierPartNumber());
                partEntity.setSupplierOrderDate(bulkDto.getSupplierOrderDate());
                partEntity.setSupplierExpectedDelivery(bulkDto.getSupplierExpectedDelivery());
            }
            
            partsToSave.add(partEntity);
        }
        
        List<PartEntity> savedParts = partRepository.saveAll(partsToSave);
        
        // Update stock tracking for the part number (only need to update once since all parts have same part number)
        stockTrackingService.updateStockTracking(partNumber);
        
        // If low stock threshold was provided, update the tracking entity
        if (bulkDto.getLowStockThreshold() != null) {
            UpdatePartNumberStockTrackingDTO trackingDto = new UpdatePartNumberStockTrackingDTO();
            trackingDto.setPartNumber(partNumber);
            trackingDto.setLowStockThreshold(bulkDto.getLowStockThreshold());
            stockTrackingService.updateTrackingSettings(trackingDto);
        }
        
        logger.info("Bulk parts added successfully: {} parts with part number: {}", savedParts.size(), partNumber);
        return savedParts.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    /**
     * Updates an existing part. Only ADMIN role can update parts.
     * @param id The ID of the part to update
     * @param partDto The DTO containing updated part information
     * @return The updated part as a DTO
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if new part number conflicts with existing parts
     */
    @PreAuthorize("hasRole('ADMIN')")
    public PartResponseDTO updatePart(Long id, UpdatePartRequestDTO partDto) {
        logger.info("Updating part with id: {}", id);
        PartEntity existingPartEntity = partRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + id));

        // Check for duplicate serial number if it's being changed
        if (partDto.getSerialNumber() != null && 
            !existingPartEntity.getSerialNumber().equals(partDto.getSerialNumber()) &&
            partRepository.findBySerialNumber(partDto.getSerialNumber()).isPresent()) {
            throw new IllegalArgumentException("Serial number already exists");
        }

        String currentUser = getCurrentUserEmail();

        // Update fields from DTO if they are not null (partial update support)
        if (partDto.getPartNumber() != null) existingPartEntity.setPartNumber(partDto.getPartNumber());
        if (partDto.getName() != null) existingPartEntity.setName(partDto.getName());
        if (partDto.getDescription() != null) existingPartEntity.setDescription(partDto.getDescription());
        if (partDto.getUnitCost() != null) existingPartEntity.setUnitCost(partDto.getUnitCost());
        if (partDto.getCurrentStock() != null) existingPartEntity.setCurrentStock(partDto.getCurrentStock());
        // Low stock threshold is now managed in PartNumberStockTrackingEntity
        if (partDto.getLowStockThreshold() != null) {
            // Create DTO to update the tracking entity with the new threshold
            UpdatePartNumberStockTrackingDTO trackingDto = new UpdatePartNumberStockTrackingDTO();
            trackingDto.setPartNumber(existingPartEntity.getPartNumber());
            trackingDto.setLowStockThreshold(partDto.getLowStockThreshold());
            stockTrackingService.updateTrackingSettings(trackingDto);
        }
        if (partDto.getSerialNumber() != null) existingPartEntity.setSerialNumber(partDto.getSerialNumber());
        if (partDto.getPartType() != null) existingPartEntity.setPartType(partDto.getPartType());
        if (partDto.getIsDeleted() != null) existingPartEntity.setIsDeleted(partDto.getIsDeleted());
        // dateAdded should never be changed after creation - managed by @CreationTimestamp
        // Only update datePurchasedByCustomer if it's actually provided
        if (partDto.getDatePurchasedByCustomer() != null) existingPartEntity.setDatePurchasedByCustomer(partDto.getDatePurchasedByCustomer());
        if (partDto.getWarrantyExpiration() != null) existingPartEntity.setWarrantyExpiration(partDto.getWarrantyExpiration());
        if (partDto.getAddedBy() != null) existingPartEntity.setAddedBy(partDto.getAddedBy());
        
        // Update supplier information
        if (partDto.getSupplierName() != null) existingPartEntity.setSupplierName(partDto.getSupplierName());
        if (partDto.getSupplierPartNumber() != null) existingPartEntity.setSupplierPartNumber(partDto.getSupplierPartNumber());
        if (partDto.getSupplierOrderDate() != null) existingPartEntity.setSupplierOrderDate(partDto.getSupplierOrderDate());
        if (partDto.getSupplierExpectedDelivery() != null) existingPartEntity.setSupplierExpectedDelivery(partDto.getSupplierExpectedDelivery());
        if (partDto.getSupplierActualDelivery() != null) existingPartEntity.setSupplierActualDelivery(partDto.getSupplierActualDelivery());
        
        // Set modified by
        existingPartEntity.setModifiedBy(currentUser);

        PartEntity updatedPartEntity = partRepository.save(existingPartEntity);
        
        // Update stock tracking for this part number
        stockTrackingService.updateStockTracking(updatedPartEntity.getPartNumber());
        
        logger.info("Part updated successfully: {}", updatedPartEntity);
        return convertToDto(updatedPartEntity);
    }

    /**
     * Soft deletes a part by marking it as deleted. Only ADMIN role can delete parts.
     * @param partId The ID of the part to delete
     * @throws EntityNotFoundException if part not found
     * @throws IllegalStateException if part is already deleted or reserved
     */
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePart(Long partId) {
        logger.info("Deleting part with id: {}", partId);
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with partId: " + partId));
        
        if (partEntity.getIsDeleted()) {
            throw new IllegalStateException("Part is already deleted");
        }
        
        if (partEntity.getIsReserved() && partEntity.getReservedQuantity() > 0) {
            throw new IllegalStateException("Cannot delete part that has reserved stock");
        }
        
        partEntity.setIsDeleted(true);
        partEntity.setModifiedBy(getCurrentUserEmail());
        partRepository.save(partEntity);
    }

    // ================ Search Operations ================

    /**
     * Retrieves a part by its ID. All authenticated users can view parts.
     * @param id The ID of the part to find
     * @return Optional containing the part as a DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<PartResponseDTO> getPartById(Long id) {
        logger.info("Retrieving part with id: {}", id);
        return partRepository.findById(id).map(this::convertToDto);
    }

    /**
     * Retrieves a part by its part number. All authenticated users can view parts.
     * @param partNumber The part number to search for
     * @return Optional containing the part as a DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<PartResponseDTO> getPartByPartNumber(String partNumber) {
        logger.info("Retrieving part with part number: {}", partNumber);
        return partRepository.findByPartNumber(partNumber).map(this::convertToDto);
    }

    /**
     * Retrieves a part by its serial number. All authenticated users can view parts.
     * @param serialNumber The serial number to search for
     * @return Optional containing the part as a DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<PartResponseDTO> getPartBySerialNumber(String serialNumber) {
        logger.info("Retrieving part with serial number: {}", serialNumber);
        return partRepository.findBySerialNumber(serialNumber).map(this::convertToDto);
    }

    /**
     * Searches for parts based on a search term. All authenticated users can search parts.
     * @param searchTerm The term to search for
     * @return List of matching parts as DTOs
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> searchParts(String searchTerm) {
        logger.info("Searching parts with term: {}", searchTerm);
        return partRepository.searchParts(searchTerm).stream().map(this::convertToDto).collect(Collectors.toList());
    }

    // ================ List Operations ================

    /**
     * Retrieves all parts. All authenticated users can view parts.
     * @return List of parts as DTOs
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> getAllParts() {
        logger.info("Retrieving all parts");
        return partRepository.findByIsDeletedFalse().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all parts where the part number has available stock. All authenticated users can view parts.
     * @return List of parts from part numbers that have available stock
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> getAvailableParts() {
        logger.info("Retrieving all parts with available stock at part number level");
        
        // Get all active parts
        List<PartEntity> allParts = partRepository.findByIsDeletedFalse();
        
        // Filter by part numbers that have available stock
        return allParts.stream()
                .filter(part -> {
                    try {
                        // Check if this part number has available stock
                        PartNumberStockSummaryDTO stockSummary = stockTrackingService.getStockSummary(part.getPartNumber());
                        return stockSummary != null && stockSummary.getCurrentAvailableStock() > 0;
                    } catch (Exception e) {
                        logger.warn("Could not get stock summary for part number: {}", part.getPartNumber());
                        return false;
                    }
                })
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all parts from part numbers with low stock. All authenticated users can view low stock parts.
     * @return List of parts from part numbers that have low stock
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> getLowStockParts() {
        logger.info("Retrieving all parts with low stock at part number level");
        
        // Get low stock part numbers from tracking service
        List<PartNumberStockSummaryDTO> lowStockPartNumbers = stockTrackingService.getLowStockPartNumbers();
        
        if (lowStockPartNumbers.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Get all parts for these part numbers
        List<PartEntity> lowStockParts = new ArrayList<>();
        for (PartNumberStockSummaryDTO lowStockSummary : lowStockPartNumbers) {
            List<PartEntity> partsForNumber = partRepository.findAllByPartNumber(lowStockSummary.getPartNumber())
                    .stream()
                    .filter(part -> part.getIsDeleted() == null || !part.getIsDeleted())
                    .collect(Collectors.toList());
            lowStockParts.addAll(partsForNumber);
        }
        
        return lowStockParts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // ================ Stock Management ================

    /**
     * Updates the stock level of a part. Only ADMIN and TECHNICIAN roles can update stock.
     * @param partId The ID of the part
     * @param quantity The quantity to add (positive) or subtract (negative)
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if resulting stock would be negative
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public void updateStock(Long partId, int quantity) {
        logger.info("Updating stock for part with id: {}", partId);
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        int newStock = partEntity.getCurrentStock() + quantity;
        if (newStock < 0) {
            throw new IllegalArgumentException("Insufficient stock for part: " + partEntity.getPartNumber());
        }
        
        partEntity.setCurrentStock(newStock);
        partEntity.setModifiedBy(getCurrentUserEmail());
        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId); // Check low stock after updating stock
    }

    /**
     * Adjusts stock based on operation type. Only ADMIN and TECHNICIAN roles can adjust stock.
     * @param partId The ID of the part
     * @param quantity The quantity to adjust
     * @param operationType The type of operation ("add" or "subtract")
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if operation type is invalid or resulting stock would be negative
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public void adjustStock(Long partId, int quantity, String operationType) {
        logger.info("Adjusting stock for part with id: {}, quantity: {}, operationType: {}", partId, quantity, operationType);
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));

        switch (operationType.toLowerCase()) {
            case "add":
                partEntity.setCurrentStock(partEntity.getCurrentStock() + quantity);
                break;
            case "subtract":
                int newStock = partEntity.getCurrentStock() - quantity;
                if (newStock < 0) {
                    throw new IllegalArgumentException("Insufficient stock for part: " + partEntity.getPartNumber());
                }
                partEntity.setCurrentStock(newStock);
                break;
            default:
                throw new IllegalArgumentException("Invalid operation type: " + operationType);
        }

        partEntity.setModifiedBy(getCurrentUserEmail());
        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId); // Check low stock after adjusting stock
    }

    // ================ Reservation Management ================

    /**
     * Reserves parts for a specific ticket/quotation. Only ADMIN and TECHNICIAN roles can reserve parts.
     * @param reserveRequest The reservation request details
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if insufficient available stock
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public void reservePart(ReservePartRequestDTO reserveRequest) {
        logger.info("Reserving parts for ticket/quotation with id: {}", reserveRequest.getReservedForTicketId());
        PartEntity partEntity = partRepository.findById(reserveRequest.getPartId())
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + reserveRequest.getPartId()));
        
        int availableStock = partEntity.getCurrentStock() - partEntity.getReservedQuantity();
        if (availableStock < reserveRequest.getQuantity()) {
            throw new IllegalArgumentException("Insufficient available stock for part: " + partEntity.getPartNumber() + 
                                             ". Available: " + availableStock + ", Requested: " + reserveRequest.getQuantity());
        }
        
        partEntity.setIsReserved(true);
        partEntity.setReservedQuantity(partEntity.getReservedQuantity() + reserveRequest.getQuantity());
        partEntity.setReservedForTicketId(reserveRequest.getReservedForTicketId());
        partEntity.setModifiedBy(getCurrentUserEmail());
        
        partRepository.save(partEntity);
    }

    /**
     * Releases previously reserved stock back into available stock. Only ADMIN and TECHNICIAN roles can release stock.
     * @param partId The ID of the part
     * @param quantity The quantity to release
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if trying to release more than reserved
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public void releaseReservedStock(Long partId, int quantity) {
        logger.info("Releasing reserved stock for part with id: {}, quantity: {}", partId, quantity);
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        if (quantity > partEntity.getReservedQuantity()) {
            throw new IllegalArgumentException("Cannot release more than reserved quantity. Reserved: " + 
                                             partEntity.getReservedQuantity() + ", Requested: " + quantity);
        }
        
        partEntity.setReservedQuantity(partEntity.getReservedQuantity() - quantity);
        if (partEntity.getReservedQuantity() == 0) {
            partEntity.setIsReserved(false);
            partEntity.setReservedForTicketId(null);
        }
        partEntity.setModifiedBy(getCurrentUserEmail());
        
        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId); // Check low stock after releasing stock
    }

    /**
     * Confirms the use of reserved parts (removes from both current stock and reserved quantity).
     * Only ADMIN and TECHNICIAN roles can confirm part usage.
     * @param partId The ID of the part
     * @param quantity The quantity to confirm as used
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public void confirmPartUsage(Long partId, int quantity) {
        logger.info("Confirming part usage for part with id: {}, quantity: {}", partId, quantity);
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        if (quantity > partEntity.getReservedQuantity()) {
            throw new IllegalArgumentException("Cannot confirm more than reserved quantity");
        }
        
        partEntity.setCurrentStock(partEntity.getCurrentStock() - quantity);
        partEntity.setReservedQuantity(partEntity.getReservedQuantity() - quantity);
        
        if (partEntity.getReservedQuantity() == 0) {
            partEntity.setIsReserved(false);
            partEntity.setReservedForTicketId(null);
        }
        
        partEntity.setModifiedBy(getCurrentUserEmail());
        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId);
    }

    /**
     * Checks if a part number's stock is low and triggers an alert if necessary.
     * Uses part number level aggregated stock data.
     * @param partId The ID of the part to check (will check its part number)
     * @throws EntityNotFoundException if part not found
     */
    public void checkAndTriggerLowStockAlert(Long partId) {
        logger.info("Checking and triggering low stock alert for part with id: {}", partId);
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        try {
            // Check stock at part number level
            PartNumberStockSummaryDTO stockSummary = stockTrackingService.getStockSummary(partEntity.getPartNumber());
            if (stockSummary != null && 
                stockSummary.getCurrentAvailableStock() <= stockSummary.getLowStockThreshold()) {
                
                // Use the NotificationService for proper low stock alerts
                String alertMessage = String.format("Part Number: %s (%s). Available Stock: %d, Threshold: %d",
                                                   stockSummary.getPartNumber(), stockSummary.getPartName(), 
                                                   stockSummary.getCurrentAvailableStock(), stockSummary.getLowStockThreshold());
                
                notificationService.sendLowStockAlert(alertMessage, stockSummary.getPartName(), 
                                                    stockSummary.getCurrentAvailableStock(), stockSummary.getLowStockThreshold());
            }
        } catch (Exception e) {
            logger.warn("Could not check low stock alert for part number: {}", partEntity.getPartNumber(), e);
        }
    }
    
    // ================ Helper Methods ================
    
    /**
     * Gets the current authenticated user email from the security context.
     * @return The email of the currently authenticated user
     */
    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            String username = authentication.getName();
            
            // Look up the user in the database to get their email
            try {
                UserEntity user = userRepository.findByUsername(username)
                    .orElse(null);
                
                if (user != null) {
                    return user.getEmail(); // Return email instead of username
                }
            } catch (Exception e) {
                // If database lookup fails, fall back to username
                return username;
            }
            
            // Fallback to authentication name (username)
            return username;
        }
        return "system";
    }
    
    /**
     * Helper method to convert Part entity to PartResponseDTO with all calculated fields.
     * @param partEntity The entity to convert
     * @return The converted DTO
     */
    private PartResponseDTO convertToDto(PartEntity partEntity) {
        logger.info("Converting part entity to DTO: {}", partEntity);
        PartResponseDTO dto = new PartResponseDTO();
        dto.setId(partEntity.getPartId());
        dto.setPartNumber(partEntity.getPartNumber());
        dto.setName(partEntity.getName());
        dto.setDescription(partEntity.getDescription());
        dto.setUnitCost(partEntity.getUnitCost());
        // Stock information is managed at part number level, not individual part level
        // Use PartNumberStockTrackingService.getStockSummary() for stock data
        dto.setCurrentStock(1); // Each individual part represents 1 item
        
        // Get low stock threshold from part number level stock tracking
        try {
            PartNumberStockSummaryDTO stockSummary = stockTrackingService.getStockSummary(partEntity.getPartNumber());
            if (stockSummary != null) {
                dto.setLowStockThreshold(stockSummary.getLowStockThreshold());
            } else {
                dto.setLowStockThreshold(10); // Default threshold
            }
        } catch (Exception e) {
            logger.warn("Could not get low stock threshold for part number: {}", partEntity.getPartNumber());
            dto.setLowStockThreshold(10); // Default threshold
        }
        dto.setSerialNumber(partEntity.getSerialNumber());
        dto.setPartType(partEntity.getPartType());
        dto.setIsDeleted(partEntity.getIsDeleted() != null ? partEntity.getIsDeleted() : false);
        dto.setDateAdded(partEntity.getDateAdded());
        dto.setDateModified(partEntity.getDateModified());
        dto.setDatePurchasedByCustomer(partEntity.getDatePurchasedByCustomer());
        dto.setWarrantyExpiration(partEntity.getWarrantyExpiration());
        dto.setAddedBy(partEntity.getAddedBy());
        dto.setModifiedBy(partEntity.getModifiedBy());
        dto.setQuotationPart(partEntity.getQuotationPart());
        dto.setIsReserved(partEntity.getIsReserved());
        dto.setReservedQuantity(partEntity.getReservedQuantity());
        dto.setReservedForTicketId(partEntity.getReservedForTicketId());
        
        // Supplier information
        dto.setSupplierName(partEntity.getSupplierName());
        dto.setSupplierPartNumber(partEntity.getSupplierPartNumber());
        dto.setSupplierOrderDate(partEntity.getSupplierOrderDate());
        dto.setSupplierExpectedDelivery(partEntity.getSupplierExpectedDelivery());
        dto.setSupplierActualDelivery(partEntity.getSupplierActualDelivery());
        
        // Calculated fields - use part number level stock information
        dto.setAvailableStock(1); // Individual part represents 1 item
        
        // Get availability status from part number level
        try {
            PartNumberStockSummaryDTO stockSummary = stockTrackingService.getStockSummary(partEntity.getPartNumber());
            if (stockSummary != null) {
                dto.setAvailabilityStatus(stockSummary.getStockStatus());
            } else {
                dto.setAvailabilityStatus("UNKNOWN");
            }
        } catch (Exception e) {
            logger.warn("Could not get stock status for part number: {}", partEntity.getPartNumber());
            dto.setAvailabilityStatus("UNKNOWN");
        }
        dto.setVersion(partEntity.getVersion());
        
        logger.info("Part converted to DTO: {}", dto);
        return dto;
    }
    
    // Removed calculateAvailabilityStatus - now handled at part number level by PartNumberStockTrackingService
} 