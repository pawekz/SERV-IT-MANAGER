import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Plus, ChevronUp, FileText, Eye, Package } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import TicketDetailsModal from "../../components/TicketDetailsModal/TicketDetailsModal.jsx";
import api, { parseJwt } from '../../config/ApiConfig';
import TicketCard from '../../components/TicketCard/TicketCard';
import Toast from "../../components/Toast/Toast.jsx";
import Spinner from "../../components/Spinner/Spinner.jsx";
import { usePartPhoto } from "../../hooks/usePartPhoto.js";

const PartPhoto = ({ partId, photoUrl }) => {
    const { data: src, isLoading, isError } = usePartPhoto(partId, photoUrl);

    if (isLoading) {
        return (
            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse">
                <span className="text-xs text-gray-400">Loading...</span>
            </div>
        );
    }

    if (isError || !src) {
        return (
            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Package size={24} className="text-gray-400" />
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt="Part photo"
            className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            onError={() => {}}
        />
    );
};

const statusChipClasses = (statusRaw) => {
    const status = (statusRaw || '').toString().trim().toUpperCase();
    const map = {
        RECEIVED: 'bg-gray-100 text-[#6B7280] border-gray-300',
        DIAGNOSING: 'bg-[#E0ECFF] text-[#3B82F6] border-[#BFD4FF]',
        AWAITING_PARTS: 'bg-[#FFF4D6] text-[#B45309] border-[#FCD34D]',
        REPAIRING: 'bg-[#FFE7D6] text-[#C2410C] border-[#FDBA74]',
        READY_FOR_PICKUP: 'bg-[#D9F3F0] text-[#0F766E] border-[#99E0D8]',
        COMPLETED: 'bg-[#E2F7E7] text-[#15803D] border-[#A7E3B9]',
    };
    return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const RepairQueue = () => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const isCustomer = userData?.role?.toLowerCase() === 'customer';
    const token = localStorage.getItem('authToken');
    const decoded = parseJwt(token);
    const role = decoded?.role?.toLowerCase();
    const email = userData?.email;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ticketRequests, setTicketRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [quotations, setQuotations] = useState({}); // Map of ticketNumber -> quotation data
    
    // Quotation approval modal state (customer side)
    const [quotationModalOpen, setQuotationModalOpen] = useState(false);
    const [quotationModalLoading, setQuotationModalLoading] = useState(false);
    const [selectedQuotationTicket, setSelectedQuotationTicket] = useState(null);
    const [quotationParts, setQuotationParts] = useState([]);
    const [selectedPartId, setSelectedPartId] = useState(null);
    const [showQuotationConfirm, setShowQuotationConfirm] = useState(false);
    const [quotationActionType, setQuotationActionType] = useState(null); // 'approve' or 'reject'

    // New UI state to match HistoryPage
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [pageSize, setPageSize] = useState(10);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);

    const resolveTicketKey = (request) => {
        return request?.ticketId ?? request?.id ?? request?.ticketNumber ?? request?.deviceSerialNumber ?? null;
    };

    const statusOptions = [
        "RECEIVED",
        "DIAGNOSING",
        "AWAITING_PARTS",
        "REPAIRING",
        "READY_FOR_PICKUP",
        "COMPLETED"
    ];

    // Helper to normalize status (convert display format to backend format)
    const normalizeStatus = (status) => {
        if (!status) return status;
        return status.toString().trim()
            .replace(/\s+/g, '_')
            .toUpperCase()
            .replace('DIAGNOSED', 'DIAGNOSING');
    };

    const availableStatuses = ['ALL', ...Array.from(new Set(ticketRequests.map(t => (t.status || t.repairStatus || '').toString().trim().toUpperCase()).filter(Boolean))).filter(s => s !== 'READY_FOR_PICKUP' && s !== 'READY FOR PICKUP' && s !== 'COMPLETED' && s !== 'COMPLETE')];

    const pendingCount = ticketRequests.filter((request) => {
        const s = (request.status || request.repairStatus || '').toString().trim().toUpperCase();
        return s !== 'COMPLETED' && s !== 'COMPLETE' && s !== 'READY_FOR_PICKUP' && s !== 'READY FOR PICKUP';
    }).length;

    const handleCardClick = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
    };

    const handleStatusClick = (e, ticketId) => {
        e.stopPropagation();
        setStatusDropdownOpen(prev => (prev === ticketId ? null : ticketId));
    };

    const promptStatusChange = (e, ticketId, newStatus, request) => {
        e.stopPropagation();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
        setStatusDropdownOpen(null);
        
        // Normalize status for comparison
        const normalizedStatus = normalizeStatus(newStatus);
        
        // Always allow the status change prompt - validation happens in applyStatusChange
        setPendingStatusChange({ ticketKey: ticketId, newStatus: normalizedStatus, request });
    };

    // Fetch quotations for tickets
    useEffect(() => {
        const fetchQuotations = async () => {
            const quotationMap = {};
            const ticketsNeedingQuotation = ticketRequests.filter(t => {
                const status = (t.status || t.repairStatus || '').toString().trim().toUpperCase();
                return status === 'AWAITING_PARTS' || status === 'REPAIRING';
            });

            for (const ticket of ticketsNeedingQuotation) {
                try {
                    const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticket.ticketNumber}`);
                    if (data && data.length > 0) {
                        quotationMap[ticket.ticketNumber] = data[0];
                    }
                } catch (err) {
                    // No quotation found or error - that's okay
                    console.debug(`No quotation found for ticket ${ticket.ticketNumber}`);
                }
            }
            setQuotations(quotationMap);
        };

        if (ticketRequests.length > 0) {
            fetchQuotations();
        }
    }, [ticketRequests]);

    const showToast = (message, type = "success") => setToast({ show: true, message, type });
    const closeToast = () => setToast({ ...toast, show: false });


    // Open quotation approval modal
    const openQuotationModal = async (ticket) => {
        const quotation = quotations[ticket.ticketNumber];
        if (!quotation) return;

        setSelectedQuotationTicket(ticket);
        setQuotationModalOpen(true);
        
        // Set initial selection to recommended part
        const recommended = quotation.recommendedPart;
        const initialPartId = Array.isArray(recommended) ? (recommended[0] || null) : (recommended || null);
        setSelectedPartId(initialPartId);

        try {
            setQuotationModalLoading(true);
            const ids = Array.from(new Set(quotation.partIds || []));
            if (ids.length === 0) {
                setQuotationParts([]);
            } else {
                const responses = await Promise.all(ids.map((id) => api.get(`/part/getPartById/${id}`)));
                setQuotationParts(responses.map((res) => res.data));
            }
        } catch (err) {
            console.error('Failed to load quotation parts', err);
            showToast('Failed to load part details. Please try again.', 'error');
        } finally {
            setQuotationModalLoading(false);
        }
    };

    // Handle quotation action click
    const handleQuotationActionClick = (type) => {
        if (type === 'approve' && !selectedPartId) {
            showToast('Please select a part before approving.', 'error');
            return;
        }
        setQuotationActionType(type);
        setShowQuotationConfirm(true);
    };

    // Confirm quotation action
    const confirmQuotationAction = async () => {
        if (!selectedQuotationTicket) return;
        const quotation = quotations[selectedQuotationTicket.ticketNumber];
        if (!quotation) return;

        try {
            setQuotationModalLoading(true);
            if (quotationActionType === 'approve') {
                if (!selectedPartId) {
                    showToast('Please select a part before approving.', 'error');
                    setQuotationModalLoading(false);
                    return;
                }
                await api.patch(`/quotation/approveQuotation/${quotation.quotationId}`, null, {
                    params: { customerSelection: String(selectedPartId) },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                showToast('Quotation approved successfully. Ticket status updated to REPAIRING.', 'success');
                
                // Refresh quotations and tickets
                const { data: quotationData } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${selectedQuotationTicket.ticketNumber}`);
                if (quotationData && quotationData.length > 0) {
                    setQuotations(prev => ({ ...prev, [selectedQuotationTicket.ticketNumber]: quotationData[0] }));
                }
                
                // Refresh ticket status
                const { data: ticketData } = await api.get(`/repairTicket/getRepairTicket/${selectedQuotationTicket.ticketNumber}`);
                setTicketRequests(prevRequests =>
                    prevRequests.map(request =>
                        request.ticketNumber === selectedQuotationTicket.ticketNumber
                            ? { ...request, status: ticketData.repairStatus, repairStatus: ticketData.repairStatus }
                            : request
                    )
                );
            } else if (quotationActionType === 'reject') {
                await api.patch(`/quotation/denyQuotation/${quotation.quotationId}`);
                showToast('Quotation rejected', 'success');
                
                // Refresh quotations
                const { data: quotationData } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${selectedQuotationTicket.ticketNumber}`);
                if (quotationData && quotationData.length > 0) {
                    setQuotations(prev => ({ ...prev, [selectedQuotationTicket.ticketNumber]: quotationData[0] }));
                }
            }
            setQuotationModalOpen(false);
        } catch (err) {
            console.error(`Failed to ${quotationActionType} quotation`, err);
            const errorMessage = err?.response?.data?.message || err?.message || `Failed to ${quotationActionType} the quotation. Please try again.`;
            showToast(errorMessage, 'error');
        } finally {
            setQuotationModalLoading(false);
            setShowQuotationConfirm(false);
        }
    };

    // Render quotation option (Option A or B)
    const renderQuotationOption = (label, partIds, quotation) => {
        const ids = Array.isArray(partIds) ? partIds : (partIds ? [partIds] : []);
        if (ids.length === 0) {
            return (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                    {label}: Not provided.
                </div>
            );
        }
        const labor = quotation?.laborCost || 0;
        const getPart = (id) => quotationParts.find((p) => p.id === id);
        
        const totalPartsCost = ids.reduce((sum, partId) => {
            const part = getPart(partId);
            return sum + (Number(part?.unitCost) || 0);
        }, 0);
        
        const grandTotal = totalPartsCost + labor;
        const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;
        const isOptionSelected = ids.some(id => selectedPartId === id);
        
        return (
            <div className="space-y-2">
                <div className="text-xs font-semibold text-green-700 mb-2">{label} {ids.length > 1 && `(${ids.length} parts)`}</div>
                <div className={`border rounded-lg p-3 ${isOptionSelected ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                    {ids.map((partId) => {
                        const part = getPart(partId);
                        return (
                            <button
                                key={partId}
                                type="button"
                                onClick={() => setSelectedPartId(partId)}
                                className={`w-full text-left transition mb-3 last:mb-0 ${
                                    selectedPartId === partId ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <PartPhoto partId={part?.id || partId} photoUrl={part?.partPhotoUrl} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900">{part?.name || `Part #${partId}`}</div>
                                        <div className="text-xs text-gray-500">SKU: {part?.partNumber || '—'}</div>
                                        <div className="text-xs text-gray-600 mt-1">Part(s): {formatCurrency(part?.unitCost)}</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Part(s) Total:</span>
                            <span>{formatCurrency(totalPartsCost)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Labor:</span>
                            <span>{formatCurrency(labor)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1 border-t border-gray-200">
                            <span>Total:</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const applyStatusChange = async (ticketKey, newStatus) => {
        const ticket = ticketRequests.find(t => resolveTicketKey(t) === ticketKey);
        if (!ticket) return;

        setIsUpdating(true);
        try {
            // Normalize status to backend format
            const normalizedStatus = normalizeStatus(newStatus);
            
            // For READY_FOR_PICKUP, we need photos - handled by modal
            if (normalizedStatus === "READY_FOR_PICKUP") {
                // This should be handled by StatusChangeConfirmModal with photos
                setPendingStatusChange({ ticketKey, newStatus: normalizedStatus, request: ticket });
                setIsUpdating(false);
                return;
            }

            // Check if moving to REPAIRING from AWAITING_PARTS without approved quotation
            const currentStatus = normalizeStatus(ticket.status || ticket.repairStatus);
            if (normalizedStatus === "REPAIRING" && currentStatus === "AWAITING_PARTS") {
                const quotation = quotations[ticket.ticketNumber];
                if (!quotation || (quotation.status !== "APPROVED" && !quotation.technicianOverride)) {
                    showToast("Cannot update to Repairing. The quotation must be approved by the customer first. The ticket will automatically update to Repairing once the quotation is approved.", "error");
                    setIsUpdating(false);
                    setPendingStatusChange(null);
                    return;
                }
            }

            const { data } = await api.patch("/repairTicket/updateRepairStatus", {
                ticketNumber: ticket.ticketNumber,
                repairStatus: normalizedStatus,
            });

            // Update local state
            const finalStatus = data?.newStatus || normalizedStatus;
            setTicketRequests(prevRequests =>
                prevRequests.map(request =>
                    (resolveTicketKey(request) === ticketKey ? { ...request, status: finalStatus, repairStatus: finalStatus } : request)
                )
            );

            // Refresh quotations if status changed to AWAITING_PARTS or REPAIRING
            if (normalizedStatus === "AWAITING_PARTS" || normalizedStatus === "REPAIRING") {
                try {
                    const { data: quotationData } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticket.ticketNumber}`);
                    if (quotationData && quotationData.length > 0) {
                        setQuotations(prev => ({ ...prev, [ticket.ticketNumber]: quotationData[0] }));
                    }
                } catch (err) {
                    // No quotation found - that's okay
                    console.debug(`No quotation found for ticket ${ticket.ticketNumber}`);
                }
            }

            if (normalizedStatus === "AWAITING_PARTS") {
                showToast("Ticket moved to Awaiting Parts", "success");
            } else {
                showToast(data?.message || "Status updated successfully", "success");
            }
            setPendingStatusChange(null);
        } catch (error) {
            console.error("Failed to update repair status", error);
            const apiMessage = error?.response?.data?.message || error?.message || "Failed to update status. Please try again.";
            if (apiMessage.toLowerCase().includes("quotation") || apiMessage.toLowerCase().includes("approved")) {
                if (normalizedStatus === "AWAITING_PARTS") {
                    showToast("Please create a quotation with Option A (Recommended) and Option B (Alternative) parts before moving to Awaiting Parts.", "error");
                } else if (normalizedStatus === "REPAIRING") {
                    showToast("Cannot move to Repairing. The quotation must be approved by the customer or overridden by a technician with notes.", "error");
                } else {
                    showToast(apiMessage, "error");
                }
            } else {
                showToast(apiMessage, "error");
            }
            setPendingStatusChange(null);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);

            try {
                let res;
                if (role === "admin") {
                    const allResults = [];


                    const response = await api.get(`/repairTicket/getAllRepairTickets`, {
                        params: { page: 0, size: 20 },
                    });
                    const content = response.data?.content || [];
                    allResults.push(...content);

                    // Remove duplicates based on ticketNumber
                    const uniqueTickets = Array.from(
                        new Map(allResults.map(ticket => [ticket.ticketNumber, ticket])).values()
                    );
                    setTicketRequests(uniqueTickets);

                } else if (role === "technician") {
                    // TECHNICIAN: Fetch tickets assigned to the logged-in technician
                    if (!email) {
                        console.warn("No technician email found in sessionStorage");
                        return;
                    }

                    const statuses = ["RECEIVED", "DIAGNOSING", "AWAITING_PARTS", "REPAIRING"];
                    const allResults = [];

                    for (const status of statuses) {
                        const response = await api.get(
                            `/repairTicket/getRepairTicketsByStatusPageableAssignedToTech`,
                            {
                                params: { status, page: 0, size: 20 },
                            }
                        );
                        const content = response.data?.content || [];
                        allResults.push(...content);
                    }

                    const uniqueTickets = Array.from(
                        new Map(allResults.map(ticket => [ticket.ticketNumber, ticket])).values()
                    );
                    setTicketRequests(uniqueTickets);

                } else if (role === "customer") {
                    if (!email) {
                        console.warn("No customer email found in sessionStorage");
                        return;
                    }

                    res = await api.get(`/repairTicket/getAllRepairTicketsByCustomer`, {
                        params: { email },
                    });

                    setTicketRequests(res.data || []);

                } else {
                    console.warn("Unknown role:", role);
                    setTicketRequests([]);
                }

            } catch (err) {
                console.error("Failed to fetch repair tickets:", err);
                setError("Failed to fetch repair tickets.");
            } finally {
                setLoading(false);
            }
        };

        if (role) {
            fetchTickets();
        }
    }, [role, email]);

    useEffect(() => {
        const handleClickOutside = () => {
            setStatusDropdownOpen(null);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const applyFilters = (list) => {
        let filtered = list.slice();
        
        // Exclude resolved/completed tickets (this is the Pending Repairs page)
        filtered = filtered.filter((request) => {
            const s = (request.status || request.repairStatus || '').toString().trim().toUpperCase();
            return s !== 'COMPLETED' && s !== 'COMPLETE' && s !== 'READY_FOR_PICKUP' && s !== 'READY FOR PICKUP';
        });
        
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(ticket => {
                const statusVal = (ticket.status || ticket.repairStatus || '').toLowerCase();
                const first = ticket.customerFirstName?.toLowerCase() || '';
                const last = ticket.customerLastName?.toLowerCase() || '';
                const full = `${first} ${last}`.trim();
                return (
                    (ticket.ticketNumber || '').toString().toLowerCase().includes(q) ||
                    first.includes(q) ||
                    last.includes(q) ||
                    full.includes(q) ||
                    (ticket.deviceBrand || '').toLowerCase().includes(q) ||
                    (ticket.deviceModel || '').toLowerCase().includes(q) ||
                    (ticket.deviceSerialNumber || '').toLowerCase().includes(q) ||
                    statusVal.includes(q)
                );
            });
        }

        if (statusFilter && statusFilter !== 'ALL') {
            filtered = filtered.filter(t => (t.status || t.repairStatus) === statusFilter);
        }

        return filtered;
    };

    const clientFilteredTickets = applyFilters(ticketRequests);

    useEffect(() => {
        const tp = Math.max(1, Math.ceil(clientFilteredTickets.length / pageSize));
        setTotalPages(tp);
        setTotalEntries(clientFilteredTickets.length);
        if (currentPage > tp - 1) setCurrentPage(0);
    }, [clientFilteredTickets.length, pageSize]);

    const displayedTickets = clientFilteredTickets.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

    const renderTable = () => {
        return (
            <>
                <div className="overflow-x-auto mb-2">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200">
                        <tr>
                            <th className="px-5 py-3 text-left font-semibold">Ticket #</th>
                            <th className="px-5 py-3 text-left font-semibold">First Name</th>
                            <th className="px-5 py-3 text-left font-semibold">Last Name</th>
                            <th className="px-5 py-3 text-left font-semibold">Device</th>
                            <th className="px-5 py-3 text-left font-semibold">Status</th>
                            <th className="px-5 py-3 text-left font-semibold whitespace-nowrap">Check-In Date</th>
                            <th className="px-5 py-3 text-left font-semibold">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {displayedTickets.map(ticket => {
                            const statusVal = ticket.status || ticket.repairStatus || 'N/A';
                            const first = ticket.customerFirstName || '';
                            const last = ticket.customerLastName || '';
                            return (
                                <tr key={resolveTicketKey(ticket)}
                                    className="hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedRequest(ticket)}
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedRequest(ticket); }}
                                    aria-label={`View details for ticket ${ticket.ticketNumber}`}
                                >
                                    <td className="px-5 py-3 font-medium text-gray-900">{ticket.ticketNumber}</td>
                                    <td className="px-5 py-3 whitespace-nowrap">{first || '—'}</td>
                                    <td className="px-5 py-3 whitespace-nowrap">{last || '—'}</td>
                                    <td className="px-5 py-3 whitespace-nowrap">{ticket.deviceBrand} {ticket.deviceModel}</td>
                                    <td className="px-5 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusChipClasses(statusVal)}`}>
                                                {statusVal}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">{ticket.checkInDate || '—'}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedRequest(ticket); setModalOpen(true); }}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                                                    ${isCustomer
                                                    ? "bg-[#25D482] hover:bg-[#1fab6b] focus-visible:ring-[#25D482]"
                                                    : "bg-[#2563eb] hover:bg-[#1e49c7] focus-visible:ring-[#2563eb]"
                                                }`}
                                            >
                                                View
                                            </button>
                                            {(() => {
                                                const status = (ticket.status || ticket.repairStatus || '').toString().trim().toUpperCase();
                                                const quotation = quotations[ticket.ticketNumber];
                                                
                                                if (role !== 'customer') {
                                                    if (status === "AWAITING_PARTS") {
                                                        return (
                                                            <Link
                                                                to={`/quotation-builder/${encodeURIComponent(ticket.ticketNumber)}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <FileText size={12} />
                                                                    Build Quotation
                                                                </button>
                                                            </Link>
                                                        );
                                                    } else if (status === "REPAIRING" && quotation) {
                                                        return (
                                                            <Link
                                                                to={`/quotationviewer/${encodeURIComponent(ticket.ticketNumber)}?repairStatus=${status}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Eye size={12} />
                                                                    View Quotation
                                                                </button>
                                                            </Link>
                                                        );
                                                    }
                                                } else if (role === 'customer' && status === "AWAITING_PARTS") {
                                                    if (!quotation) {
                                                        return (
                                                            <button
                                                                disabled
                                                                className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-gray-300 text-gray-500 cursor-not-allowed"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Creating Quotation
                                                            </button>
                                                        );
                                                    } else if (quotation.status === "PENDING") {
                                                        return (
                                                            <button
                                                                className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openQuotationModal(ticket);
                                                                }}
                                                            >
                                                                Approve Quotation
                                                            </button>
                                                        );
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
                {renderPagination(true)}
            </>
        );
    };

    const renderPagination = (compact = false) => {
        const pages = [];
        const maxButtons = 5;
        const pagesCount = Math.max(1, totalPages);
        let start = Math.max(0, currentPage - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;
        if (end > pagesCount - 1) {
            end = pagesCount - 1;
            start = Math.max(0, end - maxButtons + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        i === currentPage ? isCustomer
                                ? 'bg-[#25D482] text-white border-[#25D482]'
                                : 'bg-[#2563eb] text-white border-[#2563eb]'
                            : isCustomer
                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407]'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-[#2563eb]/10 hover:text-[#2563eb]'
                    }`}
                >
                    {i + 1}
                </button>
            );
        }
        return (
            <div className={`flex items-center gap-2 flex-wrap justify-between ${compact ? 'px-6 py-4 border-t border-gray-200 bg-white' : 'mt-8'}`}>
                <div className="text-gray-600 text-sm">
                    {(() => {
                        const total = totalEntries || 0;
                        const startIndex = total > 0 ? (currentPage * pageSize) + 1 : 0;
                        const shown = displayedTickets.length || 0;
                        const endIndex = Math.min((currentPage * pageSize) + shown, total || (currentPage * pageSize) + shown);
                        return (
                            <span>
                                Showing {startIndex} to {endIndex} of {total} entries
                            </span>
                        );
                    })()}
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => currentPage > 0 && setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >Prev</button>
                    <div className="flex gap-1">{pages.length > 0 ? pages : (
                        <button
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                                isCustomer
                                    ? 'bg-[#25D482] text-white border-[#25D482] hover:bg-[#1fab6b]'
                                    : 'bg-[#2563eb] text-white border-[#2563eb] hover:bg-[#1e49c7]'
                            }`}
                        >1</button>
                    )}</div>
                    <button
                        onClick={() => currentPage < (Math.max(1, totalPages) - 1) && setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= (Math.max(1, totalPages) - 1)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >Next</button>
                </div>
                <div className="text-xs text-gray-500 ml-auto">
                    Page {currentPage + 1} of {Math.max(1, totalPages)}
                </div>
            </div>
        );
    };

    // Helper to check if status transition is allowed (for display purposes only)
    // Note: We don't disable REPAIRING, but show a toast if quotation isn't approved
    const canTransitionToStatus = (currentStatus, targetStatus, ticketNumber) => {
        // Always allow transitions - validation happens in applyStatusChange
        return true;
    };

    // renderStatusControl: provides a gray-styled button with dropdown menu for status options
    const renderStatusControl = (request) => {
        const ticketKey = resolveTicketKey(request);
        const currentStatus = request.status || request.repairStatus || 'Unknown';
        const displayStatus = normalizeStatus(currentStatus).replace(/_/g, ' ');

        return (
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleStatusClick(e, ticketKey); }}
                    aria-haspopup="menu"
                    aria-expanded={statusDropdownOpen === ticketKey}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                    <span className="truncate">{displayStatus}</span>
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>

                {statusDropdownOpen === ticketKey && (
                    <div
                        role="menu"
                        aria-label="Status options"
                        className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                    >
                        {statusOptions.map((status) => {
                            const normalizedCurrent = normalizeStatus(currentStatus);
                            const normalizedTarget = normalizeStatus(status);
                            const isCurrent = normalizedCurrent === normalizedTarget;
                            return (
                                <button
                                    key={status}
                                    role="menuitem"
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                        isCurrent
                                            ? 'font-semibold text-gray-900' 
                                            : 'text-gray-700'
                                    }`}
                                    onClick={(e) => { 
                                        promptStatusChange(e, ticketKey, status, request);
                                    }}
                                >
                                    {status.replace(/_/g, ' ')}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Render action buttons for technician/admin
    const renderActionButtons = (ticket) => {
        if (role === 'customer') return null;
        
        const status = (ticket.status || ticket.repairStatus || '').toString().trim().toUpperCase();
        const quotation = quotations[ticket.ticketNumber];
        
        return (
            <div className="flex flex-col gap-2 mt-2">
                {status === "AWAITING_PARTS" && (
                    <Link
                        to={`/quotation-builder/${encodeURIComponent(ticket.ticketNumber)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                    >
                        <button
                            className="w-full px-3 py-2 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <FileText size={14} />
                            Build Quotation
                        </button>
                    </Link>
                )}
                {status === "REPAIRING" && quotation && (
                    <Link
                        to={`/quotationviewer/${encodeURIComponent(ticket.ticketNumber)}?repairStatus=${status}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full"
                    >
                        <button
                            className="w-full px-3 py-2 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Eye size={14} />
                            View Quotation
                        </button>
                    </Link>
                )}
            </div>
        );
    };

    // Render customer action button
    const renderCustomerAction = (ticket) => {
        if (role !== 'customer') return null;
        
        const status = (ticket.status || ticket.repairStatus || '').toString().trim().toUpperCase();
        const quotation = quotations[ticket.ticketNumber];
        
        if (status === "AWAITING_PARTS") {
            if (!quotation) {
                return (
                    <button
                        disabled
                        className="w-full px-3 py-2 text-xs font-medium rounded-md bg-gray-300 text-gray-500 cursor-not-allowed"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Creating Quotation
                    </button>
                );
            } else if (quotation.status === "PENDING") {
                return (
                    <button
                        className="w-full px-3 py-2 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            openQuotationModal(ticket);
                        }}
                    >
                        Approve Quotation
                    </button>
                );
            }
        }
        return null;
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">
            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'repair'}/>
            </div>

            <div className="flex-1 overflow-auto">


                {/*Main Content */}


                <div className="flex-1 p-8 bg-gray-50">
                    <div className="flex justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-3xl font-semibold text-gray-800 mb-2">Repair Queue Dashboard</h1>
                                <p className="text-gray-600 text-base max-w-3xl">
                                    Track and manage all repair tickets in real-time. View status updates, technician assignments, and estimated completion times.
                                </p>
                            </div>

                            {/* Add Ticket Button moved to top-right of page header (responsive) */}
                            {role !== "customer" && (
                                <div className="flex-shrink-0">
                                    <Link to="/newrepair">
                                        <button className="flex items-center bg-[#2563eb] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-opacity-90 min-w-[44px] min-h-[44px] whitespace-nowrap">
                                            <Plus className=" w-4 h-4 mr-2 flex-shrink-0" />
                                            <span className="text-sm sm:text-base ">Add Ticket</span>
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="px-10 py-4">
                        {loading ? (
                            <div className="text-center py-8">
                                <p>Loading Repair tickets...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-red-500">
                                <p>{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 text-blue-500 underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <section className="mb-8 -ml-10">
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-end mb-6">
                                        <div className="flex items-center space-x-3">
                                            {/* Pending / Resolved tabs */}
                                            <div className="flex">
                                                <div className="flex border-b border-gray-300">
                                                    <NavLink
                                                        to="/repairqueue"
                                                        className={({ isActive }) =>{ const isCustomer = role === "customer";

                                                            return (
                                                                `px-4 py-3 font-medium transition-all ` +
                                                                (isActive
                                                                        ? `border-b-2 ${isCustomer ? "border-[#25D482] text-[#25D482]" : "border-[#2563eb] text-[#2563eb]"}`
                                                                        : `${isCustomer ? "text-gray-600 hover:text-[#25D482]" : "text-gray-600 hover:text-[#2563eb]"}`
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        Pending Repairs
                                                    </NavLink>
                                                    <NavLink
                                                        to="/resolvedrepairs"
                                                        className={({ isActive }) =>{ const isCustomer = role === "customer";

                                                            return (
                                                                `px-4 py-3 font-medium transition-all ` +
                                                                (isActive
                                                                        ? `border-b-2 ${isCustomer ? "border-[#25D482] text-[#25D482]" : "border-[#2563eb] text-[#2563eb]"}`
                                                                        : `${isCustomer ? "text-gray-600 hover:text-[#25D482]" : "text-gray-600 hover:text-[#2563eb]"}`
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        Resolved Repairs
                                                    </NavLink>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* New: Search / Filters / View Mode (matching HistoryPage) */}
                                    <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex flex-col gap-1">
                                            <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                                Pending Repair Tickets
                                                <span className="text-sm font-normal text-gray-500">({pendingCount})</span>
                                            </h2>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full lg:w-auto">
                                            <div className="flex flex-1 min-w-[220px] items-center gap-2 flex-col sm:flex-row sm:items-center">
                                                <div className="flex items-center gap-2 w-full sm:flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder={role === 'customer' ? 'Search tickets...' : 'Search Ticket #, Name, Email...'}
                                                        value={search}
                                                        aria-label="Search tickets"
                                                        onChange={e => setSearch(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && (setCurrentPage(0))}
                                                        className={`flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2
                                                            ${isCustomer
                                                            ? "border-gray-300 focus:ring-[#25D482]/30 focus:border-[#25D482]"
                                                            : "border-gray-300 focus:ring-[#2563eb]/30 focus:border-[#2563eb]"
                                                        }`}
                                                    />
                                                    {search && (
                                                        <button
                                                            onClick={() => { setSearch(''); }}
                                                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                                            aria-label="Clear search"
                                                        >Clear</button>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => setCurrentPage(0)}
                                                    className={
                                                        'w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 text-white rounded-md text-sm font-medium whitespace-nowrap border-gray-300 ' +
                                                        (isCustomer
                                                            ? 'bg-[#25D482] hover:bg-[#1fab6b]'
                                                            : 'bg-[#2563eb] hover:bg-[#1e49c7]')
                                                    }
                                                >Search</button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-gray-600">Status</label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                                                    className={
                                                        'px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2' +
                                                        (isCustomer
                                                            ? 'focus:ring-[#25D482]/30 focus:border-[#25D482]'
                                                            : 'focus:ring-[#2563eb]/30 focus:border-[#2563eb]')
                                                    }                                                >
                                                    {availableStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-gray-600">Per Page</label>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(0); }}
                                                    className={
                                                        'px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2' +
                                                        (isCustomer
                                                            ?  'focus:ring-[#25D482]/30 focus:border-[#25D482]'
                                                            : 'focus:ring-[#2563eb]/30 focus:border-[#2563eb]')
                                                    }
                                                >
                                                    {[5,10,20].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-1" aria-label="Display mode">
                                                <button
                                                    onClick={() => setViewMode('table')}
                                                    className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                                                        viewMode === 'table'
                                                            ? (isCustomer
                                                                ? 'bg-[#25D482] text-white border-[#25D482]'
                                                                : 'bg-[#2563eb] text-white border-[#2563eb]')
                                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                    aria-pressed={viewMode === 'table'}
                                                >Table</button>
                                                <button
                                                    onClick={() => setViewMode('cards')}
                                                    className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                                                        viewMode === 'cards'
                                                            ? (isCustomer
                                                                ? 'bg-[#25D482] text-white border-[#25D482]'
                                                                : 'bg-[#2563eb] text-white border-[#2563eb]')
                                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                                    }`}
                                                    aria-pressed={viewMode === 'cards'}
                                                >Cards</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    {ticketRequests.length === 0 ? (
                                        <p className="text-center text-gray-600">
                                            No warranty return requests have been made yet.
                                        </p>

                                    ) : (

                                        // Pending Repairs (filtered & paginated)

                                        <>
                                            {viewMode === 'table' ? (
                                                renderTable()
                                            ) : (
                                                <>
                                                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                                        {displayedTickets.map((request) => {
                                                            const ticketKey = resolveTicketKey(request);
                                                            return (
                                                                <TicketCard
                                                                    key={ticketKey}
                                                                    ticket={request}
                                                                    onClick={() => handleCardClick(request)}
                                                                    {...(role !== 'customer' ? { renderStatusControl } : {})}
                                                                    actionButtons={renderActionButtons(request)}
                                                                    customerAction={renderCustomerAction(request)}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    {renderPagination()}
                                                </>
                                            )}
                                        </>
                                    )}
                                    <TicketDetailsModal
                                        isOpen={modalOpen}
                                        onClose={() => setModalOpen(false)}
                                        data={selectedRequest}
                                        readonly={true}
                                    />
                                    {pendingStatusChange && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                                                <h3 className="text-lg font-semibold mb-2">Confirm Status Update?</h3>
                                                <p className="text-sm text-gray-600 mb-4">Are you sure you want to change the status to <span className="font-medium">{pendingStatusChange.newStatus}</span> for ticket <span className="font-medium">{pendingStatusChange.ticketKey}</span>?</p>
                                                <div className="flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => setPendingStatusChange(null)} 
                                                        className="px-3 py-2 rounded bg-gray-100 text-gray-700"
                                                        disabled={isUpdating}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => applyStatusChange(pendingStatusChange.ticketKey, pendingStatusChange.newStatus)} 
                                                        className="px-3 py-2 rounded bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50"
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating && <Spinner size="small" />}
                                                        {isUpdating ? "Updating..." : "Confirm"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
                                    
                                    {/* Quotation Approval Modal (Customer Side) */}
                                    {quotationModalOpen && selectedQuotationTicket && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
                                            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-lg font-semibold text-gray-800">Choose an option for ticket {selectedQuotationTicket.ticketNumber}</h4>
                                                    <button 
                                                        onClick={() => {
                                                            setQuotationModalOpen(false);
                                                            setSelectedQuotationTicket(null);
                                                            setSelectedPartId(null);
                                                            setQuotationParts([]);
                                                        }} 
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                {quotationModalLoading ? (
                                                    <div className="py-10 flex justify-center">
                                                        <Spinner size="large" />
                                                    </div>
                                                ) : (
                                                    <>
                                                        {(() => {
                                                            const quotation = quotations[selectedQuotationTicket.ticketNumber];
                                                            if (!quotation) return null;
                                                            return (
                                                                <>
                                                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                                        {renderQuotationOption('Option A – Recommended', quotation.recommendedPart || [], quotation)}
                                                                        {renderQuotationOption('Option B – Alternative', quotation.alternativePart || [], quotation)}
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 mb-4">
                                                                        Need help deciding? Call us at <strong>(02) 8700 1234</strong> and mention ticket{' '}
                                                                        <strong>{selectedQuotationTicket.ticketNumber}</strong>.
                                                                    </p>
                                                                    <div className="flex justify-end gap-3">
                                                                        <button 
                                                                            className="px-4 py-2 rounded-md border text-gray-700" 
                                                                            onClick={() => {
                                                                                setQuotationModalOpen(false);
                                                                                setSelectedQuotationTicket(null);
                                                                                setSelectedPartId(null);
                                                                                setQuotationParts([]);
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                                                                            onClick={() => handleQuotationActionClick('reject')}
                                                                            disabled={quotationModalLoading}
                                                                        >
                                                                            Reject Quotation
                                                                        </button>
                                                                        <button
                                                                            className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60 flex items-center gap-2"
                                                                            onClick={() => handleQuotationActionClick('approve')}
                                                                            disabled={!selectedPartId || quotationModalLoading}
                                                                        >
                                                                            {quotationModalLoading && quotationActionType === 'approve' && <Spinner size="small" />}
                                                                            Approve Selection
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quotation Confirmation Modal */}
                                    {showQuotationConfirm && selectedQuotationTicket && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                                            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm {quotationActionType === "approve" ? "Approval" : "Rejection"}</h3>
                                                <p className="text-sm text-gray-600 mb-6">
                                                    Are you sure you want to {quotationActionType === "approve" ? "approve" : "reject"} this quotation?
                                                </p>
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setShowQuotationConfirm(false)}
                                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                                                        disabled={quotationModalLoading}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={confirmQuotationAction}
                                                        className={`px-4 py-2 text-white rounded-md flex items-center justify-center gap-2 ${quotationActionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
                                                        disabled={quotationModalLoading}
                                                    >
                                                        {quotationModalLoading && <Spinner size="small" />}
                                                        {quotationModalLoading ? "Processing..." : "Confirm"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

        </div>

    );
};

export default RepairQueue;

