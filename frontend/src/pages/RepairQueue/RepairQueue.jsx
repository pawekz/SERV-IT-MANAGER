import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {Wrench, Images, Archive, Search, Bell, Plus, ChevronUp} from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import WarrantyRequest from "../../components/WarrantyRequest/WarrantyRequest.jsx";
import { parseJwt } from "../../config/ApiConfig.jsx";

const RepairQueue = () => {
    const navigate = useNavigate()
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

    // Determine user role from JWT token (stored in localStorage as 'authToken')
    const token = localStorage.getItem('authToken');
    const decoded = parseJwt(token);
    const role = decoded?.role?.toLowerCase();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [warrantyRequests, setWarrantyRequests] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        setWarrantyRequests(prevRequests =>
            prevRequests.map(request =>
                request.id === requestId ? { ...request, status: newStatus } : request
            )
        );

        setStatusDropdownOpen(null); // Close the dropdown

        // Here you would normally update the database
        console.log(`Status for request ${requestId} changed to ${newStatus}`);
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
                        color: "blue",
                        deviceName: "RAZER BLADE 15",

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
                        color: "black",
                        deviceName: "ASUS ROG",

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
                        color: "pink",
                        deviceName: "MACBOOK AIR",

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
                        color: "red",
                        deviceName: "Dell XPS 13",

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

            <header className="bg-white shadow-sm p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Good Day, {userData.firstName}</h2>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D482] focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        </div>
                        <button className="p-2 rounded-full hover:bg-gray-100">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>


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
                                    <h1 className="text-xl font-semibold text-gray-800">Pending Repairs</h1>

                                    <div className="flex items-center gap-2">

                                    </div>
                                    {role !== "customer" && (
                                        <Link to="/newrepair">
                                            <button className="flex items-center bg-[#25D482] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-opacity-90 min-w-[44px] min-h-[44px] whitespace-nowrap">
                                                <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                                                <span className="text-sm sm:text-base">Add Ticket</span>
                                            </button>
                                        </Link>
                                    )}
                                </div>
                                {warrantyRequests.length === 0 ? (
                                    <p className="text-center text-gray-600">
                                        No warranty return requests have been made yet.
                                    </p>

                                ) : (

                                    // Pending Repairs

                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                        {warrantyRequests
                                            .filter((request) => request.status === "Requested" || request.status === "Approved" ||
                                                statusOptions.includes(request.status))
                                            .map((request) => (
                                                <div
                                                    key={request.id}
                                                    onClick={() => handleCardClick(request)}
                                                    className="cursor-pointer flex-row bg-[rgba(51,228,7,0.05)] border border-[#25D482] rounded-lg p-4 shadow-sm hover:shadow-md transition"
                                                >
                                                    <div className="mr-4 flex object-center">

                                                        <img src="https://i.ebayimg.com/images/g/JB4AAOSwjAJjbrnk/s-l1200.jpg" alt="Image description" className="w-15 h-15" />

                                                        {/*<Images className="text-[#10B981] size-60" />*/}



                                                        <p className="text-[12px]">Ticket Number</p>
                                                    </div>
                                                    <div className="my-2 h-px bg-[#25D482]">
                                                    </div>

                                                    <div>
                                                        <h2 className="text-[16px] font-semibold text-gray-800 mb-1">
                                                            {request.deviceName}

                                                        </h2>
                                                        <p className="text-[14px] text-gray-600">
                                                            {/*<strong>Customer:</strong> {request.deviceType}*/}
                                                            {request.issueDescription}
                                                        </p>
                                                        <div className="mt-[5px]"></div>
                                                        <p className="text-sm text-gray-600">
                                                            {request.serialNumber}

                                                        </p>
                                                        <div className="relative">
                                                            <p
                                                                onClick={(e) => handleStatusClick(e, request.id)}
                                                                className={`text-sm font-medium mt-1 text-right ${getStatusColor(request.status)} cursor-pointer hover:underline flex items-center justify-end`}
                                                            >
                                                                <ChevronUp className="ml-1 w-4 h-4" /> Status: {request.status}
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

                                <h1 className="text-xl font-semibold text-gray-800 mb-6 mt-6"> Resolved Repairs </h1>
                                {warrantyRequests.length === 0 ? (
                                    <p className="text-center text-gray-600">
                                        No warranty request has been resolved yet.
                                    </p>

                                    // Resolved Repairs
                                ) : (
                                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                                        {warrantyRequests
                                            .filter((request) => request.status === "Claimed" || request.status === "Denied")
                                            .map((request) => (
                                                <div
                                                    key={request.id}
                                                    onClick={() => handleCardClick(request)}
                                                    className="cursor-pointer flex-row bg-[rgba(51,228,7,0.05)] border border-[#25D482] rounded-lg p-4 shadow-sm hover:shadow-md transition"
                                                >
                                                    <div className="mr-4 flex object-center">
                                                        <img src="https://i.ebayimg.com/images/g/JB4AAOSwjAJjbrnk/s-l1200.jpg" alt="Image description" className="w-15 h-15" />
                                                        <p className="text-[12px]">Ticket Number</p>

                                                    </div>
                                                    <div className="my-2 h-px bg-[#25D482]"></div>

                                                    <div>
                                                        <h2 className="text-lg font-semibold text-gray-800 mb-1">
                                                            {request.deviceName}
                                                        </h2>
                                                        <p className="text-sm text-gray-600">
                                                            {request.issueDescription}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {request.serialNumber}
                                                        </p>
                                                        <div className="relative">
                                                            <p
                                                                onClick={(e) => handleStatusClick(e, request.id)}
                                                                className={`text-sm font-medium mt-1 text-right ${getStatusColor(request.status)} cursor-pointer hover:underline flex items-center justify-end`}
                                                            >
                                                                <ChevronUp className="ml-1 w-4 h-4" />   Status: {request.status}
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
                                {/*<WarrantyRequest*/}
                                {/*    isOpen={modalOpen}*/}
                                {/*    onClose={() => setModalOpen(false)}*/}
                                {/*    data={selectedRequest}*/}
                                {/*    readonly={true}*/}
                                {/*/>*/}
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

