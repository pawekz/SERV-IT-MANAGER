import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Wrench, User, Package, ChevronLeft, ChevronRight, X,  CuboidIcon as Cube } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import RepairTicketCard from "./RepairTicketCard";
import AvailableInventory from "./AvailableInventory";
import SelectedPartsCard from "./SelectedPartsCard";
import api from "../../services/api.jsx";
import { useLocation } from "react-router-dom";

const InventoryAssignmentPanel = () => {
    const [selectedParts, setSelectedParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const ticketParam = searchParams.get("ticketNumber");

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
        ticketId: ticketParam || "#RT-2305",
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

    // helper to compute availability
    const computeAvailability = (available, lowThreshold=5) => {
        if (available <= 0) return { status: "OUT OF STOCK", count: 0 };
        if (available < lowThreshold) return { status: "LOW STOCK", count: available };
        return { status: "IN STOCK", count: available };
    };

    // fetch parts and transform
    useEffect(() => {
        const fetchParts = async () => {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) return;
                const { data } = await api.get("/part/getAllParts");

                // group by partNumber
                const map = new Map();
                data.forEach(p => {
                    if (!map.has(p.partNumber)) {
                        map.set(p.partNumber, []);
                    }
                    map.get(p.partNumber).push(p);
                });

                const transformed = Array.from(map.values()).map(group => {
                    const first = group[0];
                    const totalStock = group.reduce((sum, g) => sum + (g.currentStock||0), 0);
                    const reserved = group.reduce((sum, g) => sum + (g.reservedQuantity||0), 0);
                    const available = totalStock - reserved;
                    const availability = computeAvailability(available, first.lowStockThreshold || 5);
                    return {
                        id: first.id,
                        name: first.name,
                        sku: first.partNumber,
                        image: "", // placeholder
                        availability,
                        price: first.unitCost || 0,
                        quantity: 1, // default
                    };
                });

                setInventoryItems(transformed);
            } catch (err) {
                console.error("Failed to load parts", err);
            }
        };
        fetchParts();
    }, []);

    // Handle part selection
    const togglePartSelection = (item) => {
        if (selectedParts.some(part => part.id === item.id)) {
            setSelectedParts(selectedParts.filter(part => part.id !== item.id));
        } else {
            setSelectedParts([...selectedParts, item]);
        }
    };

    // Calculate total price
    const totalPrice = selectedParts.reduce((sum, part) => sum + part.price, 0);

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

    // Send quotation when event dispatched from child
    useEffect(() => {
        const handler = async () => {
            if (selectedParts.length === 0) return;
            try {
                const token = localStorage.getItem("authToken");
                if (!token) throw new Error("Auth required");
                const partIds = selectedParts.map(p => p.id);
                await api.post("/quotation/addQuotation", {
                    repairTicketNumber: repairInfo.ticketId.replace('#',''),
                    partIds: partIds,
                    laborCost: 0,
                    totalCost: totalPrice,
                });
                alert("Quotation sent to customer");
            } catch (err) {
                console.error("Failed to send quotation", err);
                alert("Failed to send quotation");
            }
        };
        window.addEventListener('send-quotation', handler);
        return () => window.removeEventListener('send-quotation', handler);
    }, [selectedParts, repairInfo.ticketId, totalPrice]);

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            {/* Sidebar - now uncommented */}
            <Sidebar />

            {/* Main Content - adjusted to match AccountInformation structure */}
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="px-10 py-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Quotation Builder</h1>
                        <p className="text-gray-600">Browse inventory and assign parts to repair tickets.</p>
                    </div>

                    <RepairTicketCard ticketNumber={ticketParam || repairInfo.ticketId.replace('#','')} getStatusColor={getStatusColor} />

                    {/* Inventory Modal */}
                    {showInventoryModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
                            <div className="bg-white rounded-lg shadow-xl max-h-[90vh] w-full max-w-4xl overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">Select Parts from Inventory</h2>
                                    <button
                                        onClick={() => setShowInventoryModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <AvailableInventory
                                        inventoryItems={inventoryItems}
                                        selectedParts={selectedParts}
                                        togglePartSelection={(item) => {
                                            togglePartSelection(item);
                                            // Close modal after selecting if preferred part still empty or want to just close? We'll close if preferred not selected
                                        }}
                                        getStatusColor={getStatusColor}
                                    />
                                </div>
                                <div className="p-4 border-t border-gray-200 flex justify-end">
                                    <button
                                        onClick={() => setShowInventoryModal(false)}
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <SelectedPartsCard
                        selectedParts={selectedParts}
                        togglePartSelection={togglePartSelection}
                        openInventoryModal={() => setShowInventoryModal(true)}
                    />
                </div>
            </div>
        </div>
    );
};

export default InventoryAssignmentPanel;

