import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Package, ChevronLeft, ChevronRight, X, Plus, AlertTriangle, TrendingDown, Eye, Settings, RefreshCw, SlidersHorizontal } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
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

// Import new modern UI components
import CategoryTree from "./CategoryTree/CategoryTree.jsx";
import FilterSidebar from "./FilterSidebar/FilterSidebar.jsx";

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
    // only need setter; the selected value isn't referenced elsewhere
    const [, setSelectedPartNumberForSettings] = useState(null);

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

    // Edit functionality state variables
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPart, setEditPart] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);
    const [editError, setEditError] = useState(null);
    const [showEditConfirm, setShowEditConfirm] = useState(false);
    const [pendingEditSubmit, setPendingEditSubmit] = useState(null);
    
    // Customer fetching state
    const [fetchedCustomer, setFetchedCustomer] = useState(null);
    const [fetchingCustomer, setFetchingCustomer] = useState(false);

    // Accordion state for expanding part number groups
    const [expandedGroups, setExpandedGroups] = useState(new Set());

    // Modern UI state
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filters, setFilters] = useState({
        stockStatus: 'all',
        priceRange: { min: '', max: '' },
        dateRange: { start: '', end: '' }
    });
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);

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
        addToExisting: false,
        image: null
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

    // Confirm delete part (DeleteConfirmModal already shows confirmation, this is the actual delete)
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
            // Don't clear inventory on error - keep existing data
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
            // Don't clear inventoryItems on error - keep existing data visible
            // Only clear if we have no data at all (initial load)
            if (inventoryItems.length === 0) {
                setInventoryItems([]);
            }
        }
    };

    // Initialize component
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const storedToken = localStorage.getItem('authToken');
                if (!storedToken) {
                    showNotification("Authentication failed: no token found. Please log in.", 'error', 5000);
                    setLoading(false);
                    return;
                }

                const decodedToken = parseJwt(storedToken);
                if (!decodedToken) {
                    showNotification("Authentication failed: invalid token. Please log in.", 'error', 5000);
                    setLoading(false);
                    return;
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

    // State for bulk add confirmation
    const [showBulkAddConfirm, setShowBulkAddConfirm] = useState(false);
    const [pendingBulkAdd, setPendingBulkAdd] = useState(null);

    // Handle bulk add submission
    const handleBulkAdd = async (e) => {
        e.preventDefault();

        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        // Show confirmation dialog
        setShowBulkAddConfirm(true);
        setPendingBulkAdd(e);
    };

    // Confirm bulk add
    const confirmBulkAdd = async () => {
        if (!pendingBulkAdd) return;

        setBulkAddLoading(true);
        setShowBulkAddConfirm(false);

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
                setPendingBulkAdd(null);
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
            // Don't clear inventory on error - keep existing data
        } finally {
            setBulkAddLoading(false);
            setPendingBulkAdd(null);
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

    // Fetch customer details by phone or email
    const fetchCustomerDetails = async ({ phone, email }) => {
        if (!phone && !email) {
            return null;
        }

        setFetchingCustomer(true);
        try {
            // Try to find customer by phone or email
            // Note: This assumes there's a customer/user endpoint that can search by phone or email
            // If no such endpoint exists, this will need to be implemented on the backend
            const params = {};
            if (phone) params.phone = phone;
            if (email) params.email = email;

            // For now, we'll check if there's a user endpoint that can search customers
            // This is a placeholder - adjust the endpoint based on your actual API
            try {
                const response = await api.get('/user/searchCustomer', { params });
                if (response.data) {
                    setFetchedCustomer(response.data);
                    return response.data;
                }
            } catch (err) {
                // If endpoint doesn't exist, try alternative approach
                console.log("Customer lookup endpoint not available or customer not found");
                setFetchedCustomer(null);
                return null;
            }
        } catch (err) {
            console.error("Error fetching customer details:", err);
            setFetchedCustomer(null);
            return null;
        } finally {
            setFetchingCustomer(false);
        }
    };

    // Handle edit button click for individual parts
    const handleEditClick = async (part) => {
        if (!isAdmin()) {
            showTechnicianRestrictionMessage();
            return;
        }

        console.log("Editing individual part:", part);
        setEditPart({...part});
        setShowEditModal(true);
        
        // Automatically fetch customer details if phone or email exists
        const customerPhone = part.customerPhone || (part.customer ? part.customer.phone : null);
        const customerEmail = part.customerEmail || (part.customer ? part.customer.email : null);
        
        if (customerPhone || customerEmail) {
            await fetchCustomerDetails({ phone: customerPhone, email: customerEmail });
        } else {
            setFetchedCustomer(null);
        }
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
                model: editPart.model || '',
                // Include customer details if they exist
                customerFirstName: editPart.customerFirstName || '',
                customerLastName: editPart.customerLastName || '',
                customerPhone: editPart.customerPhone || '',
                customerEmail: editPart.customerEmail || ''
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
            let errorMessage = err.message || err.response?.data?.message || "Failed to update part";
            
            // Handle image validation errors
            if (err.response?.status === 400 || err.response?.status === 500) {
                const responseData = err.response.data;
                if (typeof responseData === 'string' && (responseData.includes('Only PNG') || responseData.includes('Invalid photo type') || responseData.includes('PNG, JPG, and JPEG'))) {
                    errorMessage = "Only PNG, JPG, and JPEG files are accepted.";
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                } else if (responseData?.message) {
                    errorMessage = responseData.message;
                }
            }
            
            setEditError(errorMessage);
            showNotification(errorMessage, 'error');
            // Don't clear inventory on error - keep existing data
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

            if (newPart.addToExisting && typeof newPart.image === 'string' && newPart.image) {
                partData.partPhotoUrl = newPart.image;
                await api.post('/part/addPart', partData);
            } else if (newPart.image instanceof File) {
                const formData = new FormData();
                formData.append('part', new Blob([JSON.stringify(partData)], { type: 'application/json' }));
                formData.append('file', newPart.image);

                await api.post('/part/addPart', formData);
            } else {
                await api.post('/part/addPart', partData);
            }

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
                addToExisting: false,
                image: null
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
                if (typeof responseData === 'string') {
                    if (responseData.includes('Serial number already exists')) {
                        const serialMatch = responseData.match(/Serial number already exists: (\w+)/);
                        if (serialMatch) {
                            errorMessage = `Serial number "${serialMatch[1]}" already exists in the database. Please use a unique serial number.`;
                        } else {
                            errorMessage = "Serial number already exists. Please use a unique serial number.";
                        }
                    } else if (responseData.includes('Only PNG') || responseData.includes('Invalid photo type') || responseData.includes('PNG, JPG, and JPEG')) {
                        errorMessage = "Only PNG, JPG, and JPEG files are accepted.";
                    } else if (responseData.includes('duplicate') || responseData.includes('already exists')) {
                        errorMessage = "Duplicate data detected. Please check your input values.";
                    } else if (responseData.includes('Part number does not exist')) {
                        errorMessage = "The part number does not exist. Please check the part number or add as a new part.";
                    } else {
                        errorMessage = responseData || "Invalid data provided";
                    }
                } else if (responseData?.message) {
                    errorMessage = responseData.message;
                }
            } else if (err.response?.status === 500) {
                const responseData = err.response.data;
                if (typeof responseData === 'string' && (responseData.includes('Only PNG') || responseData.includes('Invalid photo type') || responseData.includes('PNG, JPG, and JPEG'))) {
                    errorMessage = "Only PNG, JPG, and JPEG files are accepted.";
                } else {
                    errorMessage = "Server error occurred. Please try again later.";
                }
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setAddPartError(errorMessage);
            showNotification(errorMessage, 'error');
            // Don't clear inventory on error - keep existing data
        } finally {
            setAddPartLoading(false);
            // close loading toast if still open
            setToast(prev => prev.type === 'loading' ? { show: false, message: '', type: 'success', duration: 3000 } : prev);
        }
    };

    // Enhanced filtering function
    const filteredItems = inventoryItems.filter(item => {
        // Search query filter
        const matchesSearch = 
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.partNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.allParts && item.allParts.some(part => 
                part.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
            ));

        if (!matchesSearch) return false;

        // Category filter - supports part number, brand, model, and part number patterns
        if (selectedCategory && selectedCategory !== 'All') {
            // Parse the category path
            // Format: "All/PartNumber" for part number grouping (2 parts)
            // Format: "All/BrandName" for brand grouping when selecting brand folder (2 parts)
            // Format: "All/Brand/PartNumber" for brand grouping when selecting specific part (3 parts)
            const categoryPath = selectedCategory.split('/');
            const categoryValue = categoryPath.length > 1 ? categoryPath[1] : selectedCategory;
            const partNumberValue = categoryPath.length > 2 ? categoryPath[2] : null;
            
            // If a specific part number is selected in the path (from brand grouping: "All/Brand/PartNumber")
            if (partNumberValue) {
                // Exact match for part number from brand grouping
                if (item.partNumber !== partNumberValue) return false;
            } 
            // If path is "All/XXX" (2 parts) - need to determine if it's part number or brand
            else if (categoryPath.length === 2 && categoryPath[0] === 'All') {
                const itemPartNumber = (item.partNumber || '').trim();
                const itemBrand = (item.brand || '').trim();
                const selectedValue = categoryValue.trim();
                
                // Check if it's a brand match (case-insensitive)
                const isBrandMatch = itemBrand.toLowerCase() === selectedValue.toLowerCase();
                
                // Check if it's a part number match (exact)
                const isPartNumberMatch = itemPartNumber === selectedValue;
                
                // If it matches brand, filter by brand
                if (isBrandMatch) {
                    // Brand match - show this item
                    return true;
                }
                // If it matches part number exactly, filter by part number
                else if (isPartNumberMatch) {
                    // Part number match - show this item
                    return true;
                }
                // Otherwise, no match
                else {
                    return false;
                }
            }
            // Otherwise, it's a brand/model category - use flexible matching
            else {
                const itemPartNumber = item.partNumber?.toUpperCase() || '';
                const itemBrand = (item.brand || '').toLowerCase();
                const itemModel = (item.model || '').toLowerCase();
                const categoryUpper = categoryValue.toUpperCase();
                const categoryLower = categoryValue.toLowerCase();
                
                // For brand/model categories, use flexible matching
                const matchesBrand = itemBrand === categoryLower || 
                                    itemBrand.includes(categoryLower) ||
                                    categoryLower.includes(itemBrand);
                const matchesModel = itemModel === categoryLower || 
                                    itemModel.includes(categoryLower) ||
                                    categoryLower.includes(itemModel);
                
                // For alphanumeric patterns
                const matchesAlphanumeric = (selectedCategory.startsWith('Letters') || selectedCategory.startsWith('Numbers')) && 
                    ((selectedCategory.startsWith('Letters') && /[A-Z]/.test(itemPartNumber.charAt(0))) ||
                     (selectedCategory.startsWith('Numbers') && /[0-9]/.test(itemPartNumber.charAt(0))));
                
                if (!matchesBrand && !matchesModel && !matchesAlphanumeric) {
                    return false;
                }
            }
        }

        // Stock status filter
        if (filters.stockStatus !== 'all') {
            const status = item.availability?.status?.toLowerCase().replace(/\s+/g, '-');
            
            if (filters.stockStatus === 'in-stock') {
                // "In Stock" includes Good, Normal, and Low Stock (but not Out of Stock)
                const inStockStatuses = ['good', 'normal', 'low-stock', 'in-stock'];
                if (!inStockStatuses.includes(status)) return false;
            } else if (filters.stockStatus === 'out-of-stock') {
                // "Out of Stock" filter - match "out-of-stock" status
                if (status !== 'out-of-stock') return false;
            } else {
                // For other filters (low-stock), do exact match
                if (status !== filters.stockStatus) return false;
            }
        }

        // Price range filter
        if (filters.priceRange?.min && item.unitCost < parseFloat(filters.priceRange.min)) return false;
        if (filters.priceRange?.max && item.unitCost > parseFloat(filters.priceRange.max)) return false;


        // Date range filter
        if (filters.dateRange?.start && item.dateAdded) {
            const itemDate = new Date(item.dateAdded);
            const startDate = new Date(filters.dateRange.start);
            if (itemDate < startDate) return false;
        }
        if (filters.dateRange?.end && item.dateAdded) {
            const itemDate = new Date(item.dateAdded);
            const endDate = new Date(filters.dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (itemDate > endDate) return false;
        }

        return true;
    });

    // Pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">
            {/* Navigation Sidebar */}
            <div className="w-full md:w-[250px] h-auto md:h-screen">
                <Sidebar activePage={'inventory'}/>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50 flex">
                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="px-4 md:px-6 lg:px-8 py-6 flex-1 overflow-y-auto">
                        {/* Header with enhanced controls */}
                        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isTechnician()
                                        ? "View and search parts inventory"
                                        : "Manage your parts and inventory"}
                                </p>
                            </div>
                            {isAdmin() && (
                                <div className="flex flex-wrap gap-2">
                                    <div className="relative group">
                                        <button
                                            onClick={refreshAllStockTracking}
                                            className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                            title="Refresh Stock & Show Low Stock Alert"
                                        >
                                            <RefreshCw size={16} className="mr-1" />
                                            <span className="hidden sm:inline">Refresh & Check Stock</span>
                                            <span className="inline sm:hidden">Refresh</span>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setShowBulkAddModal(true)}
                                        className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                                        title="Add multiple parts with different serial numbers"
                                    >
                                        <Package size={16} className="mr-1" />
                                        <span className="hidden sm:inline">Bulk Add</span>
                                        <span className="inline sm:hidden">Bulk</span>
                                    </button>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-4 py-2 bg-[#25D482] text-white rounded-md flex items-center justify-center hover:bg-[#1fab6b] transition-colors shadow-sm hover:shadow-md"
                                        title="Add a single new part to inventory"
                                    >
                                        <Plus size={16} className="mr-1" />
                                        <span className="hidden sm:inline">Add New Part</span>
                                        <span className="inline sm:hidden">Add</span>
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

                        {/* Search and View Controls */}
                        <div className="flex gap-4 mb-6">
                            {/* Main Table Area */}
                            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        {/* Search Bar */}
                                        <div className="relative flex-1 max-w-2xl">
                                            <input
                                                type="text"
                                                placeholder="Search by name, SKU, part number, or serial number..."
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                            <div className="absolute left-3 top-3 text-gray-400">
                                                <Search size={18} />
                                            </div>
                                        </div>

                                        {/* Filter Button and Results Count */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setShowFilterSidebar(true)}
                                                className="lg:hidden px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 flex items-center hover:bg-gray-50 transition-colors"
                                            >
                                                <SlidersHorizontal size={16} className="mr-2" />
                                                <span>Filters</span>
                                            </button>
                                            <p className="hidden md:block text-sm text-gray-700">
                                                <span className="font-medium">{filteredItems.length}</span> results
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (expandedGroups.size === 0) {
                                                        setExpandedGroups(new Set(paginatedItems.map(item => item.partNumber)));
                                                    } else {
                                                        setExpandedGroups(new Set());
                                                    }
                                                }}
                                                className="hidden md:flex px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200 transition-colors items-center"
                                            >
                                                <ChevronDown
                                                    size={14}
                                                    className={`mr-1 transition-transform ${expandedGroups.size > 0 ? 'rotate-180' : ''}`}
                                                />
                                                {expandedGroups.size === 0 ? 'Expand All' : 'Collapse All'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Filters */}
                                {(selectedCategory || Object.values(filters).some(v => {
                                    if (typeof v === 'object' && v !== null) {
                                        return Object.values(v).some(val => val !== '' && val !== null);
                                    }
                                    return v !== '' && v !== 'all' && v !== null;
                                })) && (
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm text-gray-700 md:hidden">
                                                <span className="font-medium">{filteredItems.length}</span> results
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(null);
                                                    setFilters({
                                                        stockStatus: 'all',
                                                        priceRange: { min: '', max: '' },
                                                        dateRange: { start: '', end: '' }
                                                    });
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Content Area - Table */}
                                <div className="flex-1 min-h-[400px] flex flex-col">
                                    <div className="overflow-x-auto flex-1">
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
                                            onRefresh={fetchInventory}
                                        />
                                    </div>

                                {/* Enhanced Pagination - Only show when there are multiple pages */}
                                {filteredItems.length > itemsPerPage && (
                                    <div className="px-4 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-semibold text-gray-900">{Math.min(1 + (currentPage - 1) * itemsPerPage, filteredItems.length)}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className="font-semibold text-gray-900">{filteredItems.length}</span> results
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {totalPages > 5 && (
                                                <button
                                                    onClick={() => setCurrentPage(1)}
                                                    disabled={currentPage === 1}
                                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                        currentPage === 1 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                                    }`}
                                                    title="First page"
                                                >
                                                    <ChevronLeft size={16} className="inline" />
                                                    <ChevronLeft size={16} className="inline -ml-2" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                    currentPage === 1 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                                }`}
                                                title="Previous page"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            
                                            {/* Page Numbers */}
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setCurrentPage(pageNum)}
                                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors min-w-[36px] ${
                                                                currentPage === pageNum
                                                                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                    currentPage === totalPages || totalPages === 0
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                                }`}
                                                title="Next page"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                            {totalPages > 5 && (
                                                <button
                                                    onClick={() => setCurrentPage(totalPages)}
                                                    disabled={currentPage === totalPages || totalPages === 0}
                                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                        currentPage === totalPages || totalPages === 0
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                                    }`}
                                                    title="Last page"
                                                >
                                                    <ChevronRight size={16} className="inline" />
                                                    <ChevronRight size={16} className="inline -ml-2" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Results summary when pagination is not shown (few items) */}
                                {filteredItems.length > 0 && filteredItems.length <= itemsPerPage && (
                                    <div className="px-4 py-3 bg-white border-t border-gray-200 mt-auto">
                                        <p className="text-sm text-gray-700 text-center">
                                            Showing all <span className="font-semibold text-gray-900">{filteredItems.length}</span> {filteredItems.length === 1 ? 'result' : 'results'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                            {/* Right Sidebar - Categories and Filters */}
                            <div className="hidden lg:flex flex-col w-80 bg-white rounded-lg shadow-sm border border-gray-200 ml-4" style={{ height: 'calc(100vh - 200px)', maxHeight: 'calc(100vh - 200px)' }}>
                                {/* Categories Panel */}
                                <div className="overflow-y-auto border-b border-gray-200" style={{ height: '50%', maxHeight: '50%', flexShrink: 0 }}>
                                    <CategoryTree
                                        items={inventoryItems}
                                        selectedCategory={selectedCategory}
                                        onCategorySelect={setSelectedCategory}
                                        onClearFilter={() => setSelectedCategory(null)}
                                    />
                                </div>
                                
                                {/* Desktop Filters Panel */}
                                <div className="overflow-y-auto flex flex-col" style={{ height: '50%', maxHeight: '50%', flexShrink: 0 }}>
                                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                                            <SlidersHorizontal size={16} className="mr-2" />
                                            Advanced Filters
                                        </h3>
                                    </div>
                                    <div className="p-4 overflow-y-auto">
                                    <div className="space-y-4">
                                        {/* Stock Status Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Stock Status
                                            </label>
                                            <select
                                                value={filters.stockStatus || 'all'}
                                                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="in-stock">In Stock</option>
                                                <option value="low-stock">Low Stock</option>
                                                <option value="out-of-stock">Out of Stock</option>
                                            </select>
                                        </div>

                                        {/* Price Range Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Price Range
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={filters.priceRange?.min || ''}
                                                    onChange={(e) => setFilters({
                                                        ...filters,
                                                        priceRange: { ...filters.priceRange, min: e.target.value }
                                                    })}
                                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={filters.priceRange?.max || ''}
                                                    onChange={(e) => setFilters({
                                                        ...filters,
                                                        priceRange: { ...filters.priceRange, max: e.target.value }
                                                    })}
                                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Date Range Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Date Added
                                            </label>
                                            <div className="space-y-2">
                                                <input
                                                    type="date"
                                                    value={filters.dateRange?.start || ''}
                                                    onChange={(e) => setFilters({
                                                        ...filters,
                                                        dateRange: { ...filters.dateRange, start: e.target.value }
                                                    })}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.dateRange?.end || ''}
                                                    onChange={(e) => setFilters({
                                                        ...filters,
                                                        dateRange: { ...filters.dateRange, end: e.target.value }
                                                    })}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Clear Filters Button */}
                                        {(selectedCategory || Object.values(filters).some(v => {
                                            if (typeof v === 'object' && v !== null) {
                                                return Object.values(v).some(val => val !== '' && val !== null);
                                            }
                                            return v !== '' && v !== 'all' && v !== null;
                                        })) && (
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory(null);
                                                    setFilters({
                                                        stockStatus: 'all',
                                                        priceRange: { min: '', max: '' },
                                                        dateRange: { start: '', end: '' }
                                                    });
                                                }}
                                                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                                            >
                                                Clear All Filters
                                            </button>
                                        )}
                                    </div>
                                    </div>
                                </div>
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
                    onClose={() => {
                        setShowEditModal(false);
                        setFetchedCustomer(null);
                    }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setShowEditConfirm(true);
                        setPendingEditSubmit(e);
                    }}
                    onInputChange={handleEditInputChange}
                    editPart={editPart}
                    loading={editLoading}
                    success={editSuccess}
                    error={editError}
                    fetchCustomer={fetchCustomerDetails}
                    fetchedCustomer={fetchedCustomer}
                    fetchingCustomer={fetchingCustomer}
                />
            )}

            {/* Edit Part Confirmation Dialog */}
            {showEditConfirm && editPart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <AlertTriangle size={20} className="mr-2 text-blue-600" />
                                Confirm Update Part
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEditConfirm(false);
                                    setPendingEditSubmit(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Are you sure you want to update this part?
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowEditConfirm(false);
                                    setPendingEditSubmit(null);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditConfirm(false);
                                    if (pendingEditSubmit) {
                                        handleUpdatePart(pendingEditSubmit);
                                    }
                                    setPendingEditSubmit(null);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Confirm Update
                            </button>
                        </div>
                    </div>
                </div>
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

            {/* Bulk Add Modal */}
            {showBulkAddModal && (
                <BulkAddModal
                    isOpen={showBulkAddModal}
                    onClose={() => setShowBulkAddModal(false)}
                    onSubmit={handleBulkAdd}
                    bulkAddItems={bulkAddItems}
                    onBulkItemChange={handleBulkItemChange}
                    onAddBulkItem={addBulkItem}
                    onRemoveBulkItem={removeBulkItem}
                    loading={bulkAddLoading}
                />
            )}

            {/* Bulk Add Confirmation Dialog */}
            {showBulkAddConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                <AlertTriangle size={20} className="mr-2 text-blue-600" />
                                Confirm Bulk Add
                            </h3>
                            <button
                                onClick={() => {
                                    setShowBulkAddConfirm(false);
                                    setPendingBulkAdd(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                Are you sure you want to add {bulkAddItems.length} part(s)?
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowBulkAddConfirm(false);
                                    setPendingBulkAdd(null);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkAdd}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Confirm Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Settings Modal */}
            {showStockSettingsModal && (
                <StockSettingsModal
                    isOpen={showStockSettingsModal}
                    onClose={() => setShowStockSettingsModal(false)}
                    onSubmit={updateStockSettings}
                    stockSettings={stockSettings}
                    onStockSettingsChange={setStockSettings}
                />
            )}

            {/* Low Stock Modal */}
            {showLowStockModal && (
                <LowStockModal
                    isOpen={showLowStockModal}
                    onClose={() => setShowLowStockModal(false)}
                    lowStockItems={lowStockPartNumbers}
                    onConfigureStock={(partNumber) => {
                        setShowLowStockModal(false);
                        handleStockSettings(partNumber);
                    }}
                />
            )}

            {/* Filter Sidebar (Mobile) */}
            <FilterSidebar
                isOpen={showFilterSidebar}
                onClose={() => setShowFilterSidebar(false)}
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={() => {
                    setFilters({
                        stockStatus: 'all',
                        priceRange: { min: '', max: '' },
                        dateRange: { start: '', end: '' }
                    });
                }}
            />

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

//
