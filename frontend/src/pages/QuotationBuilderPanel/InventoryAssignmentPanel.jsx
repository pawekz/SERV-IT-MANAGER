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
    // Both Option A and Option B now support multiple parts
    const [optionA, setOptionA] = useState([]);
    const [optionB, setOptionB] = useState([]);
    const [inventorySlotTarget, setInventorySlotTarget] = useState("A");
    // Track parts selected in the modal for the current slot
    const [modalSelectedParts, setModalSelectedParts] = useState([]);
    // Combined for display purposes
    const selectedParts = [...optionA, ...optionB];
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                        partPhotoUrl: p.partPhotoUrl || "",
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

    // Handle part selection in the modal (temporary selection before clicking Done)
    const toggleModalPartSelection = (item) => {
        setModalSelectedParts((prev) => {
            const exists = prev.some((p) => p.id === item.id);
            if (exists) {
                return prev.filter((p) => p.id !== item.id);
            } else {
                return [...prev, item];
            }
        });
    };

    // Handle part removal from Option A or B (after they're assigned)
    const removePartFromSlot = (item, slot) => {
        if (slot === "A") {
            setOptionA((prev) => prev.filter((p) => p.id !== item.id));
        } else if (slot === "B") {
            setOptionB((prev) => prev.filter((p) => p.id !== item.id));
        }
    };

    // Apply modal selections to the target slot when Done is clicked
    const applyModalSelections = () => {
        if (inventorySlotTarget === "A") {
            // Add modal selections to Option A, avoiding duplicates
            setOptionA((prev) => {
                const existingIds = new Set(prev.map(p => p.id));
                const newParts = modalSelectedParts.filter(p => !existingIds.has(p.id));
                return [...prev, ...newParts];
            });
        } else if (inventorySlotTarget === "B") {
            // Add modal selections to Option B, avoiding duplicates
            setOptionB((prev) => {
                const existingIds = new Set(prev.map(p => p.id));
                const newParts = modalSelectedParts.filter(p => !existingIds.has(p.id));
                return [...prev, ...newParts];
            });
        }
        // Clear modal selections and close modal
        setModalSelectedParts([]);
        setShowInventoryModal(false);
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
            if (optionA.length === 0 && optionB.length === 0) return;
            try {
                setProcessing(true);
                const token = localStorage.getItem("authToken");
                if (!token) throw new Error("Auth required");
                const partIds = selectedParts.map((p) => p.id);
                // Both options are now arrays
                const recommendedParts = optionA.map(p => p.id);
                const alternativeParts = optionB.map(p => p.id);

                if (editing && existingQuotation) {
                    // Update existing quotation
                    await api.patch(`/quotation/editQuotation/${ticketParam}`, {
                         partIds: partIds,
                         laborCost: parseFloat(laborCost) || 0,
                         totalCost: partsTotal + (parseFloat(laborCost) || 0),
                        recommendedPart: recommendedParts,
                        alternativePart: alternativeParts,
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
                         recommendedPart: recommendedParts,
                         alternativePart: alternativeParts,
                     });
                    setToast({ show: true, message: "Quotation sent to customer", type: "success" });
                }

                // Refresh quotation state
                setEditing(false);
                setOptionA([]);
                setOptionB([]);
                await refreshQuotation();
            } catch (err) {
                console.error("Failed to send/update quotation", err);
                const errorMsg = err?.response?.data?.message || err?.message || "Failed to process quotation";
                setToast({ show: true, message: errorMsg, type: "error" });
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
         setShowDeleteConfirm(true);
     };
     const confirmDeleteQuotation = async () => {
         if (!existingQuotation) return;
         try {
             await api.delete(`/quotation/deleteQuotation/${existingQuotation.quotationId}`);
             setToast({ show: true, message: "Quotation deleted successfully", type: "success" });
             setExistingQuotation(null);
             setEditing(false);
             setOptionA([]);
             setOptionB([]);
             setShowDeleteConfirm(false);
         } catch (err) {
             console.error("Failed to delete quotation", err);
             setToast({ show: true, message: "Failed to delete quotation. Please try again.", type: "error" });
         }
     };

    // Helper: edit quotation (prefill builder)
    const handleEditQuotation = () => {
         if (!existingQuotation) return;
         // Map partIds to inventory items (after inventory fetch)
        const toSelect = inventoryItems.filter((item) => existingQuotation.partIds.includes(item.id));
        // Handle recommendedPart as list
        const recommendedIds = Array.isArray(existingQuotation.recommendedPart) 
          ? existingQuotation.recommendedPart 
          : (existingQuotation.recommendedPart ? [existingQuotation.recommendedPart] : []);
        const recommendedItems = toSelect.filter(item => recommendedIds.includes(item.id));
        setOptionA(recommendedItems || []);
        // Handle alternativePart as list
        const alternativeIds = Array.isArray(existingQuotation.alternativePart) 
          ? existingQuotation.alternativePart 
          : (existingQuotation.alternativePart ? [existingQuotation.alternativePart] : []);
        const alternativeItems = toSelect.filter(item => alternativeIds.includes(item.id));
        setOptionB(alternativeItems || []);
         setLaborCost(existingQuotation.laborCost || 0);
         setEditing(true);
     };

     const handleCancelEditing = async () => {
         setEditing(false);
         setOptionA([]);
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
        if (!overrideNotes || overrideNotes.trim().length === 0) {
            setToast({ show: true, message: "Notes are required for technician override", type: "error" });
            return;
        }
        try {
            setOverrideLoading(true);
            await api.patch(`/quotation/overrideSelection/${existingQuotation.quotationId}`, null, {
                params: {
                    partId: overrideSelection.id,
                    notes: overrideNotes.trim(),
                },
            });
            setToast({ show: true, message: "Override recorded and quotation approved. Ticket status updated to REPAIRING.", type: "success" });
            setShowOverrideModal(false);
            setOverrideNotes("");
            await refreshQuotation();
        } catch (err) {
            console.error("Failed to override quotation", err);
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to override quotation";
            setToast({ show: true, message: errorMsg, type: "error" });
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
                                            <h2 className="text-lg font-semibold text-gray-800">
                                                Select Parts for Option {inventorySlotTarget === "A" ? "A – Recommended" : "B – Alternative"}
                                            </h2>
                                            <button
                                                onClick={() => {
                                                    setModalSelectedParts([]);
                                                    setShowInventoryModal(false);
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4">
                                            <AvailableInventory
                                                inventoryItems={(() => {
                                                    // Filter out parts that are already in the other option
                                                    if (inventorySlotTarget === "A") {
                                                        // When selecting for Option A, exclude parts already in Option B
                                                        const optionBIds = new Set(optionB.map(p => p.id));
                                                        return inventoryItems.filter(item => !optionBIds.has(item.id));
                                                    } else {
                                                        // When selecting for Option B, exclude parts already in Option A
                                                        const optionAIds = new Set(optionA.map(p => p.id));
                                                        return inventoryItems.filter(item => !optionAIds.has(item.id));
                                                    }
                                                })()}
                                                selectedParts={modalSelectedParts}
                                                togglePartSelection={toggleModalPartSelection}
                                                getStatusColor={getStatusColor}
                                             />
                                        </div>
                                        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                                            <div className="text-sm text-gray-600">
                                                {modalSelectedParts.length} part{modalSelectedParts.length !== 1 ? 's' : ''} selected
                                            </div>
                                            <button
                                                onClick={applyModalSelections}
                                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <SelectedPartsCard
                                optionA={optionA}
                                optionB={optionB}
                                removePartFromSlot={removePartFromSlot}
                                 openInventoryModal={(slot) => {
                                     setInventorySlotTarget(slot || "A");
                                     // Initialize modal with parts already in the target slot
                                     if (slot === "A") {
                                         setModalSelectedParts([...optionA]);
                                     } else {
                                         setModalSelectedParts([...optionB]);
                                     }
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
                                        const isRecommended = existingQuotation?.recommendedPart?.includes?.(part.id) || 
                                                              (Array.isArray(existingQuotation?.recommendedPart) && existingQuotation.recommendedPart.includes(part.id)) ||
                                                              (typeof existingQuotation?.recommendedPart === 'number' && existingQuotation.recommendedPart === part.id);
                                        const label = isRecommended
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-red-600">*</span></label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    value={overrideNotes}
                                    onChange={(e) => setOverrideNotes(e.target.value)}
                                    placeholder="Document why you overrode the customer decision (required)."
                                    required
                                />
                                <div className="mt-5 flex justify-end gap-3">
                                    <button
                                        className="px-4 py-2 rounded-md border text-gray-700"
                                        onClick={() => {
                                            setShowOverrideModal(false);
                                            setOverrideNotes("");
                                        }}
                                        disabled={overrideLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-md bg-green-600 text-white flex items-center gap-2 disabled:opacity-60"
                                        onClick={handleOverrideSubmit}
                                        disabled={!overrideSelection || !overrideNotes?.trim() || overrideLoading}
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
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete this quotation? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 rounded-md border text-gray-700"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded-md bg-red-600 text-white"
                                onClick={confirmDeleteQuotation}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};

export default InventoryAssignmentPanel;

