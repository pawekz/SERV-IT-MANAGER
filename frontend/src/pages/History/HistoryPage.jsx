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

    const { email, role } = getUserInfoFromToken();

    const fetchTickets = async (page = 0, append = false) => {
        const isInitialLoad = page === 0;
        if (isInitialLoad) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            if (role === 'CUSTOMER') {
                // Fetch all tickets for customer (not paginated, no search)
                console.log('[HistoryPage] Fetching customer tickets for email:', email);
                const res = await api.get('/repairTicket/getRepairTicketsByCustomerEmail', {
                    params: { email }
                });
                const newTickets = res.data || [];
                console.log('[HistoryPage] Customer tickets response:', newTickets);
                console.log('[HistoryPage] Number of tickets found:', newTickets.length);
                setTickets(newTickets);
                setHasMore(false); // No pagination for customer
                setCurrentPage(0);
                setTotalPages(1);
            } else {
                // Paginated search for admin/tech
                const searchTerm = search.trim() || '';
                const res = await api.get('/repairTicket/searchRepairTickets', {
                    params: {
                        searchTerm,
                        page,
                        size: 20
                    }
                });
                const newTickets = res.data.content || [];
                const totalPagesCount = res.data.totalPages || 0;
                if (append) {
                    setTickets(prev => [...prev, ...newTickets]);
                } else {
                    setTickets(newTickets);
                }
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

    useEffect(() => {
        fetchTickets(0, false);
        // eslint-disable-next-line
    }, [role, email]); // Remove search dependency for customers

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && role !== 'CUSTOMER') {
            fetchTickets(currentPage + 1, true);
        }
    };

    const handleSearch = () => {
        if (role !== 'CUSTOMER') {
            fetchTickets(0, false);
        }
    };

    // Filter tickets for customers based on search term
    const filteredTickets = role === 'CUSTOMER' && search.trim()
        ? tickets.filter(ticket =>
            ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
            ticket.customerName.toLowerCase().includes(search.toLowerCase()) ||
            ticket.deviceBrand.toLowerCase().includes(search.toLowerCase()) ||
            ticket.deviceModel.toLowerCase().includes(search.toLowerCase()) ||
            ticket.deviceSerialNumber.toLowerCase().includes(search.toLowerCase()) ||
            ticket.status.toLowerCase().includes(search.toLowerCase())
        )
        : tickets;

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            <Sidebar activePage="history" />

            {/* Main Content */}
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                {/* TEMP: Button to show DeviceCard for layout preview
        <div className="mb-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
            onClick={() => setShowDeviceCard(v => !v)}
          >
            {showDeviceCard ? 'Hide' : 'Show'} DeviceCard Preview
          </button>
        </div>*/}
                {/*{showDeviceCard && (
          <div className="mb-8">
            <DeviceCard />
          </div>
        )}*/}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">Repair Ticket History</h1>
                    <p className="text-gray-600 text-base max-w-3xl">
                        View and manage all repair ticket records. Search through past repairs and access detailed information about each service request.
                    </p>
                </div>

                <div className="flex gap-4 mb-8">
                    <input
                        type="text"
                        placeholder={role === 'CUSTOMER' ? "Search your tickets by Ticket Number, Device, Status..." : "Search by Ticket Number, Name, Email..."}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgba(51,228,7,0.1)] focus:border-[#25D482]"
                    />
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-[#25D482] text-white rounded-md hover:bg-[#1fab6b] transition-colors"
                    >
                        Search
                    </button>
                </div>

                {loading && (
                    <div className="text-center text-gray-500 py-16">Loading tickets...</div>
                )}
                {error && (
                    <div className="text-center text-red-500 py-16">{error}</div>
                )}
                {!loading && !error && tickets.length === 0 && (
                    <div className="text-center text-gray-400 py-16">
                        No repair records found.<br />Suggestions: Check spelling, try fewer keywords.
                    </div>
                )}
                {!loading && !error && tickets.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredTickets.map(ticket => (
                                <TicketCard key={ticket.ticketNumber} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
                            ))}
                        </div>

                        {/* Load More Section */}
                        {role !== 'CUSTOMER' && (
                            <div className="mt-8 text-center">
                                {loadingMore && (
                                    <div className="text-gray-500 py-4">Loading more tickets...</div>
                                )}
                                {!loadingMore && hasMore && (
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-3 bg-[#25D482] text-white rounded-md hover:bg-[#1fab6b] transition-colors font-medium"
                                    >
                                        Load More
                                    </button>
                                )}
                                {!loadingMore && !hasMore && tickets.length > 0 && (
                                    <div className="text-gray-500 py-4 font-medium">
                                        You reached the end results
                                    </div>
                                )}
                            </div>
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

