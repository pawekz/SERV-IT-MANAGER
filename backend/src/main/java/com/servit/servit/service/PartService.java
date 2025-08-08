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
import com.servit.servit.dto.part.AddPartRequestDTO;
import com.servit.servit.dto.part.PartResponseDTO;
import com.servit.servit.dto.part.UpdatePartRequestDTO;
import com.servit.servit.dto.part.UpdatePartNumberStockTrackingDTO;
import com.servit.servit.dto.part.BulkAddPartRequestDTO;
import com.servit.servit.dto.part.ReservePartRequestDTO;
import com.servit.servit.dto.part.PartNumberStockSummaryDTO;
import com.servit.servit.enumeration.PartEnum;
import com.servit.servit.repository.UserRepository;
import com.servit.servit.entity.UserEntity;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;

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
    private final AlertService alertService;
    private final PartNumberStockTrackingService stockTrackingService;
    private final UserRepository userRepository;

    private static final Logger logger = LoggerFactory.getLogger(PartService.class);

    @Autowired
    public PartService(PartRepository partRepository, AlertService alertService, PartNumberStockTrackingService stockTrackingService, UserRepository userRepository) {
        this.partRepository = partRepository;
        this.alertService = alertService;
        this.stockTrackingService = stockTrackingService;
        this.userRepository = userRepository;
    }

    // ================ CRUD Operations ================

    /**
     * Creates a new part in the system. Only ADMIN and TECHNICIAN roles can add parts.
     * @param req The DTO containing part information to create
     * @return The created part as a DTO
     * @throws IllegalArgumentException if serial number already exists
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public PartResponseDTO addpart(AddPartRequestDTO req) {
        logger.info("Adding part: {}", req);
        
        // Check if serial number already exists
        if (partRepository.findBySerialNumber(req.getSerialNumber()).isPresent()) {
            throw new IllegalArgumentException("Serial number already exists: " + req.getSerialNumber());
        }
        
        // Create new part entity
        PartEntity part = new PartEntity();
        part.setPartNumber(req.getPartNumber());
        part.setSerialNumber(req.getSerialNumber());
        part.setAddedBy(getCurrentUserEmail());
        
        // If adding to existing part number, copy the details from an existing part
        if (Boolean.TRUE.equals(req.getAddToExisting())) {
            List<PartEntity> existingParts = partRepository.findAllByPartNumber(req.getPartNumber())
                .stream()
                .filter(p -> !p.getIsDeleted())
                .collect(Collectors.toList());
            
            if (existingParts.isEmpty()) {
                throw new IllegalArgumentException("No active parts found with part number: " + req.getPartNumber());
            }
            
            // Use the first non-deleted part to get the common details
            PartEntity existingPart = existingParts.get(0);
            part.setName(existingPart.getName());
            part.setDescription(existingPart.getDescription());
            part.setUnitCost(existingPart.getUnitCost());
            part.setPartType(existingPart.getPartType());
            part.setBrand(existingPart.getBrand());
            part.setModel(existingPart.getModel());
            
            logger.info("Found {} existing parts with part number: {}", existingParts.size(), req.getPartNumber());
        } else {
            // Set new part details
            part.setName(req.getName());
            part.setDescription(req.getDescription());
            part.setUnitCost(req.getUnitCost());
            part.setPartType(req.getPartType());
            part.setBrand(req.getBrand());
            part.setModel(req.getModel());
        }
        
        // Set common fields
        part.setCurrentStock(1); // Each part represents 1 item
        part.setIsDeleted(false);
        part.setIsCustomerPurchased(false);
        
        try {
            PartEntity savedPart = partRepository.save(part);
            logger.info("Successfully added part with ID: {}", savedPart.getPartId());
            
            // Update stock tracking for this part number
            stockTrackingService.updateStockTracking(req.getPartNumber());
            
            return convertToDto(savedPart);
        } catch (Exception e) {
            logger.error("Error adding part: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add part: " + e.getMessage());
        }
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
        
        // Use the same part number for all items
        String partNumber = bulkDto.getBasePartNumber();
        
        // If adding to existing part number, fetch and copy the details
        PartEntity existingPart = null;
        if (Boolean.TRUE.equals(bulkDto.getAddToExisting())) {
            // There may be many parts with the same part number, so fetch the list and
            // use the first active (non-deleted) entry instead of expecting a unique result.
            List<PartEntity> existingParts = partRepository.findAllByPartNumber(partNumber)
                    .stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getIsDeleted()))
                    .collect(Collectors.toList());

            if (existingParts.isEmpty()) {
                throw new IllegalArgumentException("Part number does not exist: " + partNumber);
            }

            existingPart = existingParts.get(0);
        }
        
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
        
        for (String serialNumber : bulkDto.getSerialNumbers()) {
            PartEntity partEntity = new PartEntity();
            partEntity.setPartNumber(partNumber);
            
            if (existingPart != null) {
                // Copy details from existing part
                partEntity.setName(existingPart.getName());
                partEntity.setDescription(existingPart.getDescription());
                partEntity.setUnitCost(existingPart.getUnitCost());
                partEntity.setBrand(existingPart.getBrand());
                partEntity.setModel(existingPart.getModel());
                partEntity.setPartType(existingPart.getPartType());
            } else {
                // Set new part details
                partEntity.setName(bulkDto.getName());
                partEntity.setDescription(bulkDto.getDescription());
                partEntity.setUnitCost(bulkDto.getUnitCost());
                partEntity.setBrand(bulkDto.getBrand());
                partEntity.setModel(bulkDto.getModel());
                partEntity.setPartType(bulkDto.getPartType());
            }
            
            // Set common fields
            partEntity.setCurrentStock(1); // Each individual part represents 1 item
            partEntity.setSerialNumber(serialNumber);
            partEntity.setAddedBy(currentUser);
            
            // Set supplier information if it's a supplier replacement part
            if (partEntity.getPartType() == PartEnum.SUPPLIER_REPLACEMENT) {
                partEntity.setSupplierName(bulkDto.getSupplierName());
                partEntity.setSupplierPartNumber(bulkDto.getSupplierPartNumber());
                partEntity.setSupplierOrderDate(bulkDto.getSupplierOrderDate());
                partEntity.setSupplierExpectedDelivery(bulkDto.getSupplierExpectedDelivery());
            }
            
            partsToSave.add(partEntity);
        }
        
        List<PartEntity> savedParts = partRepository.saveAll(partsToSave);
        
        // Update stock tracking for the part number
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
        logger.info("Updating part with ID: {}", id);
        
        PartEntity part = partRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + id));

        // Update basic fields
        if (partDto.getPartNumber() != null) part.setPartNumber(partDto.getPartNumber());
        if (partDto.getName() != null) part.setName(partDto.getName());
        if (partDto.getDescription() != null) part.setDescription(partDto.getDescription());
        if (partDto.getUnitCost() != null) part.setUnitCost(partDto.getUnitCost());
        if (partDto.getSerialNumber() != null) part.setSerialNumber(partDto.getSerialNumber());
        
        // Update warranty information
        if (partDto.getIsCustomerPurchased() != null) {
            part.setIsCustomerPurchased(partDto.getIsCustomerPurchased());
            if (partDto.getIsCustomerPurchased()) {
                if (partDto.getDatePurchasedByCustomer() == null) {
                    throw new IllegalArgumentException("Purchase date is required for customer purchased items");
                }
                part.setDatePurchasedByCustomer(partDto.getDatePurchasedByCustomer());
                part.setWarrantyExpiration(partDto.getWarrantyExpiration());
            } else {
                // Clear warranty information if not customer purchased
                part.setDatePurchasedByCustomer(null);
                part.setWarrantyExpiration(null);
            }
        }

        if (partDto.getBrand() != null) part.setBrand(partDto.getBrand());
        if (partDto.getModel() != null) part.setModel(partDto.getModel());

        part.setModifiedBy(getCurrentUserEmail());
        part.setDateModified(LocalDateTime.now());

        try {
            PartEntity updatedPart = partRepository.save(part);
            logger.info("Successfully updated part with ID: {}", id);
            return convertToDto(updatedPart);
        } catch (Exception e) {
            logger.error("Error updating part: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update part: " + e.getMessage());
        }
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

    /**
     * Retrieves parts that are eligible to be attached to a quotation based on strict criteria.
     * These parts are not reserved, not deleted, not customer purchased, etc.
     * Only STANDARD part type is allowed.
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> getAllPartsForQuotation() {
        try {
            List<PartEntity> parts = partRepository.findEligiblePartsForQuotation();
            return parts.stream().map(this::convertToDto).collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error retrieving parts for quotation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve parts for quotation", e);
        }
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
                
                // Use the AlertService for proper low stock alerts
                String alertMessage = String.format("Part Number: %s (%s). Available Stock: %d, Threshold: %d",
                                                   stockSummary.getPartNumber(), stockSummary.getPartName(), 
                                                   stockSummary.getCurrentAvailableStock(), stockSummary.getLowStockThreshold());
                
                alertService.sendLowStockAlert(alertMessage, stockSummary.getPartName(),
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
        dto.setIsCustomerPurchased(partEntity.getIsCustomerPurchased());
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
        dto.setBrand(partEntity.getBrand());
        dto.setModel(partEntity.getModel());
        
        logger.info("Part converted to DTO: {}", dto);
        return dto;
    }
    
    // Removed calculateAvailabilityStatus - now handled at part number level by PartNumberStockTrackingService

    /**
     * Verifies the warranty status of a part
     * @param partId The ID of the part to verify
     * @return Map containing warranty information
     */
    public Map<String, Object> verifyWarranty(Long partId) {
        logger.info("Verifying warranty for part ID: {}", partId);
        
        PartEntity part = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));

        Map<String, Object> warrantyInfo = new HashMap<>();
        
        if (part.getIsCustomerPurchased() == null || !part.getIsCustomerPurchased()) {
            warrantyInfo.put("hasWarranty", false);
            warrantyInfo.put("message", "This part was not purchased by a customer");
            return warrantyInfo;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiration = part.getWarrantyExpiration();
        
        if (expiration == null) {
            warrantyInfo.put("hasWarranty", false);
            warrantyInfo.put("message", "No warranty expiration date set");
            return warrantyInfo;
        }

        long daysRemaining = ChronoUnit.DAYS.between(now, expiration);
        boolean isExpired = now.isAfter(expiration);
        
        warrantyInfo.put("hasWarranty", true);
        warrantyInfo.put("isExpired", isExpired);
        warrantyInfo.put("daysRemaining", daysRemaining);
        warrantyInfo.put("purchaseDate", part.getDatePurchasedByCustomer());
        warrantyInfo.put("expirationDate", expiration);
        
        if (isExpired) {
            warrantyInfo.put("message", "Warranty has expired");
        } else if (daysRemaining <= 7) {
            warrantyInfo.put("message", "Warranty expires soon");
        } else {
            warrantyInfo.put("message", "Warranty is valid");
        }

        logger.info("Warranty verification completed for part ID: {} - Status: {}", 
                   partId, warrantyInfo.get("message"));
        
        return warrantyInfo;
    }
} 