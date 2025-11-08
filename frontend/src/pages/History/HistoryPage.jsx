import React, { useState, useEffect } from 'react';
import TicketCard from '../../components/TicketCard/TicketCard';
import TicketDetailsModal from '../../components/TicketDetailsModal/TicketDetailsModal';
import Sidebar from '../../components/SideBar/Sidebar';
import api from '../../config/ApiConfig';

function getUserInfoFromToken() {
    const token = localStorage.getItem('authToken');
    if (!token) return {};

    try {
        // Get role from JWT token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;

        // Get email from sessionStorage userData
        const userDataStr = sessionStorage.getItem('userData');
        let email = '';
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            email = userData.email ? userData.email.replace(/\n/g, '').trim() : '';
            console.log('[HistoryPage] UserData from sessionStorage:', userData);
        }

        console.log('[HistoryPage] Extracted email:', email, 'role:', role);
        return { email, role };
    } catch (e) {
        console.error('[HistoryPage] Error parsing token or userData:', e);
        return {};
    }
}

// Utility: status style mapping similar style approach to other tabs
const statusChipClasses = (statusRaw) => {
    const status = (statusRaw || '').toUpperCase();
    const map = {
        COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        COMPLETE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
        PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
        PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
        AWAITING_PARTS: 'bg-amber-50 text-amber-700 border-amber-200',
        CANCELLED: 'bg-red-50 text-red-700 border-red-200',
        CANCELED: 'bg-red-50 text-red-700 border-red-200',
        FAILED: 'bg-red-50 text-red-700 border-red-200',
        CLOSED: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const HistoryPage = () => {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0); // total items across all pages (if available)
    const [pageSize, setPageSize] = useState(10); // configurable page size
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

    // derive unique statuses for filter dropdown (from loaded tickets) using status || repairStatus
    const statusOptions = ['ALL', ...Array.from(new Set(tickets.map(t => (t.status || t.repairStatus) ).filter(Boolean)))];

    const { email, role } = getUserInfoFromToken();

    const fetchTickets = async (page = 0) => {
        const isInitialLoad = page === 0;
        if (isInitialLoad) {
            setLoading(true);
        }
        setError(null);
        try {
            {
                 const searchTerm = search.trim() || '';
                 const res = await api.get('/repairTicket/searchRepairTickets', {
                     params: {
                         searchTerm,
                         page,
                         size: pageSize
                     }
                 });
                 const newTickets = res.data.content || [];
                 const totalPagesCount = res.data.totalPages ?? 0;
                 // Try to extract total elements (common in Spring Data responses)
                 const totalElements = typeof res.data.totalElements === 'number' ? res.data.totalElements : (typeof res.data.total === 'number' ? res.data.total : null);
                 setTickets(newTickets);
                 setCurrentPage(page);
                 // ensure we always have at least 1 page so pagination UI renders consistently
                 setTotalPages(Math.max(1, totalPagesCount));
                 // robust fallback for total entries: prefer server-provided total, otherwise estimate or use 0
                 if (typeof totalElements === 'number') {
                     setTotalEntries(totalElements);
                 } else {
                     // if server didn't provide total, estimate conservatively
                     const estimate = (newTickets.length || 0) + (page * pageSize || 0);
                     setTotalEntries(estimate || 0);
                 }
            }
         } catch (err) {
             setError(err.response?.data?.message || err.message || 'Unknown error');
         } finally {
             setLoading(false);
         }
    };

    // refetch on role/email/pageSize/search changes (for non-customer) or pageSize change (for customer)
    useEffect(() => {
        fetchTickets(0);
        // eslint-disable-next-line
    }, [role, email, pageSize]);

    // When search triggered manually
    const handleSearch = () => {
        setCurrentPage(0);
        if (role === 'CUSTOMER') {
            // client side only needs currentPage reset
        } else {
            fetchTickets(0);
        }
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(0);
        if (role !== 'CUSTOMER') {
            // server fetch (status filtering done client-side post fetch unless backend supports)
            fetchTickets(0);
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value, 10);
        setPageSize(newSize);
        setCurrentPage(0);
    };

    const goToPage = (pageIndex) => {
        if (role === 'CUSTOMER') {
            setCurrentPage(pageIndex);
        } else {
            fetchTickets(pageIndex);
        }
    };

    // filter logic
    const applyFilters = (list) => {
        let filtered = list;
        if (role === 'CUSTOMER' && search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(ticket => {
                const statusVal = (ticket.status || ticket.repairStatus || '').toLowerCase();
                const first = ticket.customerFirstName?.toLowerCase() || '';
                const last = ticket.customerLastName?.toLowerCase() || '';
                const full = `${first} ${last}`.trim();
                return (
                    ticket.ticketNumber?.toLowerCase().includes(q) ||
                    first.includes(q) ||
                    last.includes(q) ||
                    full.includes(q) ||
                    ticket.deviceBrand?.toLowerCase().includes(q) ||
                    ticket.deviceModel?.toLowerCase().includes(q) ||
                    ticket.deviceSerialNumber?.toLowerCase().includes(q) ||
                    statusVal.includes(q)
                );
            });
        }
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(t => (t.status || t.repairStatus) === statusFilter);
        }
        return filtered;
    };

    const clientFilteredTickets = role === 'CUSTOMER' ? applyFilters(tickets) : applyFilters(tickets); // same call for clarity

    // compute total pages for client side
    useEffect(() => {
        if (role === 'CUSTOMER') {
            const tp = Math.max(1, Math.ceil(clientFilteredTickets.length / pageSize));
            setTotalPages(tp);
            if (currentPage > tp - 1) {
                setCurrentPage(0);
            }
        }
        // eslint-disable-next-line
    }, [clientFilteredTickets.length, pageSize, role]);
    
    // Keep totalEntries in sync for CUSTOMER when filters change
    useEffect(() => {
        if (role === 'CUSTOMER') {
            setTotalEntries(clientFilteredTickets.length);
        }
    }, [clientFilteredTickets.length, role]);

    const displayedTickets = role === 'CUSTOMER'
        ? clientFilteredTickets.slice(currentPage * pageSize, currentPage * pageSize + pageSize)
        : clientFilteredTickets; // server already paginated to pageSize

    // NEW: render table view
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
                                    <tr key={ticket.ticketNumber}
                                        className="hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedTicket(ticket)}
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTicket(ticket); }}
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
                                                onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
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

    // Enhance pagination to optionally render inside table card
    const renderPagination = (compact = false) => {
        // always render pagination footer (even for single page) to display counts like UserManagement
        const pages = [];
        const maxButtons = 5;
        const pagesCount = Math.max(1, totalPages);
        // Center current page within pagination buttons when possible
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
                    onClick={() => goToPage(i)}
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
                    {/* Compute showing indices robustly */}
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
                        onClick={() => currentPage > 0 && goToPage(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >Prev</button>
                    <div className="flex gap-1">{pages.length > 0 ? pages : (
                        <button className="px-3 py-1.5 rounded-md text-xs font-medium border bg-[#25D482] text-white">1</button>
                    )}</div>
                    <button
                        onClick={() => currentPage < (Math.max(1, totalPages) - 1) && goToPage(currentPage + 1)}
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

    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">
            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'history'}/>
            </div>
            <div className="flex-1 p-8 bg-gray-50">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">Repair Ticket History</h1>
                    <p className="text-gray-600 text-base max-w-3xl">
                        Search through past repairs and access detailed information about each service request.
                    </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-10 overflow-hidden">
                    {/* Header / Controls */}
                    <div className="px-6 py-5 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                Repair Tickets
                                <span className="text-sm font-normal text-gray-500">({clientFilteredTickets.length}{role !== 'CUSTOMER' ? '' : ''})</span>
                            </h2>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full lg:w-auto">
                            <div className="flex flex-1 min-w-[220px] items-center gap-2 flex-col sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2 w-full sm:flex-1">
                                    <input
                                        type="text"
                                        placeholder={role === 'CUSTOMER' ? 'Search tickets...' : 'Search Ticket #, Name, Email...'}
                                        value={search}
                                        aria-label="Search tickets"
                                        onChange={e => setSearch(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D482]/30 focus:border-[#25D482]"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => { setSearch(''); if (role !== 'CUSTOMER') handleSearch(); }}
                                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                            aria-label="Clear search"
                                        >Clear</button>
                                    )}
                                </div>

                                <button
                                    onClick={handleSearch}
                                    className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-[#25D482] text-white rounded-md hover:bg-[#1fab6b] text-sm font-medium whitespace-nowrap"
                                >Search</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    className="px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#25D482]/30"
                                >
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-600">Per Page</label>
                                <select
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
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
                    <div className={viewMode === 'table' ? '' : 'p-6'}>
                        {loading && (
                            <div className="text-center text-gray-500 py-16">Loading tickets...</div>
                        )}
                        {error && (
                            <div className="text-center text-red-500 py-16">{error}</div>
                        )}
                        {!loading && !error && displayedTickets.length === 0 && (
                            <div className="text-center text-gray-400 py-16">
                                No repair records found.<br />
                                <span className="text-xs">Suggestions: Check spelling, try fewer keywords.</span>
                            </div>
                        )}

                        {!loading && !error && displayedTickets.length > 0 && (
                            <>
                                {viewMode === 'table' ? (
                                    renderTable()
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                            {displayedTickets.map(ticket => (
                                                <TicketCard key={ticket.ticketNumber} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
                                            ))}
                                        </div>
                                        {renderPagination()}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {selectedTicket && (
                    <TicketDetailsModal
                        data={selectedTicket}
                        isOpen={!!selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
