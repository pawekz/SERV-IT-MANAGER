import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Plus, ChevronUp } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import TicketDetailsModal from "../../components/TicketDetailsModal/TicketDetailsModal.jsx";
import api, { parseJwt } from '../../config/ApiConfig';
import TicketCard from '../../components/TicketCard/TicketCard';

const statusChipClasses = (statusRaw) => {
    const status = (statusRaw || '').toString().trim().toUpperCase();
    const map = {
        RECEIVED: 'bg-gray-100 text-[#6B7280] border-gray-300',
        DIAGNOSING: 'bg-[#E0ECFF] text-[#3B82F6] border-[#BFD4FF]',
        'AWAITING PARTS': 'bg-[#FFF4D6] text-[#B45309] border-[#FCD34D]',
        AWAITING_PARTS: 'bg-[#FFF4D6] text-[#B45309] border-[#FCD34D]',
        REPAIRING: 'bg-[#FFE7D6] text-[#C2410C] border-[#FDBA74]',
        READY_FOR_PICKUP: 'bg-[#D9F3F0] text-[#0F766E] border-[#99E0D8]',
        'READY FOR PICKUP': 'bg-[#D9F3F0] text-[#0F766E] border-[#99E0D8]',
        COMPLETED: 'bg-[#E2F7E7] text-[#15803D] border-[#A7E3B9]',
    };
    return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const RepairQueue = () => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

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
        "DIAGNOSED",
        "AWAITING PARTS",
        "REPAIRING",
        "READY FOR PICKUP",
        "COMPLETED"
    ];

    const availableStatuses = ['ALL', ...Array.from(new Set(ticketRequests.map(t => (t.status || t.repairStatus || '').toString().trim().toUpperCase()).filter(Boolean))).filter(s => s !== 'READY_FOR_PICKUP' && s !== 'READY FOR PICKUP' && s !== 'COMPLETED' && s !== 'COMPLETE')];

    const pendingCount = ticketRequests.filter((request) => {
        const s = (request.status || request.repairStatus || '').toString().trim().toUpperCase();
        return s !== 'COMPLETED' && s !== 'COMPLETE' && s !== 'READY_FOR_PICKUP' && s !== 'READY FOR PICKUP';
    }).length;

    const resolvedCount = ticketRequests.filter((request) => {
        const s = (request.status || request.repairStatus || '').toString().trim().toUpperCase();
        return s === 'READY_FOR_PICKUP' || s === 'COMPLETED' || s === 'COMPLETE' || s === 'READY FOR PICKUP';
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
        setPendingStatusChange({ ticketKey: ticketId, newStatus, request });
    };

    const applyStatusChange = (ticketKey, newStatus) => {
        setTicketRequests(prevRequests =>
            prevRequests.map(request =>
                (resolveTicketKey(request) === ticketKey ? { ...request, status: newStatus, repairStatus: newStatus } : request)
            )
        );
        setPendingStatusChange(null);
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
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedRequest(ticket); setModalOpen(true); }}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#25D482] text-white hover:bg-[#1fab6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D482]"
                                        >
                                            View
                                        </button>
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
                        i === currentPage ? 'bg-[#25D482] text-white border-[#25D482]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
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
                        <button className="px-3 py-1.5 rounded-md text-xs font-medium border bg-[#25D482] text-white">1</button>
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

    // renderStatusControl: provides a gray-styled button with dropdown menu for status options
    const renderStatusControl = (request) => {
        const ticketKey = resolveTicketKey(request);
        const currentStatus = request.status || request.repairStatus || 'Unknown';

        return (
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleStatusClick(e, ticketKey); }}
                    aria-haspopup="menu"
                    aria-expanded={statusDropdownOpen === ticketKey}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 text-sm border border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                >
                    <span className="truncate">{currentStatus}</span>
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>

                {statusDropdownOpen === ticketKey && (
                    <div
                        role="menu"
                        aria-label="Status options"
                        className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                    >
                        {statusOptions.map((status) => (
                            <button
                                key={status}
                                role="menuitem"
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${request.status === status || request.repairStatus === status ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                                onClick={(e) => { promptStatusChange(e, ticketKey, status, request); }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
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
                                                        className={({ isActive }) => `px-4 py-3 font-medium transition-all ${isActive ? 'border-b-2 border-[#2563eb] text-[#2563eb]' : 'text-gray-600 hover:text-[#2563eb]'}`}
                                                    >
                                                        Pending Repairs
                                                    </NavLink>
                                                    <NavLink
                                                        to="/resolvedrepairs"
                                                        className={({ isActive }) => `px-4 py-3 font-medium transition-all ${isActive ? 'border-b-2 border-[#2563eb] text-[#2563eb]' : 'text-gray-600 hover:text-[#2563eb]'}`}
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
                                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D482]/30 focus:border-[#25D482]"
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
                                                    className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-[#25D482] text-white rounded-md hover:bg-[#1fab6b] text-sm font-medium whitespace-nowrap"
                                                >Search</button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-gray-600">Status</label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                                                    className="px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#25D482]/30"
                                                >
                                                    {availableStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-gray-600">Per Page</label>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(0); }}
                                                    className="px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#25D482]/30"
                                                >
                                                    {[5,10,20].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-1" aria-label="Display mode">
                                                <button
                                                    onClick={() => setViewMode('table')}
                                                    className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${viewMode === 'table' ? 'bg-[#25D482] text-white border-[#25D482]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                                                    aria-pressed={viewMode === 'table'}
                                                >Table</button>
                                                <button
                                                    onClick={() => setViewMode('cards')}
                                                    className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${viewMode === 'cards' ? 'bg-[#25D482] text-white border-[#25D482]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
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
                                                        {displayedTickets
                                                            .filter((request) => {
                                                                const s = (request.status || request.repairStatus || '').toString().trim().toUpperCase();
                                                                // exclude resolved statuses
                                                                return s !== 'COMPLETED' && s !== 'COMPLETE' && s !== 'READY_FOR_PICKUP' && s !== 'READY FOR PICKUP';
                                                            })
                                                            .map((request) => {
                                                                 const ticketKey = resolveTicketKey(request);
                                                                 return (
                                                                     <TicketCard
                                                                         key={ticketKey}
                                                                         ticket={request}
                                                                         onClick={() => handleCardClick(request)}
                                                                        {...(role !== 'customer' ? { renderStatusControl } : {})}
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
                                                <h3 className="text-lg font-semibold mb-2">Confirm Update Status?</h3>
                                                <p className="text-sm text-gray-600 mb-4">Are you sure you want to change the status to <span className="font-medium">{pendingStatusChange.newStatus}</span> for ticket <span className="font-medium">{pendingStatusChange.ticketKey}</span>?</p>
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => setPendingStatusChange(null)} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
                                                    <button onClick={() => applyStatusChange(pendingStatusChange.ticketKey, pendingStatusChange.newStatus)} className="px-3 py-2 rounded bg-blue-600 text-white">Confirm</button>
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

