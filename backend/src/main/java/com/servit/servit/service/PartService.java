package com.servit.servit.service;

import com.servit.servit.entity.PartEntity;
import com.servit.servit.repository.PartRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.servit.servit.dto.AddPartRequestDTO;
import com.servit.servit.dto.PartResponseDTO;
import com.servit.servit.dto.UpdatePartRequestDTO;
import com.servit.servit.enumeration.PartEnum;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for managing parts/inventory items in the system.
 * Handles all operations related to parts including CRUD, stock management, and search functionality.
 */
@Service
@Transactional
public class PartService {

    private final PartRepository partRepository;

    @Autowired
    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    // ================ CRUD Operations ================

    /**
     * Creates a new part in the system.
     * @param partDto The DTO containing part information to create
     * @return The created part as a DTO
     * @throws IllegalArgumentException if part number already exists
     */
    public PartResponseDTO addpart(AddPartRequestDTO partDto) {
        if (partRepository.findByPartNumber(partDto.getPartNumber()).isPresent()) {
            throw new IllegalArgumentException("Part number already exists");
        }
        PartEntity partEntity = new PartEntity();
        partEntity.setPartNumber(partDto.getPartNumber());
        partEntity.setName(partDto.getName());
        partEntity.setDescription(partDto.getDescription());
        partEntity.setUnitCost(partDto.getUnitCost());
        partEntity.setCurrentStock(partDto.getCurrentStock());
        partEntity.setLowStockThreshold(partDto.getLowStockThreshold());
        partEntity.setSerialNumber(partDto.getSerialNumber());
        partEntity.setDateAdded(partDto.getDateAdded());
        partEntity.setDatePurchasedByCustomer(partDto.getDatePurchasedByCustomer());
        partEntity.setWarrantyExpiration(partDto.getWarrantyExpiration());
        partEntity.setAddedBy(partDto.getAddedBy());

        PartEntity savedPartEntity = partRepository.save(partEntity);
        return convertToDto(savedPartEntity);
    }

