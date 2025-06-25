package com.servit.servit.repository;

import com.servit.servit.entity.QuotationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationRepository extends JpaRepository<QuotationEntity, Long> {
    List<QuotationEntity> findByRepairTicketNumber(String repairTicketNumber);

    List<QuotationEntity> findByStatus(String status);
}