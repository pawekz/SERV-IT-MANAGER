package com.servit.servit.dto;

public class PendingApprovalsCountDTO {
    private long pendingApprovals;

    public PendingApprovalsCountDTO(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public void setPendingApprovals(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }
}

