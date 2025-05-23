import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Wrench,TabletSmartphone,Images, Headphones, Archive } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import WarrantyRequest from "../../components/WarrantyRequest/WarrantyRequest.jsx";



const RepairQueue = () => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [warrantyRequests, setWarrantyRequests] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterBy, setFilterBy] = useState("serial");
    const [searchQuery, setSearchQuery] = useState("");

    const filterByLabel = {
        serial: "Serial Number",
        tracking: "Tracking Number",
        device: "Device Type",
        customer: "Customer Name",
    }[filterBy];

    const handleCardClick = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
    };

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            try {
                // Replace this with your actual API call
                const fetchedData = [
                    {
                        id: 1,
                        name: "Alice Thompson",
                        phoneNumber: "09171234567",
                        email: "alice.thompson@example.com",
                        orderNumber: "ORD123456",
                        deviceType: "Laptop",
                        purchaseDate: "2024-09-15",
                        serialNumber: "SN-LTP-00123",
                        issueDescription: "Screen flickers randomly during use.",
                        reasons: ["Defective/Not Working", "Performance Issues"],
                        status: "Requested",
                        color: "blue"
                    },
                    {
                        id: 2,
                        name: "Brian Reyes",
                        phoneNumber: "09281234567",
                        email: "brian.reyes@example.com",
                        orderNumber: "ORD987654",
                        deviceType: "Phone",
                        purchaseDate: "2024-11-02",
                        serialNumber: "SN-PHN-00987",
                        issueDescription: "Received a different model than ordered.",
                        reasons: ["Wrong Item Received"],
                        status: "Approved",
                        color: "black"
                    },
                    {
                        id: 3,
                        name: "Catherine Lee",
                        phoneNumber: "09081234567",
                        email: "catherine.lee@example.com",
                        orderNumber: "ORD456789",
                        deviceType: "Headset",
                        purchaseDate: "2024-12-20",
                        serialNumber: "SN-ACC-04567",
                        issueDescription: "Bluetooth connection keeps dropping.",
                        reasons: ["Performance Issues", "Defective/Not Working"],
                        status: "Claimed",
                        color: "pink"
                    },
                    {
                        id: 4,
                        name: "Daniel Cruz",
                        phoneNumber: "09391234567",
                        email: "daniel.cruz@example.com",
                        orderNumber: "ORD654321",
                        deviceType: "Others",
                        purchaseDate: "2025-01-10",
                        serialNumber: "SN-OTH-06543",
                        issueDescription: "Requesting upgrade to a newer model.",
                        reasons: ["Upgrade Request"],
                        status: "Denied",
                        color: "red"
                    }
                ];
                setWarrantyRequests(fetchedData);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch warranty requests.");
                setLoading(false);
            }
        }, 1000);
    }, []);

    const getProductIcon = (deviceType) => {
        if (!deviceType || typeof deviceType !== "string") return <Archive className="text-gray-500 w-8 h-8" />;

        const name = deviceType.toLowerCase();

        if (name.includes("laptop") || name.includes("computer") || name.includes("pc")) {
            return <Images className="text-[#10B981] size-10" />;
        } else if (name.includes("phone") || name.includes("smartphone") || name.includes("tablet")) {
            return <Images className="text-[#10B981] size-10" />;
        } else if (name.includes("headset") || name.includes("earphone") || name.includes("headphone")) {
            return <Images className="text-[#10B981] size-20" />;
        } else {
            return <Archive className="text-[#10B981] size-10" />;
        }
    };

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">

            <Sidebar activePage="repairqueue" />

            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="flex justify-between">
                    <div className="mb-4">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Repair Queue Dashboard</h1>
                        <p className="text-gray-600 text-base max-w-3xl">
                            Track and manage all repair tickets in real-time. View status updates, technician assignments, and estimated completion times.
                        </p>
                    </div>
                    {role === "customer" && (
                        <div className=" w-64 shrink right-0 -mr-5">
                            <button onClick={() => setIsModalOpen(true)} className=" flex py-3 px-6 rounded-md font-medium transition-all w-50 md:w-auto text-gray-800 bg-[#33e407] hover:bg-[#2bc706]">
                                <Wrench  className="mr-2"/>  Start Repair
                            </button>
                            < WarrantyRequest isOpen={isModalOpen} onClose={() => setIsModalOpen(false) } readonly={false} />
                        </div>
                    )}
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
                                    <h1 className="text-xl font-semibold text-gray-800">Pending Repairs</h1>

                                    <div className="flex items-center gap-2">
                                        <select
                                            className=" text-sm text-gray-700 px-2 py-1 rounded-lg"
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
                                            className=" text-sm px-3 py-1 w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                            placeholder={`Search by ${filterByLabel}`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {warrantyRequests.length === 0 ? (
                                    <p className="text-center text-gray-600">
                                        No warranty return requests have been made yet.
                                    </p>

                                ) : (
                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                        {warrantyRequests
                                            .filter((request) => request.status === "Requested" || request.status === "Approved")
                                            .map((request) => (
                                                <div
                                                    key={request.id}
                                                    onClick={() => handleCardClick(request)}
                                                    className="cursor-pointer flex-row bg-[rgba(51,228,7,0.05)] border border-[#33e407] rounded-lg p-4 shadow-sm hover:shadow-md transition"
                                                >
                                                    <div className="mr-4 flex object-center">
                                                        <Images className="text-[#10B981] size-60" />;
                                                    </div>
                                                    <div className="my-2 h-px bg-[#33e407]"></div>

                                                    <div>
                                                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                                            {request.serialNumber}
                                                        </h2>
                                                        <p className="text-sm text-gray-600">
                                                            <strong>Customer:</strong> {request.deviceType}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            <strong>Date:</strong> {request.purchaseDate}
                                                        </p>
                                                        <p className={`text-sm font-medium mt-1 ${request.status === "Requested" ? "text-yellow-600" : "text-green-600"}`}>
                                                            Status: {request.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                <h1 className="text-xl font-semibold text-gray-800 mb-6 mt-6"> Resolved Repairs </h1>
                                {warrantyRequests.length === 0 ? (
                                    <p className="text-center text-gray-600">
                                        No warranty request has been resolved yet.
                                    </p>

                                ) : (
                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                        {warrantyRequests
                                            .filter((request) => request.status === "Claimed" || request.status === "Denied")
                                            .map((request) => (
                                                <div
                                                    key={request.id}
                                                    onClick={() => handleCardClick(request)}
                                                    className="cursor-pointer flex-row bg-[rgba(51,228,7,0.05)] border border-[#33e407] rounded-lg p-4 shadow-sm hover:shadow-md transition"
                                                >
                                                    <div className="mr-4 flex object-center">
                                                        <Images className="text-[#10B981] size-60" />;
                                                    </div>
                                                    <div className="my-2 h-px bg-[#33e407]"></div>

                                                    <div>
                                                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                                            {request.serialNumber}
                                                        </h2>
                                                        <p className="text-sm text-gray-600">
                                                            <strong>Device Type:</strong> {request.deviceType}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            <strong>Date:</strong> {request.purchaseDate}
                                                        </p>
                                                        <p className={`text-sm font-medium mt-1 ${request.status === "Denied" ? "text-yellow-600" : "text-green-600"}`}>
                                                            Status: {request.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <WarrantyRequest
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
    );
};

export default RepairQueue;