    /**
     * Updates an existing part.
     * @param id The ID of the part to update
     * @param partDto The DTO containing updated part information
     * @return The updated part as a DTO
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if new part number conflicts with existing parts
     */
    public PartResponseDTO updatePart(Long id, UpdatePartRequestDTO partDto) {
        PartEntity existingPartEntity = partRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + id));

        if (partDto.getPartNumber() != null && !existingPartEntity.getPartNumber().equals(partDto.getPartNumber()) &&
            partRepository.findByPartNumber(partDto.getPartNumber()).isPresent()) {
            throw new IllegalArgumentException("Part number already exists");
        }

        // Update fields from DTO if they are not null (partial update support)
        if (partDto.getPartNumber() != null) existingPartEntity.setPartNumber(partDto.getPartNumber());
        if (partDto.getName() != null) existingPartEntity.setName(partDto.getName());
        if (partDto.getDescription() != null) existingPartEntity.setDescription(partDto.getDescription());
        if (partDto.getUnitCost() != null) existingPartEntity.setUnitCost(partDto.getUnitCost());
        if (partDto.getCurrentStock() != null) existingPartEntity.setCurrentStock(partDto.getCurrentStock());
        if (partDto.getLowStockThreshold() != null) existingPartEntity.setLowStockThreshold(partDto.getLowStockThreshold());
        if (partDto.getSerialNumber() != null) existingPartEntity.setSerialNumber(partDto.getSerialNumber());
        if (partDto.getIsDeleted() != null) existingPartEntity.setIsDeleted(partDto.getIsDeleted());
        if (partDto.getDateAdded() != null) existingPartEntity.setDateAdded(partDto.getDateAdded());
        if (partDto.getDatePurchasedByCustomer() != null) existingPartEntity.setDatePurchasedByCustomer(partDto.getDatePurchasedByCustomer());
        if (partDto.getWarrantyExpiration() != null) existingPartEntity.setWarrantyExpiration(partDto.getWarrantyExpiration());
        if (partDto.getAddedBy() != null) existingPartEntity.setAddedBy(partDto.getAddedBy());

        PartEntity updatedPartEntity = partRepository.save(existingPartEntity);
        return convertToDto(updatedPartEntity);
    }

    /**
     * Soft deletes a part by marking it as deleted.
     * @param partId The ID of the part to delete
     * @throws EntityNotFoundException if part not found
     * @throws IllegalStateException if part is already deleted
     */
    public void deletePart(Long partId) {
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with partId: " + partId));
        
        if (partEntity.getIsDeleted()) {
            throw new IllegalStateException("Part is already deleted");
        }
        
        partEntity.setIsDeleted(true);
        partRepository.save(partEntity);
    }

    // ================ Search Operations ================

    /**
     * Retrieves a part by its ID.
     * @param id The ID of the part to find
     * @return Optional containing the part as a DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<PartResponseDTO> getPartById(Long id) {
        return partRepository.findById(id).map(this::convertToDto);
    }

    /**
     * Retrieves a part by its part number.
     * @param partNumber The part number to search for
     * @return Optional containing the part as a DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<PartResponseDTO> getPartByPartNumber(String partNumber) {
        return partRepository.findByPartNumber(partNumber).map(this::convertToDto);
    }

    /**
     * Retrieves a part by its serial number.
     * @param serialNumber The serial number to search for
     * @return Optional containing the part as a DTO if found
     */
    @Transactional(readOnly = true)
    public Optional<PartResponseDTO> getPartBySerialNumber(String serialNumber) {
        return partRepository.findBySerialNumber(serialNumber).map(this::convertToDto);
    }

    /**
     * Searches for parts based on a search term.
     * @param searchTerm The term to search for
     * @return List of matching parts as DTOs
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> searchParts(String searchTerm) {
        return partRepository.searchParts(searchTerm).stream().map(this::convertToDto).collect(Collectors.toList());
    }

    // ================ List Operations ================

    /**
     * Retrieves all parts.
     * @return List of parts as DTOs
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> getAllParts() {
        return partRepository.findByIsDeletedFalse().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all parts with available stock.
     * @return List of parts with stock > 0 as DTOs
     */
    public List<PartResponseDTO> getAvailableParts() {
        return partRepository.findByIsDeletedFalse().stream()
                .filter(partEntity -> partEntity.getCurrentStock() > 0)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all parts with low stock.
     * @return List of parts with stock <= minimum stock as DTOs
     */
    @Transactional(readOnly = true)
    public List<PartResponseDTO> getLowStockParts() {
        return partRepository.findLowStockParts().stream().map(this::convertToDto).collect(Collectors.toList());
    }

    // ================ Stock Management ================

    /**
     * Updates the stock level of a part.
     * @param partId The ID of the part
     * @param quantity The quantity to add (positive) or subtract (negative)
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if resulting stock would be negative
     */
    public void updateStock(Long partId, int quantity) {
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        int newStock = partEntity.getCurrentStock() + quantity;
        if (newStock < 0) {
            throw new IllegalArgumentException("Insufficient stock for part: " + partEntity.getPartNumber());
        }
        
        partEntity.setCurrentStock(newStock);
        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId); // Check low stock after updating stock
    }

    /**
     * Adjusts stock based on operation type.
     * @param partId The ID of the part
     * @param quantity The quantity to adjust
     * @param operationType The type of operation ("add" or "subtract")
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if operation type is invalid or resulting stock would be negative
     */
    public void adjustStock(Long partId, int quantity, String operationType) {
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

        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId); // Check low stock after adjusting stock
    }

    /**
     * Releases previously reserved stock back into available stock.
     * @param partId The ID of the part
     * @param quantity The quantity to release
     * @throws EntityNotFoundException if part not found
     */
    public void releaseReservedStock(Long partId, int quantity) {
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        partEntity.setCurrentStock(partEntity.getCurrentStock() + quantity);
        partRepository.save(partEntity);
        checkAndTriggerLowStockAlert(partId); // Check low stock after releasing stock
    }

    /**
     * Checks if a part's stock is low and triggers an alert if necessary.
     * @param partId The ID of the part to check
     * @throws EntityNotFoundException if part not found
     */
    public void checkAndTriggerLowStockAlert(Long partId) {
        PartEntity partEntity = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        if (partEntity.getCurrentStock() <= partEntity.getLowStockThreshold()) {
            // TODO: Implement actual low stock alert notification logic
            System.out.println("LOW STOCK ALERT for Part ID: " + partEntity.getPartNumber() + 
                             " (" + partEntity.getName() + "). Current Stock: " + partEntity.getCurrentStock());
        }
    }
    
    // Helper method to convert Part entity to PartResponseDTO
    private PartResponseDTO convertToDto(PartEntity partEntity) {
        PartResponseDTO dto = new PartResponseDTO();
        dto.setId(partEntity.getPartId());
        dto.setPartNumber(partEntity.getPartNumber());
        dto.setName(partEntity.getName());
        dto.setDescription(partEntity.getDescription());
        dto.setUnitCost(partEntity.getUnitCost());
        dto.setCurrentStock(partEntity.getCurrentStock());
        dto.setLowStockThreshold(partEntity.getLowStockThreshold());
        dto.setSerialNumber(partEntity.getSerialNumber());
        dto.setIsDeleted(partEntity.getIsDeleted() != null ? partEntity.getIsDeleted() : false);
        dto.setDateAdded(partEntity.getDateAdded());
        dto.setDatePurchasedByCustomer(partEntity.getDatePurchasedByCustomer());
        dto.setWarrantyExpiration(partEntity.getWarrantyExpiration());
        dto.setAddedBy(partEntity.getAddedBy());
        return dto;
    }
}
//