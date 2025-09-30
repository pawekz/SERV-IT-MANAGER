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

const HistoryPage = () => {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize, setPageSize] = useState(10); // configurable page size
    const [statusFilter, setStatusFilter] = useState('ALL');
    // NEW: view mode toggle (table or cards)
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
            if (role === 'CUSTOMER') {
                const res = await api.get('/repairTicket/getRepairTicketsByCustomerEmail', { params: { email } });
                const newTickets = res.data || [];
                setTickets(newTickets);
                // client-side pagination setup
                setTotalPages(Math.max(1, Math.ceil(newTickets.length / pageSize)));
                setCurrentPage(0);
                setHasMore(false);
            } else {
                const searchTerm = search.trim() || '';
                const res = await api.get('/repairTicket/searchRepairTickets', {
                    params: {
                        searchTerm,
                        page,
                        size: pageSize
                    }
                });
                const newTickets = res.data.content || [];
                const totalPagesCount = res.data.totalPages || 0;
                setTickets(newTickets);
                setCurrentPage(page);
                setTotalPages(totalPagesCount);
                setHasMore(page < totalPagesCount - 1);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unknown error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
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
                return (
                    ticket.ticketNumber?.toLowerCase().includes(q) ||
                    ticket.customerName?.toLowerCase().includes(q) ||
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

    const displayedTickets = role === 'CUSTOMER'
        ? clientFilteredTickets.slice(currentPage * pageSize, currentPage * pageSize + pageSize)
        : clientFilteredTickets; // server already paginated to pageSize

    // pagination controls (show limited page numbers)
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        const pages = [];
        const maxButtons = 5;
        let start = Math.max(0, currentPage - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;
        if (end >= totalPages - 1) {
            end = totalPages - 1;
            start = Math.max(0, end - maxButtons + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                        i === currentPage
                            ? 'bg-[#25D482] text-white border-[#25D482]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {i + 1}
                </button>
            );
        }
        return (
            <div className="flex items-center gap-2 flex-wrap justify-center mt-8">
                <button
                    onClick={() => currentPage > 0 && goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                    Prev
                </button>
                {pages}
                <button
                    onClick={() => currentPage < totalPages - 1 && goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                    Next
                </button>
            </div>
        );
    };

    // Helper component for small thumbnail (first repair photo)
    const Thumbnail = ({ photoUrl, alt }) => {
        const [src, setSrc] = useState(null);
        useEffect(() => {
            let active = true;
            async function load() {
                if (!photoUrl) return;
                try {
                    const res = await api.get('/repairTicket/getRepairPhotos', { params: { photoUrl } });
                    if (active) setSrc(res.data);
                } catch (e) {
                    if (active) setSrc(null);
                }
            }
            load();
            return () => { active = false; };
        }, [photoUrl]);
        return (
            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                {src ? (
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                ) : (
                    <span>—</span>
                )}
            </div>
        );
    };

    // NEW: render table view
    const renderTable = () => {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto rounded-lg">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100/70 text-xs uppercase tracking-wide text-gray-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Ticket #</th>
                                <th className="px-4 py-3 text-left font-semibold">Photo</th>
                                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                                <th className="px-4 py-3 text-left font-semibold">Device</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-left font-semibold">Check-In Date</th>
                                <th className="px-4 py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedTickets.map(ticket => {
                                const statusVal = ticket.status || ticket.repairStatus || 'N/A';
                                const firstPhoto = ticket.repairPhotosUrls && ticket.repairPhotosUrls.length > 0 ? ticket.repairPhotosUrls[0] : null;
                                return (
                                    <tr key={ticket.ticketNumber}
                                        className="hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedTicket(ticket)}
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTicket(ticket); }}
                                        aria-label={`View details for ticket ${ticket.ticketNumber}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">{ticket.ticketNumber}</td>
                                        <td className="px-4 py-3"><Thumbnail photoUrl={firstPhoto} alt={`Ticket ${ticket.ticketNumber}`} /></td>
                                        <td className="px-4 py-3 whitespace-nowrap">{ticket.customerName || '—'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{ticket.deviceBrand} {ticket.deviceModel}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {statusVal}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{ticket.checkInDate || '—'}</td>
                                        <td className="px-4 py-3">
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
                {renderPagination()}
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
                        View and manage all repair ticket records. Search through past repairs and access detailed information about each service request.
                    </p>
                </div>
                {/* Unified control bar */}
                <div className="mb-8">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 gap-3 items-center">
                            <div className="flex flex-1 gap-3">
                                <input
                                    type="text"
                                    placeholder={role === 'CUSTOMER' ? 'Search your tickets...' : 'Search by Ticket #, Name, Email...'}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgba(51,228,7,0.3)] focus:border-[#25D482] text-sm"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-[#25D482] text-white rounded-md hover:bg-[#1fab6b] transition-colors text-sm font-medium"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center text-sm">
                            <div className="flex items-center gap-2">
                                <label className="text-gray-600 font-medium">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(51,228,7,0.3)]"
                                >
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-gray-600 font-medium">Per Page</label>
                                <select
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(51,228,7,0.3)]"
                                >
                                    {[5,10,20].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                </select>
                            </div>
                            {/* Modes (table / cards) relocated next to filters */}
                            <div className="flex items-center gap-1" aria-label="Display mode">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${viewMode === 'table' ? 'bg-[#25D482] text-white border-[#25D482]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                                    aria-pressed={viewMode === 'table'}
                                >
                                    Table
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${viewMode === 'cards' ? 'bg-[#25D482] text-white border-[#25D482]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                                    aria-pressed={viewMode === 'cards'}
                                >
                                    Cards
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {loading && (
                    <div className="text-center text-gray-500 py-16">Loading tickets...</div>
                )}
                {error && (
                    <div className="text-center text-red-500 py-16">{error}</div>
                )}
                {!loading && !error && displayedTickets.length === 0 && (
                    <div className="text-center text-gray-400 py-16">
                        No repair records found.<br />Suggestions: Check spelling, try fewer keywords.
                    </div>
                )}
                {!loading && !error && displayedTickets.length > 0 && (
                    <>
                        {viewMode === 'table' ? (
                            renderTable()
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {displayedTickets.map(ticket => (
                                        <TicketCard key={ticket.ticketNumber} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
                                    ))}
                                </div>
                                {renderPagination()}
                            </>
                        )}
                    </>
                )}
                {selectedTicket && (
                    <TicketDetailsModal
                        ticket={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default HistoryPage;

