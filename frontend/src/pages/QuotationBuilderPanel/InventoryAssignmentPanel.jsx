import React, { useState, useEffect } from "react";
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
    const [optionA, setOptionA] = useState(null);
    // optionB holds one or more alternative parts
    const [optionB, setOptionB] = useState([]);
    const [inventorySlotTarget, setInventorySlotTarget] = useState("A");
    // selectedParts is a flat array: preferred (optionA) followed by all alternatives (optionB)
    const selectedParts = [optionA, ...optionB].filter(Boolean);
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
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideParts, setOverrideParts] = useState([]);
    const [overrideSelection, setOverrideSelection] = useState(null);
    const [overrideNotes, setOverrideNotes] = useState("");
    const [overrideLoading, setOverrideLoading] = useState(false);

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
                const fullName = [decodedToken.firstName, decodedToken.lastName].filter(Boolean).join(" ").trim();
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
    const refreshQuotation = async () => {
        if (!ticketParam) return;
        try {
            const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketParam}`);
            if (data && data.length > 0) {
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

    useEffect(() => {
        refreshQuotation();
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
    const togglePartSelection = (item, slot = inventorySlotTarget) => {
        if (slot === "B") {
            // If item is already an alternative, remove it
            const existsInB = optionB.some((p) => p.id === item.id);
            if (existsInB) {
                setOptionB((prev) => prev.filter((p) => p.id !== item.id));
                return;
            }

            // Remove from optionA if it was selected there
            if (optionA?.id === item.id) {
                setOptionA(null);
            }

            // Add to alternatives
            setOptionB((prev) => [...prev, item]);
            return;
        }

        // Slot A behavior: single preferred part
        if (optionA?.id === item.id) {
            setOptionA(null);
        } else {
            // If this item exists among alternatives, remove it from optionB
            if (optionB.some((p) => p.id === item.id)) {
                setOptionB((prev) => prev.filter((p) => p.id !== item.id));
            }
            setOptionA(item);
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
                // preferred is optionA, alternatives are optionB; fall back to selectedParts ordering
                const preferredPart = optionA || selectedParts[0] || null;
                const alternativePart = optionB.length > 0 ? optionB[0] : (selectedParts[1] || null);

                if (editing && existingQuotation) {
                    // Update existing quotation
                    await api.patch(`/quotation/editQuotation/${ticketParam}`, {
                         partIds: partIds,
                         laborCost: parseFloat(laborCost) || 0,
                         totalCost: partsTotal + (parseFloat(laborCost) || 0),
                        recommendedPart: preferredPart?.id || null,
                        alternativePart: alternativePart?.id || null,
                         reminderDelayHours: reminderHours,
                         expiryAt: expiryDate.toISOString(),
                     });
                    setToast({ show: true, message: "Quotation updated", type: "success" });
                } else {
                    await api.post("/quotation/addQuotation", {
                         repairTicketNumber: repairInfo.ticketId.replace('#', ''),
                         partIds: partIds,
                         laborCost: parseFloat(laborCost) || 0,
                         expiryAt: expiryDate.toISOString(),
                         reminderDelayHours: reminderHours,
                         recommendedPart: preferredPart?.id || null,
                         alternativePart: alternativePart?.id || null,
                     });
                    setToast({ show: true, message: "Quotation sent to customer", type: "success" });
                }

                // Refresh quotation state
                setEditing(false);
                setOptionA(null);
                setOptionB([]);
                await refreshQuotation();
            } catch (err) {
                console.error("Failed to send/update quotation", err);
                setToast({ show: true, message: "Failed to process quotation", type: "error" });
            } finally {
                setProcessing(false);
            }
        };
        window.addEventListener("send-quotation", handler);
        return () => window.removeEventListener("send-quotation", handler);
    }, [optionA, optionB, laborCost, expiryDate, reminderHours, repairInfo.ticketId, editing, existingQuotation, partsTotal, ticketParam]);

    // Helper: delete quotation
    const handleDeleteQuotation = async () => {
         if (!existingQuotation) return;
         if (!window.confirm("Are you sure you want to delete this quotation?")) return;
         try {
             await api.delete(`/quotation/deleteQuotation/${existingQuotation.quotationId}`);
             alert("Quotation deleted");
             setExistingQuotation(null);
             setEditing(false);
             setOptionA(null);
             setOptionB([]);
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
        setOptionA(toSelect[0] || null);
        setOptionB(toSelect.slice(1) || []);
         setLaborCost(existingQuotation.laborCost || 0);
         setEditing(true);
     };

     const handleCancelEditing = async () => {
         setEditing(false);
         setOptionA(null);
         setOptionB([]);
         setLaborCost(0);
         try {
             await refreshQuotation();
         } catch (err) {
             console.error("Failed to refresh quotation", err);
         }
     };

    const openOverrideModal = async () => {
        if (!existingQuotation) return;
        setShowOverrideModal(true);
        setOverrideSelection(null);
        setOverrideLoading(true);
        try {
            const uniqueIds = Array.from(new Set(existingQuotation.partIds || []));
            if (uniqueIds.length === 0) {
                setOverrideParts([]);
            } else {
                const responses = await Promise.all(uniqueIds.map((id) => api.get(`/part/getPartById/${id}`)));
                setOverrideParts(responses.map((res) => res.data));
            }
        } catch (err) {
            console.error("Failed to load parts for override", err);
            setToast({ show: true, message: "Failed to load parts for override", type: "error" });
        } finally {
            setOverrideLoading(false);
        }
    };

    const handleOverrideSubmit = async () => {
        if (!existingQuotation || !overrideSelection) return;
        try {
            setOverrideLoading(true);
            await api.patch(`/quotation/overrideSelection/${existingQuotation.quotationId}`, null, {
                params: {
                    partId: overrideSelection.id,
                    notes: overrideNotes,
                },
            });
            setToast({ show: true, message: "Override recorded and quotation approved", type: "success" });
            setShowOverrideModal(false);
            setOverrideNotes("");
            await refreshQuotation();
        } catch (err) {
            console.error("Failed to override quotation", err);
            setToast({ show: true, message: "Failed to override quotation", type: "error" });
        } finally {
            setOverrideLoading(false);
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
                            onOverride={openOverrideModal}
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
                                                    togglePartSelection(item, inventorySlotTarget);
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
                                 openInventoryModal={(slot) => {
                                     setInventorySlotTarget(slot || "A");
                                     setShowInventoryModal(true);
                                 }}
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
                        </>
                    )}
                </div>
            </div>
            {showOverrideModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Override Customer Selection</h3>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowOverrideModal(false)}>
                                ×
                            </button>
                        </div>
                        {overrideLoading ? (
                            <div className="py-10 flex justify-center">
                                <Spinner size="large" />
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mb-3">
                                    Choose the part you will proceed with. This will immediately approve the quotation on behalf of the customer.
                                </p>
                                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                    {overrideParts.length === 0 && (
                                        <div className="text-sm text-gray-500">No parts found for this quotation.</div>
                                    )}
                                    {overrideParts.map((part) => {
                                        const label =
                                            part.id === existingQuotation?.recommendedPart
                                                ? "Option A – Recommended"
                                                : "Option B – Alternative";
                                        const isSelected = overrideSelection?.id === part.id;
                                        return (
                                            <button
                                                key={part.id}
                                                onClick={() => setOverrideSelection(part)}
                                                className={`w-full text-left border rounded-lg p-3 transition ${
                                                    isSelected ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-400"
                                                }`}
                                            >
                                                <div className="text-xs text-green-700 font-semibold mb-1">{label}</div>
                                                <div className="text-sm font-medium text-gray-800">{part.name}</div>
                                                <div className="text-xs text-gray-500">SKU: {part.partNumber}</div>
                                                <div className="text-xs text-gray-500">Price: ₱{(part.unitCost || 0).toFixed(2)}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    value={overrideNotes}
                                    onChange={(e) => setOverrideNotes(e.target.value)}
                                    placeholder="Document why you overrode the customer decision."
                                />
                                <div className="mt-5 flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2 rounded-md border text-gray-700"
                                        onClick={() => setShowOverrideModal(false)}
                                        disabled={overrideLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md bg-green-600 text-white flex items-center gap-2 disabled:opacity-60"
                                        onClick={handleOverrideSubmit}
                                        disabled={!overrideSelection || overrideLoading}
                                    >
                                        {overrideLoading && <Spinner size="small" />}
                                        Confirm Override
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};

export default InventoryAssignmentPanel;

