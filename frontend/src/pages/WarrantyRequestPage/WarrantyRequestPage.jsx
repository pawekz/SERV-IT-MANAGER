import { useState, useEffect } from "react";
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
    const [warrantyRequests, setWarrantyRequests] = useState([]);
    const [warranty, setWarranty] = useState([]);
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

            const data = JSON.parse(text);
            setWarranty(data);
            console.log("Warranties fetched successfully:", warranty);
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
                                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                            {warranty.filter(w => w.status !== "REPAIR_REPLACEMENT_COMPLETED").length === 0 ? (
                                                <p className="text-gray-400 col-span-full text-center">
                                                    No pending warranties found. <br/>Use the checker to verify serial number and start a warranty request.
                                                </p>
                                            ) : (
                                                warranty
                                                    .filter(w => w.status !== "REPAIR_REPLACEMENT_COMPLETED")
                                                    .map((request, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => handleCardClick(request)}
                                                            className="cursor-pointer flex bg-[rgba(51,228,7,0.05)] border border-[#33e407] rounded-lg p-4 shadow-sm hover:shadow-md transition min-w-[35vh]"
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
                                                                        request.status === "Requested" ? "text-yellow-600" : "text-green-600"
                                                                    }`}
                                                                >
                                                                    Status: {request.status}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </div>

                                        <div className="lg:w-[30%] w-full bg-white rounded-lg shadow-md p-6 h-fit">
                                            <CheckWarranty />
                                            <WarrantyRequest
                                                isOpen={isModalOpen}
                                                onClose={() => setIsModalOpen(false)}
                                                readonly={false}
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
                                    {warranty.filter(w => w.status === "REPAIR_REPLACEMENT_COMPLETED").length === 0 ? (
                                        <p className="text-center text-gray-400">
                                            No resolved warranties found. <br /> Use the checker to verify serial number and start a warranty request.
                                        </p>
                                    ) : (
                                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                            {warranty
                                                .filter((request) => request.status === "REPAIR_REPLACEMENT_COMPLETED" )
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
                                                                <strong>Device Type:</strong> {request.deviceType}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                <strong>Date:</strong> {request.purchaseDate}
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
                                    onClose={() => setModalOpen(false)}
                                    data={selectedRequest}
                                    readonly={true}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyRequestPage;

