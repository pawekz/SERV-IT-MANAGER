import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Package, ChevronLeft, ChevronRight, X, Pen, Trash, Plus, CheckCircle, AlertTriangle, TrendingDown, Eye, Settings, RefreshCw, Copy, Calendar as CalendarIcon } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api, { parseJwt } from '../../config/ApiConfig';
import InventoryTable from './InventoryTable';
import Toast from '../../components/Toast/Toast.jsx';

// Import modal components
import DescriptionModal from "./DescriptionModal/DescriptionModal.jsx";
import DeleteConfirmModal from "./DeleteConfirmModal/DeleteConfirmModal.jsx";
import LowStockModal from "./LowStockModal/LowStockModal.jsx";
import StockSettingsModal from "./StockSettingsModal/StockSettingsModal.jsx";
import AddPartModal from "./AddPartModal/AddPartModal.jsx";
import EditPartModal from "./EditPartModal/EditPartModal.jsx";
import BulkAddModal from "./BulkAddModal/BulkAddModal.jsx";

const Inventory = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    // Removed `error` state in favor of centralized `toast` notifications

    const [showAddModal, setShowAddModal] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [addPartLoading, setAddPartLoading] = useState(false);
    const [addPartSuccess, setAddPartSuccess] = useState(false);
    const [addPartError, setAddPartError] = useState(null);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState({ title: "", content: "", part: null });
    // New toast state compatible with Toast component (single source of truth)
    const [toast, setToast] = useState({ show: false, message: '', type: 'success', duration: 3000 });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [partToDelete, setPartToDelete] = useState(null);
    const [userRole, setUserRole] = useState(null);
    
    // New state for part number stock tracking
    const [lowStockPartNumbers, setLowStockPartNumbers] = useState([]);
    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const [stockSummary, setStockSummary] = useState({
        totalPartNumbers: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        activeAlertsCount: 0
    });
    const [showStockSettingsModal, setShowStockSettingsModal] = useState(false);
    const [selectedPartNumberForSettings, setSelectedPartNumberForSettings] = useState(null);

    // Enhanced bulk add state for multiple serial numbers
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [bulkAddItems, setBulkAddItems] = useState([{
        partNumber: "",
        name: "",
        description: "",
        unitCost: 0,
        currentStock: 1,
        lowStockThreshold: 10,
        serialNumber: "",
        addToExisting: false
    }]);
    const [bulkAddLoading, setBulkAddLoading] = useState(false);

    const [isMasterRow, setIsMasterRow] = useState(true); // First row is master

    // Edit functionality state variables
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPart, setEditPart] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);
    const [editError, setEditError] = useState(null);

    // Accordion state for expanding part number groups
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    // New part form state
    const [newPart, setNewPart] = useState({
        partNumber: "",
        name: "",
        description: "",
        unitCost: 0,
        currentStock: 0,
        lowStockThreshold: 10,
        serialNumber: "",
        dateAdded: null, // Will be set by backend
        datePurchasedByCustomer: null,
        warrantyExpiration: "",
        /*category: "GENERAL",*/
        addedBy: "",
        addToExisting: false
    });

    // Stock settings form state
    const [stockSettings, setStockSettings] = useState({
        partNumber: "",
        partName: "",
        currentCount: 0,
        lowStockThreshold: 10,
        priorityLevel: "NORMAL",
        notes: ""
    });

    // Function to check if the user is a technician
    const isTechnician = () => {
        return userRole === 'technician';
    };

    // Function to check if the user is an admin
    const isAdmin = () => {
        return userRole === 'admin';
    };

    // Show technician restriction message
    const showTechnicianRestrictionMessage = () => {
        showNotification("As a technician, you don't have permission to modify inventory.", "error");
    };

    // Enhanced helper function to calculate availability status with part number aggregation
    const calculateAvailabilityStatus = (availableStock, threshold) => {
        // Ensure threshold is a valid number, default to 10 if invalid
        const validThreshold = (threshold && threshold > 0) ? threshold : 10;
        
        if (availableStock <= 0) {
            return { status: "Out of Stock", color: "bg-red-100 text-red-600" };
        } else if (availableStock < validThreshold) {
            return { status: "Low Stock", color: "bg-yellow-100 text-yellow-600" };
        } else if (availableStock <= validThreshold * 2) {
            return { status: "Normal", color: "bg-blue-100 text-blue-600" };
        } else {
            return { status: "Good", color: "bg-green-100 text-green-600" };
        }
    };

    // Enhanced parseJwt to better handle role extraction
    /*const parseJwt = (token) => {
        try {
            if (!token || typeof token !== 'string') {
                console.error("Invalid token: token is null, undefined, or not a string");
                return null;
            }

            // Check if token has the correct format (should have exactly 2 dots for JWS)
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error("Invalid JWT format: token should have exactly 3 parts separated by dots");
                return null;
            }

            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error parsing JWT:", e);
            return null;
        }
    };*/

    // Enhanced helper function to get user email from token
    /*const getUserEmailFromToken = (token) => {
        try {
            const decodedToken = parseJwt(token);
            const email = decodedToken?.email ||
                decodedToken?.sub ||
                decodedToken?.preferred_username ||
                decodedToken?.user_email;

            return email || "unknown@example.com";
        } catch (e) {
            console.error("Error extracting email from token:", e);
            return "error@example.com";
        }
    };*/

    // Show notification helper function
    const showNotification = (message, type = 'success', duration = 3000) => {
        setToast({ show: true, message, type, duration });
        // If duration > 0, Toast component will auto-hide and call onClose; we also ensure state resets after a short buffer
        if (duration > 0) {
            setTimeout(() => {
                setToast({ show: false, message: '', type: 'success', duration: 3000 });
            }, duration + 350);
        }
    };

    // Highlight matching text in search results
    const highlightText = (text, searchTerm) => {
        if (!searchTerm.trim() || !text) return text;
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <span key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded font-medium">
                    {part}
                </span>
            ) : part
        );
    };

    // Fetch backend low stock data for comparison (optional)
    const fetchBackendLowStockData = async () => {
        try {
            const response = await api.get('/part/stock/lowStockPartNumbers');
            // Log backend vs frontend comparison for debugging
            console.log('Backend low stock count:', response.data.length);
            console.log('Frontend low stock count:', lowStockPartNumbers.length);
        } catch (err) {
            console.error("Error fetching backend low stock data:", err);
        }
    };

    // Manual low stock check and display modal
    const checkAndShowLowStock = async () => {
        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        try {
            // Always show modal when manually triggered, even if no low stock items
            // The low stock data is already calculated in fetchInventory()
            setShowLowStockModal(true);
        } catch (err) {
            console.error("Error checking low stock:", err);
            showNotification("Failed to check low stock items", "error");
        }
    };

    // Refresh stock tracking for all part numbers
    const refreshAllStockTracking = async (showLowStockModalAfter = true) => {
        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }
        try {
            // show loading toast
            setToast({ show: true, message: 'Refreshing stock tracking...', type: 'loading', duration: 0 });
            await api.post('/part/stock/refreshAllTracking', {});
            showNotification("Stock tracking refreshed successfully");
            await fetchInventory();
            if (showLowStockModalAfter) {
                await checkAndShowLowStock();
            }
        } catch (err) {
            console.error("Error refreshing stock tracking:", err);
            showNotification("Failed to refresh stock tracking", "error");
        } finally {
            // close loading toast
            setToast({ show: false, message: '', type: 'success', duration: 3000 });
        }
    };

    // Handle stock settings
    const handleStockSettings = (partNumber) => {
        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        // Find the current stock count for this part number
        const partData = inventoryItems.find(item => item.partNumber === partNumber);
        const currentCount = partData ? partData.currentStock : 0;

        setSelectedPartNumberForSettings(partNumber);
        setStockSettings({
            partNumber: partNumber,
            partName: partData ? partData.name : "",
            currentCount: currentCount,
            lowStockThreshold: partData ? partData.lowStockThreshold : 10,
            priorityLevel: "NORMAL",
            notes: ""
        });
        setShowStockSettingsModal(true);
    };

    // Update stock settings
    const updateStockSettings = async (e) => {
        e.preventDefault();
        
        try {
            await api.put('/part/stock/updateTracking', stockSettings);
            showNotification("Stock settings updated successfully");
            setShowStockSettingsModal(false);
            await fetchInventory();
            setTimeout(() => {
                fetchInventory();
            }, 500);
        } catch (err) {
            console.error("Error updating stock settings:", err);
            showNotification("Failed to update stock settings", "error");
        }
    };

    // Enhanced delete part function
    const handleDeletePart = (partId) => {
        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        // Find the actual individual part from allParts arrays
        let partToDelete = null;
        for (const item of inventoryItems) {
            if (item.allParts) {
                const foundPart = item.allParts.find(part => part.id === partId);
                if (foundPart) {
                    partToDelete = foundPart;
                    break;
                }
            }
        }
        
        console.log("Deleting individual part:", partToDelete);
        
        if (!partToDelete) {
            showNotification("Part not found", "error");
            return;
        }
        
        setPartToDelete(partToDelete);
        setShowDeleteModal(true);
    };

    // Confirm delete part
    const confirmDeletePart = async () => {
        try {
            // show loading toast
            setToast({ show: true, message: 'Deleting part...', type: 'loading', duration: 0 });
            await api.delete(`/part/deletePart/${partToDelete.id}`);
            showNotification("Part deleted successfully");
            await fetchInventory();
            await refreshAllStockTracking();
        } catch (err) {
            console.error("Error deleting part:", err);
            showNotification("Failed to delete part. " + (err.response?.data?.message || "Please try again."), "error");
        } finally {
            setShowDeleteModal(false);
            setPartToDelete(null);
            // close loading toast if still open
            setToast(prev => prev.type === 'loading' ? { show: false, message: '', type: 'success', duration: 3000 } : prev);
        }
    };

    // Handle description click to show modal
    const handleDescriptionClick = (item) => {
        const title = `${item.brand || ''} ${item.model || ''}`.trim() || item.name || "Part Description";
        setSelectedDescription({
            title: title,
            content: item.description || "No description available",
            part: item
        });
        setShowDescriptionModal(true);
    };

    // Enhanced inventory fetching with part number aggregation
    const fetchInventory = async () => {
        setLoading(true);
        // show loading toast
        setToast({ show: true, message: 'Loading inventory...', type: 'loading', duration: 0 });
        try {
            const response = await api.get('/part/getAllParts');

            // Transform API data and group by part number for display
            const partsMap = new Map();
            
            response.data.forEach(item => {
                const partNumber = item.partNumber;
                if (partsMap.has(partNumber)) {
                    // Aggregate stock for same part number
                    const existing = partsMap.get(partNumber);
                    existing.totalStock += item.currentStock;
                    existing.totalReserved += (item.reservedQuantity || 0);
                    existing.totalParts += 1;
                    existing.suppliers.add(item.supplierName || 'Unknown');
                    existing.allParts.push(item);
                } else {
                    partsMap.set(partNumber, {
                        id: item.id, // Use first part's ID for operations
                        partNumber: partNumber,
                        name: item.name,
                        description: item.description,
                        unitCost: item.unitCost,
                        totalStock: item.currentStock,
                        totalReserved: (item.reservedQuantity || 0),
                        lowStockThreshold: item.lowStockThreshold,
                        serialNumber: item.serialNumber,
                        brand: item.brand,
                        model: item.model,
                        /*category: item.category || "GENERAL",*/
                        totalParts: 1,
                        suppliers: new Set([item.supplierName || 'Unknown']),
                        allParts: [item],
                        dateAdded: item.dateAdded,
                        addedBy: item.addedBy
                    });
                }
            });

            // Convert map to array and calculate availability
            const transformedItems = Array.from(partsMap.values()).map(aggregatedItem => {
                const availableStock = aggregatedItem.totalStock - aggregatedItem.totalReserved;
                const availability = calculateAvailabilityStatus(availableStock, aggregatedItem.lowStockThreshold);
                
                return {
                    ...aggregatedItem,
                    id: aggregatedItem.id,
                    sku: aggregatedItem.partNumber,
                    currentStock: aggregatedItem.totalStock,
                    availableStock: availableStock,
                    reservedStock: aggregatedItem.totalReserved,
                    suppliersCount: aggregatedItem.suppliers.size,
                    suppliersList: Array.from(aggregatedItem.suppliers),
                    availability: {
                        status: availability.status,
                        quantity: availableStock,
                        color: availability.color
                    }
                };
            });

            setInventoryItems(transformedItems);
            
            // Calculate consistent stock summary from frontend data
            const lowStockItems = transformedItems.filter(item => item.availability.status === 'Low Stock');
            const outOfStockItems = transformedItems.filter(item => item.availability.status === 'Out of Stock');
            
            setStockSummary({
                totalPartNumbers: transformedItems.length,
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStockItems.length,
                activeAlertsCount: lowStockItems.length + outOfStockItems.length
            });
            
            // Update lowStockPartNumbers to match the frontend calculation
            const lowStockPartNumbers = lowStockItems.map(item => ({
                partNumber: item.partNumber,
                partName: item.name,
                currentAvailableStock: item.availableStock,
                lowStockThreshold: item.lowStockThreshold,
                alertLevel: item.availableStock <= 0 ? 'CRITICAL' : 
                           item.availableStock < item.lowStockThreshold * 0.5 ? 'HIGH' : 'MEDIUM'
            }));
            
            setLowStockPartNumbers(lowStockPartNumbers);
            
            // Debug logging
            console.log('Stock Status Calculation Summary:');
            console.log('Total items:', transformedItems.length);
            console.log('Low stock items:', lowStockItems.length);
            console.log('Out of stock items:', outOfStockItems.length);
            console.log('Low stock part numbers:', lowStockPartNumbers);
            
            // Additional debug logging for stock threshold checking
            transformedItems.forEach(item => {
                const debugInfo = {
                    partNumber: item.partNumber,
                    availableStock: item.availableStock,
                    lowStockThreshold: item.lowStockThreshold,
                    status: item.availability.status,
                    isLowStock: item.availableStock < item.lowStockThreshold
                };
                if (debugInfo.isLowStock !== (debugInfo.status === 'Low Stock')) {
                    console.warn('Stock status mismatch for:', debugInfo);
                }
            });

            setLoading(false);
            // close loading toast
            setToast({ show: false, message: '', type: 'success', duration: 3000 });
        } catch (err) {
            console.error("Error fetching inventory:", err);
            // notify user of failure via toast
            showNotification("Failed to load inventory items, add items or check your connection.", 'error', 5000);
            setLoading(false);
        }
    };

    // Initialize component
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const storedToken = localStorage.getItem('authToken');
                if (!storedToken) {
                    throw new Error("No authentication token found");
                }

                const decodedToken = parseJwt(storedToken);
                if (!decodedToken) {
                    throw new Error("Invalid authentication token");
                }

                const role = decodedToken?.role ||
                    decodedToken?.authorities ||
                    decodedToken?.["cognito:groups"] ||
                    [];

                const normalizedRole = Array.isArray(role) ? role[0]?.toLowerCase() : role.toLowerCase();
                setUserRole(normalizedRole);

                await fetchInventory();
                // Low stock data is calculated in fetchInventory() now
                // Optional: fetch backend data for comparison
                await fetchBackendLowStockData();
            } catch (err) {
                console.error("Authentication error:", err);
                showNotification("Authentication failed. Please log in again.", 'error', 5000);
                setLoading(false);
            }
        };

        checkAuthentication();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPart(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle bulk add item changes
    const handleBulkItemChange = (index, field, value) => {
        setBulkAddItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            
            // If updating the master row (index 0), update all other rows except serial number and date purchased
            if (index === 0 && field !== 'serialNumber' && field !== 'datePurchasedByCustomer') {
                for (let i = 1; i < updated.length; i++) {
                    updated[i] = { 
                        ...updated[i], 
                        [field]: value
                    };
                }
            }
            
            return updated;
        });
    };



    // Copy master row to new row
    const copyMasterToNewRow = () => {
        setBulkAddItems(prev => {
            const masterRow = prev[0];
            const newRow = {
                ...masterRow,
                serialNumber: "" // Keep serial number empty for each new row
            };
            return [...prev, newRow];
        });
    };



    // Add new bulk item (copy from master row)
    const addBulkItem = () => {
        copyMasterToNewRow();
    };

    // Remove bulk item
    const removeBulkItem = (index) => {
        if (bulkAddItems.length > 1) {
            setBulkAddItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Handle bulk add submission
    const handleBulkAdd = async (e) => {
        e.preventDefault();

        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        setBulkAddLoading(true);

        try {
            // show loading toast
            setToast({ show: true, message: 'Adding parts...', type: 'loading', duration: 0 });

            // Filter out empty items
            const validItems = bulkAddItems.filter(item => 
                item.partNumber.trim() && 
                item.brand?.trim() && 
                item.model?.trim() && 
                item.serialNumber.trim()
            ).map(item => ({
                ...item,
                name: `${item.brand?.trim() || ''} ${item.model?.trim() || ''}`.trim()
            }));

            if (validItems.length === 0) {
                showNotification("No valid items to add", "error");
                return;
            }

            // Prepare bulk add data
            const bulkData = {
                basePartNumber: validItems[0].partNumber,
                name: validItems[0].name,
                description: validItems[0].description,
                unitCost: parseFloat(validItems[0].unitCost),
                stockPerItem: 1,
                lowStockThreshold: parseInt(validItems[0].lowStockThreshold),
                partType: "STANDARD",
                serialNumbers: validItems.map(item => item.serialNumber),
                brand: validItems[0].brand,
                model: validItems[0].model,
                addToExisting: validItems[0].addToExisting || false // Include the addToExisting flag
            };

            const response = await api.post('/part/addBulkParts', bulkData);
            showNotification(validItems[0].addToExisting ?
                `Successfully added ${response.data.length} parts to existing part number` : 
                `Successfully added ${response.data.length} parts`);

            // Reset form
            setBulkAddItems([{
                partNumber: "",
                name: "",
                description: "",
                unitCost: 0,
                currentStock: 1,
                lowStockThreshold: 10,
                serialNumber: "",
                addToExisting: false
            }]);

            // Refresh inventory
            await fetchInventory();
            await refreshAllStockTracking();

            // Close modal after delay
            setTimeout(() => {
                setShowBulkAddModal(false);
            }, 1500);

        } catch (err) {
            console.error("Error in bulk add:", err);
            
            // Handle specific error types
            let errorMessage = "Failed to add parts";
            
            if (err.response?.status === 400) {
                const responseData = err.response.data;
                if (typeof responseData === 'string' && responseData.includes('Serial number already exists')) {
                    const serialMatch = responseData.match(/Serial number already exists: (\w+)/);
                    if (serialMatch) {
                        errorMessage = `Serial number "${serialMatch[1]}" already exists in the database. Please use a unique serial number.`;
                    } else {
                        errorMessage = "One or more serial numbers already exist. Please check and use unique serial numbers.";
                    }
                } else if (responseData.includes('duplicate') || responseData.includes('already exists')) {
                    errorMessage = "Duplicate data detected. Please check your input values.";
                } else if (responseData.includes('Part number does not exist')) {
                    errorMessage = "The part number does not exist. Please check the part number or add as new parts.";
                } else {
                    errorMessage = responseData || "Invalid data provided";
                }
            } else if (err.response?.status === 500) {
                errorMessage = "Server error occurred. Please try again later.";
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            showNotification(errorMessage, "error");
        } finally {
            setBulkAddLoading(false);
            // close loading toast if still open
            setToast(prev => prev.type === 'loading' ? { show: false, message: '', type: 'success', duration: 3000 } : prev);
        }
    };

    // Toggle accordion expansion
    const toggleGroupExpansion = (partNumber) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(partNumber)) {
                newSet.delete(partNumber);
            } else {
                newSet.add(partNumber);
            }
            return newSet;
        });
    };

    // Handle edit button click for individual parts
    const handleEditClick = (part) => {
        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        console.log("Editing individual part:", part);
        setEditPart({...part});
        setShowEditModal(true);
    };

    // Handle edit form input changes
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditPart(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle update part form submission
    const handleUpdatePart = async (e) => {
        e.preventDefault();

        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        setEditLoading(true);
        setEditError(null);
        setEditSuccess(false);

        try {
            // show loading toast
            setToast({ show: true, message: 'Updating part...', type: 'loading', duration: 0 });

            const updateData = {
                partNumber: editPart.partNumber || "",
                name: editPart.name || "",
                description: editPart.description || "",
                unitCost: parseFloat(editPart.unitCost) || 0,
                serialNumber: editPart.serialNumber,
                isCustomerPurchased: editPart.isCustomerPurchased || false,
                datePurchasedByCustomer: editPart.datePurchasedByCustomer,
                warrantyExpiration: editPart.warrantyExpiration,
                addedBy: editPart.addedBy || '',
                brand: editPart.brand || '',
                model: editPart.model || ''
            };
            await api.patch(`/part/updatePart/${editPart.id}`, updateData);
            setEditSuccess(true);
            showNotification("Part updated successfully");
            await fetchInventory();
            await refreshAllStockTracking(false);
            setTimeout(() => {
                setShowEditModal(false);
                setEditSuccess(false);
            }, 1500);
        } catch (err) {
            console.error("Error updating part:", err);
            setEditError(err.message || err.response?.data?.message || "Failed to update part");
            showNotification(err.message || err.response?.data?.message || "Failed to update part", 'error');
        } finally {
            setEditLoading(false);
            // close loading toast if still open
            setToast(prev => prev.type === 'loading' ? { show: false, message: '', type: 'success', duration: 3000 } : prev);
        }
    };

    // Handle add part form submission
    const handleAddPart = async (e) => {
        e.preventDefault();

        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        setAddPartLoading(true);
        setAddPartError(null);
        setAddPartSuccess(false);

        try {
            // show loading toast
            setToast({ show: true, message: 'Adding part...', type: 'loading', duration: 0 });

            const partData = {
                ...newPart,
                unitCost: parseFloat(newPart.unitCost),
                currentStock: parseInt(newPart.currentStock),
                lowStockThreshold: parseInt(newPart.lowStockThreshold),
                addedBy: newPart.addedBy,
                addToExisting: newPart.addToExisting || false
            };
            await api.post('/part/addPart', partData);
            setAddPartSuccess(true);
            showNotification(newPart.addToExisting ? "Part added to existing part number successfully" : "Part added successfully");
            setNewPart({
                partNumber: "",
                name: "",
                description: "",
                unitCost: 0,
                currentStock: 0,
                lowStockThreshold: 10,
                serialNumber: "",
                dateAdded: null,
                datePurchasedByCustomer: null,
                warrantyExpiration: "",
                addedBy: "",
                addToExisting: false
            });
            await fetchInventory();
            await refreshAllStockTracking();
            setTimeout(() => {
                setShowAddModal(false);
                setAddPartSuccess(false);
            }, 1500);
        } catch (err) {
            console.error("Error adding part:", err);
            
            // Handle specific error types
            let errorMessage = "Failed to add part";
            
            if (err.response?.status === 400) {
                const responseData = err.response.data;
                if (typeof responseData === 'string' && responseData.includes('Serial number already exists')) {
                    const serialMatch = responseData.match(/Serial number already exists: (\w+)/);
                    if (serialMatch) {
                        errorMessage = `Serial number "${serialMatch[1]}" already exists in the database. Please use a unique serial number.`;
                    } else {
                        errorMessage = "Serial number already exists. Please use a unique serial number.";
                    }
                } else if (responseData.includes('duplicate') || responseData.includes('already exists')) {
                    errorMessage = "Duplicate data detected. Please check your input values.";
                } else if (responseData.includes('Part number does not exist')) {
                    errorMessage = "The part number does not exist. Please check the part number or add as a new part.";
                } else {
                    errorMessage = responseData || "Invalid data provided";
                }
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setAddPartError(errorMessage);
            showNotification(errorMessage, 'error');
        } finally {
            setAddPartLoading(false);
            // close loading toast if still open
            setToast(prev => prev.type === 'loading' ? { show: false, message: '', type: 'success', duration: 3000 } : prev);
        }
    };

    // Filter items based on search query
    const filteredItems = inventoryItems.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        /*item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||*/
        item.partNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Search in serial numbers of all parts in the group
        (item.allParts && item.allParts.some(part => 
            part.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        ))
    );

    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">
            {/* Sidebar */}
            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'inventory'}/>
            </div>


            {/* Main Content */}
            <div className="flex-1 bg-gray-50">
                <div className="px-10 py-8">
                    {/* Header with enhanced controls */}
                    <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {isTechnician()
                                    ? "View and search parts inventory"
                                    : "Manage your parts and inventory"}
                            </p>
                        </div>
                        {isAdmin() && (
                            <div className="mt-4 md:mt-0 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 w-full md:w-auto">
                                <div className="relative group w-full md:w-auto">
                                    <button
                                        onClick={refreshAllStockTracking}
                                        className="w-full md:w-auto max-w-xs px-3 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                        title="Refresh Stock & Show Low Stock Alert"
                                    >
                                        <RefreshCw size={16} className="mr-1" />
                                        <span className="hidden xs:inline">Refresh & Check Stock</span>
                                        <span className="inline xs:hidden">Refresh</span>
                                    </button>
                                    {/* Enhanced Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        Refresh all stock data & check for low stock alerts
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBulkAddModal(true)}
                                    className="w-full md:w-auto max-w-xs px-3 py-2 bg-green-600 text-white rounded-md flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                                    title="Add multiple parts with different serial numbers"
                                >
                                    <Package size={16} className="mr-1" />
                                    <span className="hidden xs:inline">Bulk Add</span>
                                    <span className="inline xs:hidden">Bulk</span>
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full md:w-auto max-w-xs px-4 py-2 bg-[#25D482] text-white rounded-md flex items-center justify-center hover:bg-[#1fab6b] transition-colors shadow-sm hover:shadow-md"
                                    title="Add a single new part to inventory"
                                >
                                    <Plus size={16} className="mr-1" />
                                    <span className="hidden xs:inline">Add New Part</span>
                                    <span className="inline xs:hidden">Add</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stock Summary Cards */}
                    {isAdmin() && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <Package className="h-8 w-8 text-blue-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Total Part Numbers</p>
                                        <p className="text-2xl font-bold text-gray-900">{stockSummary.totalPartNumbers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative group">
                                <div 
                                    className="bg-white p-4 rounded-lg border-2 border-yellow-200 cursor-pointer hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                    onClick={checkAndShowLowStock}
                                    title="Click to view and configure low stock items"
                                >
                                    <div className="flex items-center">
                                        <div className="p-2 bg-yellow-100 rounded-lg">
                                            <TrendingDown className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-700">Low Stock Items</p>
                                            <p className="text-2xl font-bold text-gray-900">{stockSummary.lowStockCount}</p>
                                            <div className="flex items-center mt-1">
                                                <Settings size={12} className="text-yellow-600 mr-1" />
                                                <p className="text-xs text-yellow-700 font-medium">Click to manage thresholds</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Enhanced Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    View low stock parts and configure stock thresholds
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <X className="h-8 w-8 text-red-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                                        <p className="text-2xl font-bold text-gray-900">{stockSummary.outOfStockCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                                        <p className="text-2xl font-bold text-gray-900">{stockSummary.activeAlertsCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="mb-6 p-4 bg-blue-50 text-blue-600 rounded-md">
                            <p>Loading inventory data...</p>
                        </div>
                    )}

                    {/* Available Inventory */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <Package size={20} className="mr-2" />
                                Available Inventory
                                <span className=" bg-blue-100 text-blue-800 text-xs rounded-full
                                    sm:ml-2 sm:px-1 sm:py-0.5
                                    ml-1 px-2 py-
                                    ">
                                    {inventoryItems.length} items
                                </span>
                            </h2>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                {/* Search input always on top for mobile */}
                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        placeholder="Search by name, SKU, part number, or serial number..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="absolute left-3 top-2.5 text-gray-400">
                                        <Search size={18} />
                                    </div>
                                </div>
                                {/* Filters and actions below search on mobile, inline on desktop */}
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50 w-full sm:w-auto">
                                        <span className="mr-1">Filters</span>
                                        <ChevronDown size={16} />
                                    </button>
                                    <div className="flex flex-row gap-2 w-full sm:w-auto">
                                        <div className="relative group w-full sm:w-auto">
                                            <button
                                                onClick={() => {
                                                    if (expandedGroups.size === 0) {
                                                        // Expand all
                                                        setExpandedGroups(new Set(paginatedItems.map(item => item.partNumber)));
                                                    } else {
                                                        // Collapse all
                                                        setExpandedGroups(new Set());
                                                    }
                                                }}
                                                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md text-sm hover:bg-indigo-200 hover:text-indigo-800 flex items-center transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
                                                title={expandedGroups.size === 0 ? "Expand all groups to see individual parts" : "Collapse all groups"}
                                            >
                                                <ChevronDown
                                                    size={14}
                                                    className={`mr-1 transition-transform duration-200 ${
                                                        expandedGroups.size > 0 ? 'rotate-180' : ''
                                                    }`}
                                                />
                                                {expandedGroups.size === 0 ? 'Expand All' : 'Collapse All'}
                                            </button>
                                            {/* Enhanced Tooltip */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                {expandedGroups.size === 0 ? 'Show all individual parts with serial numbers' : 'Hide individual parts'}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 w-full sm:w-auto">
                                            <Eye size={12} className="mr-1" />
                                            {expandedGroups.size} of {paginatedItems.length} expanded
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="mt-4 flex flex-col">
                            <InventoryTable
                                paginatedItems={paginatedItems}
                                searchQuery={searchQuery}
                                expandedGroups={expandedGroups}
                                isAdmin={isAdmin()}
                                onToggleGroupExpansion={toggleGroupExpansion}
                                onDescriptionClick={handleDescriptionClick}
                                onStockSettings={handleStockSettings}
                                onEditClick={handleEditClick}
                                onDeletePart={handleDeletePart}
                                highlightText={highlightText}
                            />
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{Math.min(1 + (currentPage - 1) * itemsPerPage, filteredItems.length)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className="font-medium">{filteredItems.length}</span> results
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Part Modal */}
            {showAddModal && (
                <AddPartModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddPart}
                    onInputChange={handleInputChange}
                    newPart={newPart}
                    loading={addPartLoading}
                    success={addPartSuccess}
                    error={addPartError}
                />
            )}

            {/* Edit Part Modal */}
            {showEditModal && editPart && (
                <EditPartModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSubmit={handleUpdatePart}
                    onInputChange={handleEditInputChange}
                    editPart={editPart}
                    loading={editLoading}
                    success={editSuccess}
                    error={editError}
                />
            )}

            {/* Description Modal */}
            {showDescriptionModal && (
                <DescriptionModal
                    isOpen={showDescriptionModal}
                    onClose={() => setShowDescriptionModal(false)}
                    title={selectedDescription.title}
                    content={selectedDescription.content}
                    part={selectedDescription.part}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && partToDelete && (
                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDeletePart}
                    partToDelete={partToDelete}
                />
            )}

            {/* Toast component (single source for notifications, loading, errors) */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={() => setToast({ show: false, message: '', type: 'success', duration: 3000 })}
            />
        </div>
    );
};

export default Inventory;
