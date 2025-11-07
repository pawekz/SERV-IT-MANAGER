import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Wrench, Images, Archive, Plus, ChevronUp} from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import api, { parseJwt } from "../../config/ApiConfig.jsx";
import TicketDetailsModal from "../../components/TicketDetailsModal/TicketDetailsModal.jsx";
function TicketImage({ path, alt, className }) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let url;
        if (path) {
            fetchPresignedPhotoUrl(path)
                .then(presignedUrl => {
                    url = presignedUrl;
                    setSrc(presignedUrl);
                })
                .catch(err => {
                    console.error('[TicketDetailsModal] Error loading presigned image:', err);
                });
        }
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [path]);
    if (!src) {
        return <div className={className + ' bg-gray-100 flex items-center justify-center'}>Loading...</div>;
    }
    return <img src={src} alt={alt} className={className} />;
}

async function fetchPresignedPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    const res = await api.get(`/repairTicket/getRepairPhotos`, { params: { photoUrl } });
    return res.data;
}

const ResolvedRepairs = () => {
    const navigate = useNavigate()
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

    // Determine user role from JWT token (stored in localStorage as 'authToken')
    const token = localStorage.getItem('authToken');
    const decoded = parseJwt(token);
    const role = decoded?.role?.toLowerCase();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ticketRequests, setTicketRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterBy, setFilterBy] = useState("serial");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);

    const filterByLabel = {
        serial: "Serial Number",
        tracking: "Tracking Number",
        device: "Device Type",
        customer: "Customer Name",
    }[filterBy];

    const statusOptions = [
        "Received",
        "Diagnosed",
        "Awaiting Parts",
        "Repairing",
        "Ready for Pickup",
        "Completed"
    ];

    const handleCardClick = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
    };

    const handleStatusClick = (e, requestId) => {
        e.stopPropagation(); // Prevent triggering the card click
        setStatusDropdownOpen(statusDropdownOpen === requestId ? null : requestId);
    };

    const changeStatus = (e, requestId, newStatus) => {
        e.stopPropagation(); // Prevent triggering the card click

        // Update the status in state
        setTicketRequests(prevRequests =>
            prevRequests.map(request =>
                request.id === requestId ? { ...request, status: newStatus } : request
            )
        );

        setStatusDropdownOpen(null); // Close the dropdown

        // Here you would normally update the database
        console.log(`Status for request ${requestId} changed to ${newStatus}`);
    };


    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            const statuses = ["READY_FOR_PICKUP"];

            try {
                const allResults = [];

                for (const status of statuses) {
                    const res = await api.get(
                        `repairTicket/getAllRepairTickets`,
                        {
                            params: { status, page: 0, size: 20 },
                        }
                    );

                    const content = res.data?.content || [];
                    allResults.push(...content);
                }

                // Remove duplicates based on ticketNumber
                const uniqueTickets = Array.from(
                    new Map(allResults.map(ticket => [ticket.ticketNumber, ticket])).values()
                );

                setTicketRequests(uniqueTickets);

            } catch (err) {
                console.error("Failed to fetch repair tickets:", err);
                setError("Failed to fetch repair tickets.");
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

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

    const getStatusColor = (status) => {
        switch(status) {
            case "Received":
                return "text-blue-600";
            case "Diagnosed":
                return "text-purple-600";
            case "Awaiting Parts":
                return "text-orange-600";
            case "Repairing":
                return "text-yellow-600";
            case "Ready for Pickup":
                return "text-green-600";
            case "Completed":
                return "text-gray-600";
            default:
                return "text-yellow-600";
        }
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
                        <div className="mb-4">
                            <h1 className="text-3xl font-semibold text-gray-800 mb-2">Repair Queue Dashboard</h1>
                            <p className="text-gray-600 text-base max-w-3xl">
                                Track and manage all repair tickets in real-time. View status updates, technician assignments, and estimated completion times.
                            </p>
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
                                            {/* Pending Repairs */}
                                            <Link
                                                to="/repairqueue"
                                                className="text-xl font-semibold text-black hover:underline"
                                            >
                                                Pending Repairs
                                            </Link>

                                            {/* Separator */}
                                            <span className="text-gray-400">|</span>

                                            {/* Resolved Repairs Link */}
                                            <Link
                                                to="/resolvedrepairs"
                                                className="text-xl font-semibold text-[#25D482] hover:underline"
                                            >
                                                Resolved Repairs
                                            </Link>
                                        </div>

                                        {/* Add Ticket Button */}
                                        {role !== "customer" && (
                                            <Link to="/newrepair">
                                                <button className="flex items-center bg-[#25D482] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-opacity-90 min-w-[44px] min-h-[44px] whitespace-nowrap">
                                                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                                                    <span className="text-sm sm:text-base">Add Ticket</span>
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                    {ticketRequests.filter(request => request.status === "READY_FOR_PICKUP" ).length === 0 ? (
                                        <p className="text-center text-gray-600">
                                            No repair requests have been is resolved.
                                        </p>

                                    ) : (

                                        // Resolved Repairs

                                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                            {ticketRequests
                                                .filter(request => request.status === "READY_FOR_PICKUP" )
                                                .map((request) => (
                                                    <div
                                                        key={request.ticketId}
                                                        onClick={() => handleCardClick(request)}
                                                        className="cursor-pointer flex-row bg-[rgba(37,99,235,0.05)] border border-[#2563eb] rounded-lg p-4 shadow-sm hover:shadow-md transition"
                                                    >
                                                        {/* 🔹 Repair Photos Section */}
                                                        <section className="rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-3 shadow-sm mb-3">


                                                            <div className="flex flex-wrap gap-2">
                                                                {request.repairPhotosUrls?.length > 0 ? (
                                                                    request.repairPhotosUrls.map((url, idx) => (
                                                                        <button
                                                                            key={idx}
                                                                            type="button"
                                                                            className="group relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D482]/40"
                                                                        >
                                                                            <TicketImage path={url} alt={`Repair Photo ${idx + 1}`} className="object-cover w-full h-full" />
                                                                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">No photos</span>
                                                                )}
                                                            </div>
                                                        </section>
                                                        <p className="text-[12px] mt-[5px]">Ticket Number# {request.ticketNumber}</p>
                                                        <div className="my-2 h-px bg-[#2563eb]">
                                                        </div>

                                                        <div>
                                                            <h2 className="text-[16px] font-semibold text-gray-800 mb-1">
                                                                {request.deviceType}

                                                            </h2>
                                                            <p className="text-[14px] text-gray-600">
                                                                {/*<strong>Customer:</strong> {request.deviceType}*/}
                                                                Issue: {request.reportedIssue}
                                                            </p>
                                                            <div className="mt-[5px]"></div>
                                                            <p className="text-sm text-gray-600">
                                                                Serail Number: {request.deviceSerialNumber}

                                                            </p>
                                                            <div className="relative">
                                                                <p
                                                                    onClick={(e) => handleStatusClick(e, request.id)}
                                                                    className={`text-sm font-medium mt-1 text-right ${getStatusColor(request.status)} cursor-pointer hover:underline flex items-center justify-end`}
                                                                >
                                                                    <ChevronUp className="ml-1 w-4 h-4" /> Status: {request.repairStatus}
                                                                </p>

                                                                {statusDropdownOpen === request.id && (
                                                                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-40">
                                                                        {statusOptions.map((status) => (
                                                                            <button
                                                                                key={status}
                                                                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                                                                    request.status === status ? 'font-bold' : ''
                                                                                }`}
                                                                                onClick={(e) => changeStatus(e, request.id, status)}
                                                                            >
                                                                                {status}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
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

export default ResolvedRepairs;


