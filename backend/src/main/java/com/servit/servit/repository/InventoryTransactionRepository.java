package com.servit.servit.repository;

import com.servit.servit.entity.InventoryTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, Long> {
    
    List<InventoryTransactionEntity> findByPartPartIdOrderByTransactionTimestampDesc(Long partId);
    
    List<InventoryTransactionEntity> findByRelatedTicketIdOrderByTransactionTimestampDesc(String ticketId);
    
    List<InventoryTransactionEntity> findByRelatedQuotationIdOrderByTransactionTimestampDesc(String quotationId);
    
    List<InventoryTransactionEntity> findByPerformedByOrderByTransactionTimestampDesc(String performedBy);
    
    List<InventoryTransactionEntity> findByWorkflowContextOrderByTransactionTimestampDesc(String workflowContext);
    
    @Query("SELECT t FROM InventoryTransactionEntity t WHERE t.transactionTimestamp BETWEEN :startDate AND :endDate ORDER BY t.transactionTimestamp DESC")
    List<InventoryTransactionEntity> findTransactionsBetweenDates(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT t FROM InventoryTransactionEntity t WHERE t.part.partId = :partId AND t.transactionType = :transactionType ORDER BY t.transactionTimestamp DESC")
    List<InventoryTransactionEntity> findByPartIdAndTransactionType(@Param("partId") Long partId, @Param("transactionType") String transactionType);
} 