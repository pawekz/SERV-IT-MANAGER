import React, { useState, useEffect } from "react";
import { Search, ChevronDown,  Package, ChevronLeft, ChevronRight, X, } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";

const Inventory = () => {
    const [selectedParts, setSelectedParts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to decode JWT token - needed for sidebar functionality
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                // Check if token exists
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error("Not authenticated. Please log in.");
                }

                // Validate token by trying to parse it
                const decodedToken = parseJwt(token);
                if (!decodedToken) {
                    throw new Error("Invalid token. Please log in again.");
                }

                setLoading(false);
            } catch (err) {
                console.error("Authentication error:", err);
                setError("Authentication failed. Please log in again.");
                setLoading(false);
            }
        };

        checkAuthentication();
    }, []);

    // Sample data
    const repairInfo = {
        ticketId: "#RT-2305",
        device: "iPhone 13 Pro",
        repairType: "Screen Replacement",
        status: "IN PROGRESS",
        technician: "John Gabriel Cañal"
    };

    const customerInfo = {
        name: "Kyle Paulo",
        email: "Kyle@gmail.com",
        phone: "+63 905 123 4567",
        createdOn: "Mar 24, 2025"
    };

    const inventoryItems = [
        {
            id: 1,
            name: "HDMI CABLE",
            sku: "IP13P-DISP-OEM",
            category: "Display",
            availability: { status: "IN STOCK", count: 15 },
            location: "Shelf A1",
            quantity: 1
        },
        {
            id: 2,
            name: "HP LAPTOP",
            sku: "IP13P-DISP-AFT-P",
            category: "Display",
            availability: { status: "IN STOCK", count: 8 },
            location: "Shelf A2",
            quantity: 1
        },
        {
            id: 3,
            name: "PRINTER",
            sku: "IP13P-DISP-AFT-S",
            category: "Display",
            availability: { status: "LOW STOCK", count: 3 },
            location: "Shelf B1",
            quantity: 1
        },
        {
            id: 4,
            name: "HP PRINTER",
            sku: "IP13P-BAT-OEM",
            category: "Battery",
            availability: { status: "IN STOCK", count: 12 },
            location: "Shelf B2",
            quantity: 1
        },
        {
            id: 5,
            name: "WIRE",
            sku: "IP13P-BAT-AFT-P",
            category: "Battery",
            availability: { status: "IN STOCK", count: 7 },
            location: "Shelf B3",
            quantity: 1
        },
        {
            id: 6,
            name: "LENOVO BATTERY",
            sku: "IP13P-BAT-AFT-S",
            category: "Battery",
            availability: { status: "OUT OF STOCK", count: 0 },
            location: "Shelf C1",
            quantity: 0
        },
        {
            id: 7,
            name: "ASUS LAPTOP",
            sku: "IP13P-CAM-REAR",
            category: "Camera",
            availability: { status: "IN STOCK", count: 5 },
            location: "Shelf C2",
            quantity: 1
        },
        {
            id: 8,
            name: "HDMI CABLE",
            sku: "IP13P-CAM-FRONT",
            category: "Camera",
            availability: { status: "LOW STOCK", count: 2 },
            location: "Shelf D1",
            quantity: 1
        },
        {
            id: 9,
            name: "Razerblade Laptop",
            sku: "IP13P-CHARGE-PORT",
            category: "Laptop",
            availability: { status: "IN STOCK", count: 9 },
            location: "Shelf D2",
            quantity: 1
        },
        {
            id: 10,
            name: "HP 13 Pro Wireless Charging Coil",
            sku: "IP13P-CHARGE-COIL",
            category: "Charging",
            availability: { status: "LOW STOCK", count: 4 },
            location: "Shelf E1",
            quantity: 1
        }
    ];

    // Filter items based on search query
    const filteredItems = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle part selection
    const togglePartSelection = (item) => {
        if (selectedParts.some(part => part.id === item.id)) {
            setSelectedParts(selectedParts.filter(part => part.id !== item.id));
        } else {
            setSelectedParts([...selectedParts, item]);
        }
    };

    // Calculate total items
    const totalItems = selectedParts.length;

    // Status badge color mapping
    const getStatusColor = (status) => {
        switch (status.toUpperCase()) {
            case "IN STOCK":
                return "bg-green-100 text-green-600";
            case "LOW STOCK":
                return "bg-yellow-100 text-yellow-600";
            case "OUT OF STOCK":
                return "bg-red-100 text-red-600";
            case "IN PROGRESS":
                return "bg-blue-100 text-blue-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            {/* Sidebar - now uncommented */}
            <Sidebar />

            {/* Main Content - adjusted to match AccountInformation structure */}
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="px-10 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
                        <p className="text-gray-600">Manage parts inventory and link items directly to repair jobs.</p>
                    </div>

                    {/* Repair Ticket Card */}
                    {/*<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">*/}
                    {/*    <div className="p-5">*/}
                    {/*        <div className="flex items-start gap-4">*/}
                    {/*            <div className="p-3 bg-blue-50 rounded-lg">*/}
                    {/*                <Cube size={24} className="text-blue-500" />*/}
                    {/*            </div>*/}
                    {/*            <div>*/}
                    {/*                <h2 className="text-lg font-semibold text-gray-800">Assign Parts to Repair Ticket {repairInfo.ticketId}</h2>*/}
                    {/*                <p className="text-gray-600 text-sm">Select parts from inventory to assign to this repair ticket.</p>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}

                    {/*    /!* Repair and Customer Info *!/*/}
                    {/*    <div className="grid md:grid-cols-2 gap-6 p-5 border-t border-gray-100">*/}
                    {/*        /!* Repair Information *!/*/}
                    {/*        <div>*/}
                    {/*            <div className="flex items-center mb-4">*/}
                    {/*                <Wrench size={18} className="text-gray-500 mr-2" />*/}
                    {/*                <h3 className="font-medium text-gray-700">Repair Information</h3>*/}
                    {/*            </div>*/}
                    {/*            <div className="grid grid-cols-2 gap-y-3 text-sm">*/}
                    {/*                <div className="text-gray-500">Ticket ID:</div>*/}
                    {/*                <div className="font-medium">{repairInfo.ticketId}</div>*/}

                    {/*                <div className="text-gray-500">Device:</div>*/}
                    {/*                <div className="font-medium">{repairInfo.device}</div>*/}

                    {/*                <div className="text-gray-500">Repair Type:</div>*/}
                    {/*                <div className="font-medium">{repairInfo.repairType}</div>*/}

                    {/*                <div className="text-gray-500">Status:</div>*/}
                    {/*                <div>*/}
                    {/*<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(repairInfo.status)}`}>*/}
                    {/*  {repairInfo.status}*/}
                    {/*</span>*/}
                    {/*                </div>*/}

                    {/*                <div className="text-gray-500">Technician:</div>*/}
                    {/*                <div className="font-medium">{repairInfo.technician}</div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}

                    {/*        /!* Customer Information *!/*/}
                    {/*        <div>*/}
                    {/*            <div className="flex items-center mb-4">*/}
                    {/*                <User size={18} className="text-gray-500 mr-2" />*/}
                    {/*                <h3 className="font-medium text-gray-700">Customer Information</h3>*/}
                    {/*            </div>*/}
                    {/*            <div className="grid grid-cols-2 gap-y-3 text-sm">*/}
                    {/*                <div className="text-gray-500">Name:</div>*/}
                    {/*                <div className="font-medium">{customerInfo.name}</div>*/}

                    {/*                <div className="text-gray-500">Email:</div>*/}
                    {/*                <div className="font-medium">{customerInfo.email}</div>*/}

                    {/*                <div className="text-gray-500">Phone:</div>*/}
                    {/*                <div className="font-medium">{customerInfo.phone}</div>*/}

                    {/*                <div className="text-gray-500">Created On:</div>*/}
                    {/*                <div className="font-medium">{customerInfo.createdOn}</div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {/* Available Inventory */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Package size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-800">Parts Inventory</h2>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder=""
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <select className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                            <option>All Categories</option>
                                            <option>Display</option>
                                            <option>Battery</option>
                                            <option>Camera</option>
                                            <option>Charging</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <ChevronDown size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <select className="appearance-none bg-white border border-gray-300 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                            <option>All Availability</option>
                                            <option>In Stock</option>
                                            <option>Low Stock</option>
                                            <option>Out of Stock</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <ChevronDown size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="w-10 px-5 py-3">
                                        <input type="checkbox" className="rounded border-gray-300 text-green-500 focus:ring-green-500" />
                                    </th>
                                    {/*<th className="w-16 px-5 py-3">Image</th>*/}
                                    <th className="px-5 py-3">Part ID</th>
                                    <th className="px-5 py-3">Description</th>
                                    <th className="px-5 py-3">Availability</th>
                                    <th className="px-5 py-3">Location</th>
                                    <th className="px-5 py-3">Quantity</th>
                                    <th className="px-5 py-3">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                {paginatedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                                                checked={selectedParts.some(part => part.id === item.id)}
                                                onChange={() => togglePartSelection(item)}
                                            />
                                        </td>
                                        {/*<td className="px-5 py-4">*/}
                                        {/*    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">*/}
                                        {/*        {item.image.includes("display") && <div className="w-6 h-6 border border-gray-300 rounded-sm"></div>}*/}
                                        {/*        {item.image.includes("battery") && <div className="w-6 h-4 border border-gray-300 rounded-sm"></div>}*/}
                                        {/*        {item.image.includes("camera") && <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}*/}
                                        {/*        {item.image.includes("charging") && <div className="w-6 h-3 border border-gray-300 rounded-sm"></div>}*/}
                                        {/*    </div>*/}
                                        {/*</td>*/}
                                        <td className="px-5 py-4">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-700">{item.category}</span>
                                        </td>
                                        <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.availability.status)}`}>
                          {item.availability.status} {item.availability.count > 0 && `(${item.availability.count})`}
                        </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-medium text-gray-900">{item.location}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-700">{item.quantity}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                className={`px-3 py-1 text-xs font-medium rounded-md ${
                                                    selectedParts.some(part => part.id === item.id)
                                                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                        : "bg-green-100 text-green-600 hover:bg-green-200"
                                                }`}
                                                onClick={() => togglePartSelection(item)}
                                                disabled={item.availability.status === "OUT OF STOCK"}
                                            >
                                                {selectedParts.some(part => part.id === item.id) ? "Remove" : "Add"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-md text-sm font-medium ${
                                            currentPage === page
                                                ? "bg-green-500 text-white"
                                                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Selected Parts */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package size={20} className="text-gray-500" />
                                    <h2 className="text-lg font-semibold text-gray-800">Selected Parts</h2>
                                </div>
                                <div className="text-sm text-gray-500">{selectedParts.length} items</div>
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="font-medium text-gray-700 mb-3">Parts to Assign</h3>

                            {selectedParts.length > 0 ? (
                                <div className="space-y-3 mb-5">
                                    {selectedParts.map(part => (
                                        <div key={part.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                                    {part.image?.includes("display") && <div className="w-4 h-4 border border-gray-300 rounded-sm"></div>}
                                                    {part.image?.includes("battery") && <div className="w-4 h-3 border border-gray-300 rounded-sm"></div>}
                                                    {part.image?.includes("camera") && <div className="w-3 h-3 border-2 border-gray-300 rounded-full"></div>}
                                                    {part.image?.includes("charging") && <div className="w-4 h-2 border border-gray-300 rounded-sm"></div>}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{part.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {part.sku}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm font-medium text-gray-900">{part.location}</div>
                                                <button
                                                    onClick={() => togglePartSelection(part)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                                    No parts selected. Add parts from the inventory above.
                                </div>
                            )}

                            <div className="flex justify-between items-center py-3 border-t border-gray-200">
                                <div className="font-medium text-gray-700">Total Items</div>
                                <div className="text-lg font-bold text-gray-900">{totalItems}</div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="p-5 border-t border-gray-100">
                            <h3 className="font-medium text-gray-700 mb-3">Notes</h3>
                            <textarea
                                className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={3}
                                placeholder="Add any notes about this parts assignment..."
                            ></textarea>
                        </div>

                        {/* Footer */}
                        <div className="p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Assigning parts to a repair ticket will reserve them in inventory and make them unavailable for other repairs.
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium flex items-center gap-2">
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-md text-white font-medium flex items-center gap-2 ${
                                        selectedParts.length > 0
                                            ? "bg-green-500 hover:bg-green-600"
                                            : "bg-gray-400 cursor-not-allowed"
                                    }`}
                                    disabled={selectedParts.length === 0}
                                >
                                    <Package size={16} />
                                    Assign Parts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
