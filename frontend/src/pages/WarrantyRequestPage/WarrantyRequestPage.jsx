import React, { useState, useEffect } from "react";
import {Package, TabletSmartphone, Computer, Headphones, Archive, Search} from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import WarrantyRequest from "../../components/WarrantyRequest/WarrantyRequest.jsx";
import CheckWarranty from "../../components/CheckWarranty/CheckWarranty.jsx";
import WarrantyDetails from "../../components/WarrantyDetails/WarrantyDetails.jsx";

const WarrantyRequestPage = () => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [warranty, setWarranty] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterBy, setFilterBy] = useState("serial");
    const [searchQuery, setSearchQuery] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [pendingStatus, setPendingStatus] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        status: ""
    });
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'resolved'
    const [checkWarrantyModalOpen, setCheckWarrantyModalOpen] = useState(false);

    const onClose = () => {
        setIsModalOpen(false);
        setModalOpen(false);
        setShowModal(false);
        setSelectedRequest(null);
        setPendingStatus("");
    };

    const filterByLabel = {
        serial: "Serial Number",
        device: "Device Type",
        customer: "Customer Name",
    }[filterBy];

    const STATUS_OPTIONS = [
        "CHECKED_IN",
        "ITEM_RETURNED",
        "WAITING_FOR_WARRANTY_REPLACEMENT",
        "WARRANTY_REPLACEMENT_ARRIVED",
        "WARRANTY_REPLACEMENT_COMPLETED",
        "DENIED"
    ];

    const handleCardClick = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
        setShowModal(false);
    };

    // Fetch warranties for customer by email
    const fetchWarrantiesbyemail = async (email) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }
            console.log(email);

            const response = await fetch(`${window.__API_BASE__}/warranty/getWarrantyByCustomerEmail?email=${email.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            console.log("Warranties fetched successfully:", warranty);

            if (response.status === 204) {
                // No warranties found, set warranty to an empty array
                setWarranty([]);
                console.log("No warranties found for email:", email);
            } else if (response.ok) {
                const data = await response.json();
                // Ensure customerName is constructed from firstName and lastName if not present
                const processedData = data.map(w => ({
                    ...w,
                    customerName: w.customerName || 
                        (w.customerFirstName && w.customerLastName 
                            ? `${w.customerFirstName} ${w.customerLastName}`.trim()
                            : w.customerFirstName || w.customerLastName || 'N/A')
                }));
                setWarranty(processedData);
                console.log("Warranties by email fetched successfully:", processedData);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch warranties for staff
    const fetchWarranties = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            const response = await fetch(`${window.__API_BASE__}/warranty/getAllWarranties`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();

            if (response.status === 204) {
                // No warranties found, set warranty to an empty array
                setWarranty([]);
                console.log("No warranties found");
            } else if (response.ok) {
                const data = JSON.parse(text);
                // Ensure customerName is constructed from firstName and lastName if not present
                const processedData = Array.isArray(data) ? data.map(w => ({
                    ...w,
                    customerName: w.customerName || 
                        (w.customerFirstName && w.customerLastName 
                            ? `${w.customerFirstName} ${w.customerLastName}`.trim()
                            : w.customerFirstName || w.customerLastName || 'N/A')
                })) : data;
                setWarranty(processedData);
                console.log("Warranties fetched successfully:", processedData);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch warranties on component mount
    useEffect(() => {
        setLoading(true);
        onClose();
        try{
            if(role === "customer") {
                fetchWarrantiesbyemail(userData.email);
            } else {
                fetchWarranties();
            }

        }catch (err) {
            setError("Failed to fetch warranty data.");
            setLoading(false);
        }
        setTimeout(() => {
            try {

                setLoading(false);
            } catch (err) {
                setError("Failed to fetch warranty requests.");
                setLoading(false);
            }
        }, 1000);
    }, []);

    const UpdateStatus = async (warranty) => {

        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Not authenticated. Please log in.");

        const form = new FormData();
        if (warranty) {
            form.append("warrantyNumber", warranty.toString());
        }
        if (pendingStatus) {
            form.append("status", pendingStatus.toString());
        }

    const response = await fetch(`${window.__API_BASE__}/warranty/updateWarrantyStatus`, {
            method: "PATCH",
            headers: {Authorization: `Bearer ${token}`},
            body: form,
        });
        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.text();
                errorMessage = errorData || `Server returned ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `Server returned ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        const result = await response.json();

        if(role === "customer") {
            fetchWarrantiesbyemail(userData.email);
        } else {
            fetchWarranties();
        }

    }

    const handleStatusChange = (e,currentStatus, request) => {
        const newStatus = e.target.value;

        console.log(newStatus, currentStatus);

        // Determine which message to show
        if (currentStatus === "CHECKED_IN" && newStatus === "ITEM_RETURNED") {
            setModalMessage("Please check device condition and upload photos.");
        } else {
            setModalMessage(`Are you sure you want to change status to "${newStatus.replace(/_/g, " ")}"?`);
        }
        setSelectedRequest(request);
        setPendingStatus(newStatus);
        setShowModal(true);
    };

    const confirmStatusChange = () => {
        setFormData({ ...formData, status: pendingStatus });
        setShowModal(false);
        UpdateStatus(selectedRequest.warrantyNumber)
            .then(() => {
                setModalMessage(`Status changed to "${pendingStatus.replace(/_/g, " ")}" successfully.`);
                setSelectedRequest(null);
                setPendingStatus("");
            })
            .catch((error) => {
                setError(error.message);
                console.error("Error updating status:", error);
            });
    };

    const getProductIcon = (deviceType) => {
        if (!deviceType || typeof deviceType !== "string") return <Archive className="text-gray-500 w-8 h-8" />;

        const name = deviceType.toLowerCase();

        if (name.includes("laptop") || name.includes("computer") || name.includes("pc")) {
            return <Computer
                className={` size-10
                             ${role !== "customer" ? "text-[#2563eb]" : "text-[#10B981]"}`
            } />;
        } else if (name.includes("phone") || name.includes("smartphone") || name.includes("tablet")) {
            return <TabletSmartphone className={` size-10
                             ${role !== "customer" ? "text-[#2563eb]" : "text-[#10B981]"}`
            } />;
        } else if (name.includes("headset") || name.includes("earphone") || name.includes("headphone")) {
            return <Headphones className={` size-10
                             ${role !== "customer" ? "text-[#2563eb]" : "text-[#10B981]"}`
            } />;
        } else {
            return <Archive className={` size-10
                             ${role !== "customer" ? "text-[#2563eb]" : "text-[#10B981]"}`
            } />;
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const applyFilters = (list) => {
        let filtered = list.slice();
        
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(w => {
                const serial = (w.serialNumber || '').toString().toLowerCase();
                const device = (w.deviceName || '').toString().toLowerCase();
                const customer = (w.customerName || '').toString().toLowerCase();
                
                if (filterBy === "serial") return serial.includes(q);
                if (filterBy === "device") return device.includes(q);
                if (filterBy === "customer") return customer.includes(q);
                return serial.includes(q) || device.includes(q) || customer.includes(q);
            });
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (sortConfig.direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        return filtered;
    };

    const pendingWarranties = warranty.filter(w => w.status !== "WARRANTY_REPLACEMENT_COMPLETED" && w.status !== "DENIED");
    const resolvedWarranties = warranty.filter(w => w.status === "WARRANTY_REPLACEMENT_COMPLETED" || w.status === "DENIED");

    const filteredPending = applyFilters(pendingWarranties);
    const filteredResolved = applyFilters(resolvedWarranties);

    const currentWarranties = activeTab === 'resolved' ? filteredResolved : filteredPending;

    useEffect(() => {
        const tp = Math.max(1, Math.ceil(currentWarranties.length / pageSize));
        setTotalPages(tp);
        setTotalEntries(currentWarranties.length);
        if (currentPage > tp - 1) setCurrentPage(0);
    }, [currentWarranties.length, pageSize]);

    const displayedWarranties = currentWarranties.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

    const renderTable = () => {
        return (
            <>
                <div className="overflow-x-auto mb-2">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 border-b border-gray-200">
                        <tr>
                            <th 
                                className="px-5 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('customerName')}
                            >
                                Customer {sortConfig.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="px-5 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('deviceName')}
                            >
                                Device {sortConfig.key === 'deviceName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th 
                                className="px-5 py-3 text-left font-semibold cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('serialNumber')}
                            >
                                Serial # {sortConfig.key === 'serialNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-5 py-3 text-left font-semibold">Status</th>
                            <th className="px-5 py-3 text-left font-semibold">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {displayedWarranties.map((warrantyItem, index) => (
                            <tr 
                                key={index}
                                className="hover:bg-gray-50 focus-within:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => handleCardClick(warrantyItem)}
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(warrantyItem); }}
                            >
                                <td className="px-5 py-3 whitespace-nowrap">{warrantyItem.customerName || '—'}</td>
                                <td className="px-5 py-3 whitespace-nowrap">{warrantyItem.deviceName || '—'}</td>
                                <td className="px-5 py-3 whitespace-nowrap">{warrantyItem.serialNumber || '—'}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                        warrantyItem.status === "DENIED" ? "bg-yellow-100 text-yellow-800" :
                                        warrantyItem.status === "WARRANTY_REPLACEMENT_COMPLETED" ? "bg-green-100 text-green-800" :
                                        "bg-blue-100 text-blue-800"
                                    }`}>
                                        {warrantyItem.status?.replace(/_/g, " ") || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCardClick(warrantyItem); }}
                                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#25D482] text-white hover:bg-[#1fab6b] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D482]"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
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
                        const shown = displayedWarranties.length || 0;
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

    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">

            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'warranty'}/>
            </div>


            <div className="flex-1 overflow-auto bg-gray-50 min-h-screen md:min-h-0">
                <div className="flex-1 p-8">
                    <div className="flex justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-4">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-3xl font-semibold text-gray-800 mb-2">Warranty Return Request (RMA)</h1>
                                <p className="text-gray-600 text-base max-w-3xl">
                                    Check warranty left and warranty return request status for your devices.
                                </p>
                            </div>

                            {/* Warranty Status Checker Button */}
                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => setCheckWarrantyModalOpen(true)}
                                    className="flex items-center bg-[#10B981] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-[#0f9f6e] transition-all duration-200 min-w-[44px] min-h-[44px] whitespace-nowrap"
                                >
                                    <span className="text-sm sm:text-base">Warranty Status Checker</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="px-0 py-4">
                        {loading ? (
                            <div className="text-center py-8">
                                <p>Loading warranty requests...</p>
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
                            <>
                                <section className="mb-8">
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        {/* Tabs */}
                                        <div className="flex justify-between items-end mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex border-b border-gray-300">
                                                    <button
                                                        onClick={() => {
                                                            setActiveTab('pending');
                                                            setCurrentPage(0);
                                                        }}
                                                        className={`px-4 py-3 font-medium transition-all ${
                                                            activeTab === 'pending' 
                                                                ? 'border-b-2 border-[#2563eb] text-[#2563eb]' 
                                                                : 'text-gray-600 hover:text-[#2563eb]'
                                                        }`}
                                                    >
                                                        Pending Warranties
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActiveTab('resolved');
                                                            setCurrentPage(0);
                                                        }}
                                                        className={`px-4 py-3 font-medium transition-all ${
                                                            activeTab === 'resolved' 
                                                                ? 'border-b-2 border-[#2563eb] text-[#2563eb]' 
                                                                : 'text-gray-600 hover:text-[#2563eb]'
                                                        }`}
                                                    >
                                                        Resolved Warranties
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="flex flex-col gap-1">
                                                <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                                    {activeTab === 'resolved' ? 'Resolved Warranty Requests' : 'Pending Warranty Requests'}
                                                    <span className="text-sm font-normal text-gray-500">
                                                        ({activeTab === 'resolved' ? resolvedWarranties.length : pendingWarranties.length})
                                                    </span>
                                                </h2>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full lg:w-auto">
                                                <div className="flex flex-1 min-w-[220px] items-center gap-2 flex-col sm:flex-row sm:items-center">
                                                    <div className="flex items-center gap-2 w-full sm:flex-1">
                                                        <select
                                                            className="text-sm text-gray-700 px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#25D482]/30"
                                                            value={filterBy}
                                                            onChange={(e) => setFilterBy(e.target.value)}
                                                        >
                                                            <option value="serial">Serial Number</option>
                                                            <option value="device">Device Type</option>
                                                            <option value="customer">Customer Name</option>
                                                        </select>
                                                        <input
                                                            type="text"
                                                            placeholder={`Search by ${filterByLabel}`}
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && setCurrentPage(0)}
                                                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D482]/30 focus:border-[#25D482]"
                                                        />
                                                        {searchQuery && (
                                                            <button
                                                                onClick={() => setSearchQuery('')}
                                                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                                            >Clear</button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setCurrentPage(0)}
                                                        className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-[#25D482] text-white rounded-md hover:bg-[#1fab6b] text-sm font-medium whitespace-nowrap"
                                                    >Search</button>
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
                                        {currentWarranties.length === 0 ? (
                                            <p className="text-center text-gray-600 py-8">
                                                No {activeTab === 'resolved' ? 'resolved' : 'pending'} warranties found.
                                            </p>
                                        ) : (
                                            <>
                                                {viewMode === 'table' ? (
                                                    renderTable()
                                                ) : (
                                                    <>
                                                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-6">
                                                            {displayedWarranties.map((request, index) => (
                                                                <div
                                                                    key={index}
                                                                    onClick={() => handleCardClick(request)}
                                                                    className={`cursor-pointer flex border rounded-lg p-4 shadow-sm hover:shadow-md transition overflow-hidden 
                                                                                ${role !== "customer" ? "bg-[rgba(37,99,235,0.05)] border-[#2563eb]" : "bg-[rgba(51,228,7,0.05)] border-[#33e407]"}`
                                                                    }
                                                                >
                                                                    <div className="mr-4 flex items-start">{getProductIcon(request.deviceName)}</div>
                                                                    <div>
                                                                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                                                            {request.warrantyNumber}
                                                                        </h2>
                                                                        <p className="text-sm text-gray-600">
                                                                            <strong>Device:</strong> {request.deviceName}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600">
                                                                            <strong>Customer:</strong> {request.customerName}
                                                                        </p>
                                                                        {role === "customer" ? (
                                                                            <p
                                                                                className={`text-sm font-medium mt-1 ${
                                                                                    request.status === "CHECKED_IN" ? "text-green-600" : "text-yellow-600"
                                                                                }`}
                                                                            >
                                                                                Status: {request.status?.replace(/_/g, " ")}
                                                                            </p>
                                                                        ) : (
                                                                            <>
                                                                                <span className="text-sm font-semibold text-gray-600 pr-2">Status:</span>
                                                                                <select
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    onChange={(e) => handleStatusChange(e, request.status, request)}
                                                                                    value={request.status}
                                                                                    className="text-xs px-2 border rounded-md bg-[rgba(51,228,7,0.05)] border-[0] text-gray-800 w-32 h-7"
                                                                                >
                                                                                    {STATUS_OPTIONS
                                                                                        .filter((status, index) => {
                                                                                            const currentIndex = STATUS_OPTIONS.indexOf(request.status);
                                                                                            if (status === request.status) return true;
                                                                                            if (status === "DENIED") return true;
                                                                                            if (request.status === "CHECKED_IN") {
                                                                                                return status === "ITEM_RETURNED";
                                                                                            }
                                                                                            if (request.status === "ITEM_RETURNED") {
                                                                                                const statusIndex = STATUS_OPTIONS.indexOf(status);
                                                                                                return statusIndex >= currentIndex && (status === "ITEM_RETURNED" || role === "admin");
                                                                                            }
                                                                                            return index >= currentIndex;
                                                                                        })
                                                                                        .map((status) => (
                                                                                            <option key={status} value={status}>
                                                                                            {status.replace(/_/g, " ")}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {renderPagination()}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </section>

                                {/* Warranty Modal */}
                                {modalOpen && (
                                    <>
                                        {role === "customer" && (
                                            <WarrantyDetails
                                                key="customer"
                                                isOpen={modalOpen}
                                                onClose={onClose}
                                                data={selectedRequest}
                                                onSuccess={() => fetchWarrantiesbyemail(userData.email)}
                                            />
                                        )}

                                        {(role === "technician" || role === "admin") && (
                                            <WarrantyRequest
                                                key="staff"
                                                isOpen={modalOpen}
                                                onClose={onClose}
                                                data={selectedRequest}
                                                onSuccess={() => fetchWarranties()}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-96">
                        <p className="text-gray-800 mb-4">{modalMessage}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-sm rounded"
                            >
                                Cancel
                            </button>
                            {pendingStatus === "ITEM_RETURNED" ? (
                                <button
                                    onClick={() => {
                                        handleCardClick(selectedRequest);
                                    }}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                                >
                                    Confirm
                                </button>
                            ) : (
                                <button
                                    onClick={confirmStatusChange}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Check Warranty Modal */}
            <CheckWarranty
                isOpen={checkWarrantyModalOpen}
                onClose={() => setCheckWarrantyModalOpen(false)}
                onSuccess={() => {
                    if (role === "customer") {
                        fetchWarrantiesbyemail(userData.email);
                    } else {
                        fetchWarranties();
                    }
                }}
            />
        </div>

    );
};

export default WarrantyRequestPage;

