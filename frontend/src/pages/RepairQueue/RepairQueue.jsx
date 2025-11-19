import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Plus, ChevronUp } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import TicketDetailsModal from "../../components/TicketDetailsModal/TicketDetailsModal.jsx";
import api, { parseJwt } from '../../config/ApiConfig';
import TicketCard from '../../components/TicketCard/TicketCard';

const RepairQueue = () => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

    // Determine user role from JWT token (stored in localStorage as 'authToken')
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

    // Resolve a stable key for each request so dropdown state is tied to a single card
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

    const handleCardClick = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
    };

    const handleStatusClick = (e, ticketId) => {
        e.stopPropagation(); // Prevent triggering the card click
        setStatusDropdownOpen(prev => (prev === ticketId ? null : ticketId));
    };

    const changeStatus = (e, ticketId, newStatus) => {
        e.stopPropagation(); // Prevent triggering the card click

        // Update the status in state
        setTicketRequests(prevRequests =>
            prevRequests.map(request =>
                (resolveTicketKey(request) === ticketId ? { ...request, status: newStatus, repairStatus: newStatus } : request)
            )
        );

        setStatusDropdownOpen(null); // Close the dropdown

        // Here you would normally update the database
        console.log(`Status for request ${ticketId} changed to ${newStatus}`);
    };

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);

            try {
                let res;
                if (role === "admin") {
                    // ADMIN: Fetch all repair tickets across multiple statuses
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
                    // CUSTOMER: Fetch tickets linked to the customer's email
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setStatusDropdownOpen(null);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

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
                                onClick={(e) => { e.stopPropagation(); changeStatus(e, ticketKey, status); }}
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
                    <div className="px-10 py-8">
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
                                    {ticketRequests.length === 0 ? (
                                        <p className="text-center text-gray-600">
                                            No warranty return requests have been made yet.
                                        </p>

                                    ) : (

                                        // Pending Repairs

                                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                            {ticketRequests
                                                .filter((request) => {
                                                    const s = (request.status || request.repairStatus || '').toString().trim().toUpperCase();
                                                    // exclude resolved statuses
                                                    return s !== 'COMPLETED' && s !== 'COMPLETE' && s !== 'READY_FOR_PICKUP';
                                                })
                                                .map((request) => {
                                                     const ticketKey = resolveTicketKey(request);
                                                     return (
                                                         <TicketCard
                                                             key={ticketKey}
                                                             ticket={request}
                                                             onClick={() => handleCardClick(request)}
                                                             renderStatusControl={renderStatusControl}
                                                         />
                                                     );
                                                 })}
                                        </div>
                                    )}
                                    <TicketDetailsModal
                                        isOpen={modalOpen}
                                        onClose={() => setModalOpen(false)}
                                        data={selectedRequest}
                                        readonly={true}
                                    />
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
