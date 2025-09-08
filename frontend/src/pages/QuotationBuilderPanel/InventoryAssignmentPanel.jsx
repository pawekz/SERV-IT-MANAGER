import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Wrench, User, Package, ChevronLeft, ChevronRight, X,  CuboidIcon as Cube } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import RepairTicketCard from "./RepairTicketCard";
import AvailableInventory from "./AvailableInventory";
import SelectedPartsCard from "./SelectedPartsCard";
import ExistingQuotationCard from "./ExistingQuotationCard";
import api from '../../config/ApiConfig';
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import Toast from "../../components/Toast/Toast.jsx";
import Spinner from "../../components/Spinner/Spinner.jsx";

const InventoryAssignmentPanel = () => {
    const [selectedParts, setSelectedParts] = useState([]);
    const [existingQuotation, setExistingQuotation] = useState(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const location = useLocation();
    const { ticketNumber: routeTicketNumber } = useParams();
    const searchParams = new URLSearchParams(location.search);
    const ticketParam = routeTicketNumber || searchParams.get("ticketNumber");
    const [laborCost, setLaborCost] = useState(0);
    const [expiryDate, setExpiryDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7); // default 7 days
        return d;
    });
    const [reminderHours, setReminderHours] = useState(24);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

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

    // Fetch existing quotation for this ticket (if any)
    useEffect(() => {
        if (!ticketParam) return;
        const fetchQuotation = async () => {
            try {
                const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketParam}`);
                if (data && data.length > 0) {
                    // sort latest first
                    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setExistingQuotation(data[0]);
                } else {
                    setExistingQuotation(null);
                }
            } catch (err) {
                console.error("Failed to fetch existing quotation", err);
                setExistingQuotation(null);
            }
        };
        fetchQuotation();
    }, [ticketParam]);

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
                const { data } = await api.get("/part/getAllPartsForQuotation");

                const transformed = data.map(p => {
                    const totalStock = p.currentStock || 1; // individual item represents 1
                    const reserved = p.reservedQuantity || 0;
                    const available = totalStock - reserved;
                    const availability = computeAvailability(available, p.lowStockThreshold || 5);
                    return {
                        id: p.id,
                        name: p.name,
                        sku: p.partNumber,
                        serial: p.serialNumber,
                        image: "", // placeholder
                        availability,
                        price: p.unitCost || 0,
                        quantity: 1,
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

    // partsTotal optional if you want to display summary in the future
    const partsTotal = selectedParts.reduce((sum, part) => sum + part.price, 0);

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

    // Send or update quotation when event dispatched from child
    useEffect(() => {
        const handler = async () => {
            if (selectedParts.length === 0) return;
            try {
                setProcessing(true);
                const token = localStorage.getItem("authToken");
                if (!token) throw new Error("Auth required");
                const partIds = selectedParts.map((p) => p.id);

                if (editing && existingQuotation) {
                    // Update existing quotation
                    await api.patch(`/quotation/editQuotation/${ticketParam}`, {
                        partIds: partIds,
                        laborCost: parseFloat(laborCost) || 0,
                        totalCost: partsTotal + (parseFloat(laborCost) || 0),
                    });
                    setToast({ show: true, message: "Quotation updated", type: "success" });
                } else {
                    await api.post("/quotation/addQuotation", {
                        repairTicketNumber: repairInfo.ticketId.replace('#', ''),
                        partIds: partIds,
                        laborCost: parseFloat(laborCost) || 0,
                        expiryAt: expiryDate.toISOString(),
                        reminderDelayHours: reminderHours,
                    });
                    setToast({ show: true, message: "Quotation sent to customer", type: "success" });
                }

                // Refresh quotation state
                setEditing(false);
                setSelectedParts([]);
                const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketParam}`);
                if (data && data.length > 0) {
                    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setExistingQuotation(data[0]);
                }
            } catch (err) {
                console.error("Failed to send/update quotation", err);
                setToast({ show: true, message: "Failed to process quotation", type: "error" });
            } finally {
                setProcessing(false);
            }
        };
        window.addEventListener("send-quotation", handler);
        return () => window.removeEventListener("send-quotation", handler);
    }, [selectedParts, laborCost, expiryDate, reminderHours, repairInfo.ticketId, editing, existingQuotation, partsTotal, ticketParam]);

    // Helper: delete quotation
    const handleDeleteQuotation = async () => {
        if (!existingQuotation) return;
        if (!window.confirm("Are you sure you want to delete this quotation?")) return;
        try {
            await api.delete(`/quotation/deleteQuotation/${existingQuotation.quotationId}`);
            alert("Quotation deleted");
            setExistingQuotation(null);
            setEditing(false);
            setSelectedParts([]);
        } catch (err) {
            console.error("Failed to delete quotation", err);
            alert("Failed to delete quotation");
        }
    };

    // Helper: edit quotation (prefill builder)
    const handleEditQuotation = () => {
        if (!existingQuotation) return;
        // Map partIds to inventory items (after inventory fetch)
        const toSelect = inventoryItems.filter((item) => existingQuotation.partIds.includes(item.id));
        setSelectedParts(toSelect);
        setLaborCost(existingQuotation.laborCost || 0);
        setEditing(true);
    };

    const handleCancelEditing = async () => {
        setEditing(false);
        setSelectedParts([]);
        setLaborCost(0);
        try {
            const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketParam}`);
            if (data && data.length > 0) {
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setExistingQuotation(data[0]);
            }
        } catch (err) {
            console.error("Failed to refresh quotation", err);
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
                        <h1 className="text-2xl font-bold text-gray-800">Quotation Builder</h1>
                        <p className="text-gray-600">Browse inventory and assign parts to repair tickets.</p>
                    </div>

                    <RepairTicketCard ticketNumber={ticketParam || repairInfo.ticketId.replace('#','')} getStatusColor={getStatusColor} />

                    {/* Existing Quotation Card */}
                    {existingQuotation && !editing ? (
                        <ExistingQuotationCard
                            quotation={existingQuotation}
                            onEdit={handleEditQuotation}
                            onDelete={handleDeleteQuotation}
                        />
                    ) : (
                        <>
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
                                laborCost={laborCost}
                                setLaborCost={setLaborCost}
                                expiryDate={expiryDate}
                                setExpiryDate={setExpiryDate}
                                reminderHours={reminderHours}
                                setReminderHours={setReminderHours}
                                editing={editing}
                                onCancelEditing={handleCancelEditing}
                                processing={processing}
                            />
                            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryAssignmentPanel;

