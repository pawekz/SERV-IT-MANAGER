import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Package, TabletSmartphone, Computer, Headphones, Archive, Search} from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import RequestReturn from "../../components/RequestReturn/RequestReturn.jsx";
import WarrantyRequest from "../../components/WarrantyRequest/WarrantyRequest.jsx";
import CheckWarranty from "../../components/CheckWarranty/CheckWarranty.jsx";



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

    const onClose = () => {
        setIsModalOpen(false);
        setModalOpen(false);
        setShowModal(false);
        setSelectedRequest(null);
        setPendingStatus("");
    };

    const filterByLabel = {
        serial: "Serial Number",
        tracking: "Tracking Number",
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

    const currentStatusIndex = STATUS_OPTIONS.indexOf(warranty.status);

    const handleCardClick = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
    };

    const fetchWarrantiesbyemail = async (email) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }
            console.log(email);

            const response = await fetch(`http://localhost:8080/warranty/getWarrantyByCustomerEmail?email=${email.toString()}`, {
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
                setWarranty(data);
                console.log("Warranties by email fetched successfully:", data);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchWarranties = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            const response = await fetch('http://localhost:8080/warranty/getAllWarranties', {
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
                setWarranty(data);
                console.log("Warranties by email fetched successfully:", data);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
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

        const response = await fetch("http://localhost:8080/warranty/updateWarrantyStatus", {
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
            return <Computer className="text-[#10B981] size-10" />;
        } else if (name.includes("phone") || name.includes("smartphone") || name.includes("tablet")) {
            return <TabletSmartphone className="text-[#10B981] size-10" />;
        } else if (name.includes("headset") || name.includes("earphone") || name.includes("headphone")) {
            return <Headphones className="text-[#10B981] size-10" />;
        } else {
            return <Archive className="text-[#10B981] size-10" />;
        }
    };

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">

            <Sidebar activePage="warranty" />

            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                    <div className="mb-4">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Warranty Return Request (RMA)</h1>
                        <p className="text-gray-600 text-base max-w-3xl">
                            Check warranty left and warranty return request status for your devices.
                        </p>
                    </div>
                <div className="flex justify-between">
                    <div className="w-full">
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
                                {/* Pending Warranty + Check Warranty Row */}
                                <section className="flex flex-col lg:flex-row gap-6 mb-8">
                                    {/* Pending Warranty */}
                                    <div className="flex-1 bg-white rounded-lg shadow-md p-6">
                                        <div className="flex justify-between items-end mb-6">
                                            <h1 className="text-xl font-semibold text-gray-800">Pending Warranty</h1>

                                            {/* Filter and Search */}
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="text-sm text-gray-700 px-2 py-1 rounded-lg"
                                                    value={filterBy}
                                                    onChange={(e) => setFilterBy(e.target.value)}
                                                >
                                                    <option value="serial">Serial Number</option>
                                                    <option value="tracking">Tracking Number</option>
                                                    <option value="device">Device Type</option>
                                                    <option value="customer">Customer Name</option>
                                                </select>

                                                <input
                                                    type="text"
                                                    className="text-sm px-3 py-1 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                                    placeholder={`Search by ${filterByLabel}`}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {/* Pending Warranties Cards */}
                                        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
                                            {warranty.filter(warranty => warranty.status !== "WARRANTY_REPLACEMENT_COMPLETED").length === 0 ? (
                                                <p className="text-gray-400 col-span-full text-center">
                                                    No pending warranties found. <br/>Use the checker to verify serial number and start a warranty request.
                                                </p>
                                            ) : (
                                                warranty
                                                    .filter(warranty => warranty.status !== "WARRANTY_REPLACEMENT_COMPLETED")
                                                    .map((request, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => handleCardClick(request)}
                                                            className="cursor-pointer flex bg-[rgba(51,228,7,0.05)] border border-[#33e407] rounded-lg p-4 shadow-sm hover:shadow-md transition overflow-hidden"
                                                        >
                                                            <div className="mr-4 flex items-start">{getProductIcon(request.deviceType)}</div>
                                                            <div>
                                                                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                                                    {request.serialNumber}
                                                                </h2>
                                                                <p className="text-sm text-gray-600">
                                                                    <strong>Device Name:</strong> {request.deviceName}
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
                                                                        Status: {request.status}
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
                                                                            {STATUS_OPTIONS.map((status, index) => (
                                                                                <option key={status} value={status} disabled={index < currentStatusIndex}>
                                                                                    {status.replace(/_/g, " ")}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </>
                                                                )}

                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </div>

                                        <div className="lg:w-[30%] w-full bg-white rounded-lg shadow-md p-6 h-fit">
                                            <CheckWarranty
                                                onSuccess={() => {
                                                if (role === "customer") {
                                                    fetchWarrantiesbyemail(userData.email);
                                                } else {
                                                    fetchWarranties();
                                                }
                                            }}
                                            />
                                        </div>
                                </section>

                                {/* Resolved Warranty Section */}
                                <section className="bg-white rounded-lg shadow-md p-6 flex-col jus">
                                        <div className="flex justify-between items-end mb-6">
                                    <h1 className="text-xl font-semibold text-gray-800 mb-6">Resolved Warranty</h1>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="text-sm text-gray-700 px-2 py-1 rounded-lg"
                                                    value={filterBy}
                                                    onChange={(e) => setFilterBy(e.target.value)}
                                                >
                                                    <option value="serial">Serial Number</option>
                                                    <option value="tracking">Tracking Number</option>
                                                    <option value="device">Device Type</option>
                                                    <option value="customer">Customer Name</option>
                                                </select>

                                                <input
                                                    type="text"
                                                    className="text-sm px-3 py-1 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                                    placeholder={`Search by ${filterByLabel}`}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    {warranty.filter(w => w.status === "WARRANTY_REPLACEMENT_COMPLETED").length === 0 ? (
                                        <p className="text-center text-gray-400">
                                            No resolved warranties found. <br /> Use the checker to verify serial number and start a warranty request.
                                        </p>
                                    ) : (
                                        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
                                            {warranty
                                                .filter((warranty) => warranty.status === "WARRANTY_REPLACEMENT_COMPLETED" )
                                                .map((request,index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleCardClick(request)}
                                                        className="cursor-pointer flex bg-[rgba(51,228,7,0.05)] border border-[#33e407] rounded-lg p-4 shadow-sm hover:shadow-md transition"
                                                    >
                                                        <div className="mr-4 flex items-start">{getProductIcon(request.deviceType)}</div>
                                                        <div>
                                                            <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                                                {request.serialNumber}
                                                            </h2>
                                                            <p className="text-sm text-gray-600">
                                                                <strong>Device Name:</strong> {request.deviceName}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                <strong>Customer:</strong> {request.customerName}
                                                            </p>
                                                            <p
                                                                className={`text-sm font-medium mt-1 ${
                                                                    request.status === "Denied"
                                                                        ? "text-yellow-600"
                                                                        : "text-green-600"
                                                                }`}
                                                            >
                                                                Status: {request.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </section>

                                {/* View-Only Modal */}
                                <WarrantyRequest
                                    isOpen={modalOpen}
                                    onClose={onClose}
                                    data={selectedRequest}
                                    onSuccess={() => {
                                        if (role === "customer") {
                                            fetchWarrantiesbyemail(userData.email);
                                        } else {
                                            fetchWarranties();
                                        }
                                    }}
                                />
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
        </div>

    );
};

export default WarrantyRequestPage;

