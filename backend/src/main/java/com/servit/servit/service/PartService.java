package com.servit.servit.service;

import com.servit.servit.entity.Part;
import com.servit.servit.repository.PartRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * @param part The part to create
     * @return The created part
     * @throws IllegalArgumentException if part number already exists
     */
    public Part createPart(Part part) {
        if (partRepository.findByPartNumber(part.getPartNumber()).isPresent()) {
            throw new IllegalArgumentException("Part number already exists");
        }
        return partRepository.save(part);
    }

    /**
     * Updates an existing part.
     * @param id The ID of the part to update
     * @param part The updated part information
     * @return The updated part
     * @throws EntityNotFoundException if part not found
     * @throws IllegalArgumentException if new part number conflicts with existing parts
     */
    public Part updatePart(Long id, Part part) {
        Part existingPart = partRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + id));

        if (!existingPart.getPartNumber().equals(part.getPartNumber()) &&
            partRepository.findByPartNumber(part.getPartNumber()).isPresent()) {
            throw new IllegalArgumentException("Part number already exists");
        }

        existingPart.setName(part.getName());
        existingPart.setDescription(part.getDescription());
        existingPart.setUnitCost(part.getUnitCost());
        existingPart.setMinimumStock(part.getMinimumStock());
        existingPart.setSerialNumber(part.getSerialNumber());

        return partRepository.save(existingPart);
    }

    /**
     * Soft deletes a part by marking it as inactive.
     * @param id The ID of the part to delete
     * @throws EntityNotFoundException if part not found
     */
    public void deletePart(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + id));
        part.setActive(false);
        partRepository.save(part);
    }

    // ================ Search Operations ================

    /**
     * Retrieves a part by its ID.
     * @param id The ID of the part to find
     * @return Optional containing the part if found
     */
    @Transactional(readOnly = true)
    public Optional<Part> getPartById(Long id) {
        return partRepository.findById(id);
    }

    /**
     * Retrieves a part by its part number.
     * @param partNumber The part number to search for
     * @return Optional containing the part if found
     */
    @Transactional(readOnly = true)
    public Optional<Part> getPartByPartNumber(String partNumber) {
        return partRepository.findByPartNumber(partNumber);
    }

    /**
     * Retrieves a part by its serial number.
     * @param serialNumber The serial number to search for
     * @return Optional containing the part if found
     */
    @Transactional(readOnly = true)
    public Optional<Part> getPartBySerialNumber(String serialNumber) {
        return partRepository.findBySerialNumber(serialNumber);
    }

    /**
     * Searches for parts based on a search term.
     * @param searchTerm The term to search for
     * @return List of matching parts
     */
    @Transactional(readOnly = true)
    public List<Part> searchParts(String searchTerm) {
        return partRepository.searchParts(searchTerm);
    }

    // ================ List Operations ================

    /**
     * Retrieves all active parts.
     * @return List of active parts
     */
    @Transactional(readOnly = true)
    public List<Part> getAllActiveParts() {
        return partRepository.findByActiveTrue();
    }

    /**
     * Retrieves all parts (including inactive).
     * @return List of all parts
     */
    @Transactional(readOnly = true)
    public List<Part> getAllParts() {
        return partRepository.findAll();
    }

    /**
     * Retrieves all parts with available stock.
     * @return List of parts with stock > 0
     */
    public List<Part> getAvailableParts() {
        return partRepository.findByActiveTrue().stream()
                .filter(part -> part.getCurrentStock() > 0)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all parts with low stock.
     * @return List of parts with stock <= minimum stock
     */
    @Transactional(readOnly = true)
    public List<Part> getLowStockParts() {
        return partRepository.findLowStockParts();
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
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        int newStock = part.getCurrentStock() + quantity;
        if (newStock < 0) {
            throw new IllegalArgumentException("Insufficient stock for part: " + part.getPartNumber());
        }
        
        part.setCurrentStock(newStock);
        partRepository.save(part);
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
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));

        switch (operationType.toLowerCase()) {
            case "add":
                part.setCurrentStock(part.getCurrentStock() + quantity);
                break;
            case "subtract":
                int newStock = part.getCurrentStock() - quantity;
                if (newStock < 0) {
                    throw new IllegalArgumentException("Insufficient stock for part: " + part.getPartNumber());
                }
                part.setCurrentStock(newStock);
                break;
            default:
                throw new IllegalArgumentException("Invalid operation type: " + operationType);
        }

        partRepository.save(part);
    }

    /**
     * Releases previously reserved stock back into available stock.
     * @param partId The ID of the part
     * @param quantity The quantity to release
     * @throws EntityNotFoundException if part not found
     */
    public void releaseReservedStock(Long partId, int quantity) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        part.setCurrentStock(part.getCurrentStock() + quantity);
        partRepository.save(part);
    }

    /**
     * Checks if a part's stock is low and triggers an alert if necessary.
     * @param partId The ID of the part to check
     * @throws EntityNotFoundException if part not found
     */
    public void checkAndTriggerLowStockAlert(Long partId) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new EntityNotFoundException("Part not found with id: " + partId));
        
        if (part.getCurrentStock() <= part.getMinimumStock()) {
            // TODO: Implement actual low stock alert notification logic
            System.out.println("LOW STOCK ALERT for Part ID: " + part.getPartNumber() + 
                             " (" + part.getName() + "). Current Stock: " + part.getCurrentStock());
        }
    }
} 