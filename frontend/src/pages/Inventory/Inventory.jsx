import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Package, ChevronLeft, ChevronRight, X, Pen, Trash, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import axios from "axios";

const Inventory = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [addPartLoading, setAddPartLoading] = useState(false);
    const [addPartSuccess, setAddPartSuccess] = useState(false);
    const [addPartError, setAddPartError] = useState(null);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState({ title: "", content: "" });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [partToDelete, setPartToDelete] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [showLowStockModal, setShowLowStockModal] = useState(false);

    // For multiple serial numbers
    const [serialNumbers, setSerialNumbers] = useState([""]);

    // Edit functionality state variables
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPart, setEditPart] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);
    const [editError, setEditError] = useState(null);

    // For editing serial numbers
    const [editSerialNumbers, setEditSerialNumbers] = useState([""]);

    // New part form state
    const [newPart, setNewPart] = useState({
        partNumber: "",
        name: "",
        description: "",
        unitCost: 0,
        currentStock: 0,
        lowStockThreshold: 0,
        serialNumber: "",
        dateAdded: new Date().toISOString().split('T')[0] + "T00:00:00",
        datePurchasedByCustomer: null,
        warrantyExpiration: "",
        addedBy: "" // Will be populated with user email from token during submission
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

    // Helper function to calculate availability status
    const calculateAvailabilityStatus = (currentStock) => {
        if (currentStock <= 0) {
            return "Out of Stock";
        } else if (currentStock <= 2) {
            return "Low Stock";
        } else {
            return "In Stock";
        }
    };

    // Function to check low stock threshold and trigger alerts
    const checkLowStockThreshold = (currentStock, threshold, partId, partName) => {
        if (currentStock <= threshold && currentStock > 0) {
            // Add item to low stock list if not already there
            setLowStockItems(prev => {
                const exists = prev.some(item => item.id === partId);
                if (!exists) {
                    return [...prev, {
                        id: partId,
                        name: partName,
                        currentStock,
                        lowStockThreshold: threshold
                    }];
                }
                return prev;
            });

            // Only show the alert modal if user is admin
            if (isAdmin()) {
                setShowLowStockModal(true);
            }

            return true;
        }
        return false;
    };

    // Function to reserve a part (reduce stock)
    const reservePart = async (partId, quantityToReserve) => {
        if (quantityToReserve <= 0) return;

        try {
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found");
            }

            // Find the part in inventory
            const partToUpdate = inventoryItems.find(item => item.id === partId);
            if (!partToUpdate) return;

            const newStock = Math.max(0, partToUpdate.currentStock - quantityToReserve);

            // Check if this reservation breaches the threshold
            const isLowStock = checkLowStockThreshold(
                newStock,
                partToUpdate.lowStockThreshold,
                partToUpdate.id,
                partToUpdate.name
            );

            // Update local state first for immediate feedback
            const updatedItems = inventoryItems.map(item => {
                if (item.id === partId) {
                    return {
                        ...item,
                        currentStock: newStock,
                        availability: {
                            status: calculateAvailabilityStatus(newStock),
                            quantity: newStock
                        }
                    };
                }
                return item;
            });

            setInventoryItems(updatedItems);

            // Update backend
            const updateData = {
                currentStock: newStock
            };

            await axios.patch(
                `http://localhost:8080/part/updatePart/${partId}`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${freshToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (isLowStock) {
                showNotification(`Stock level for ${partToUpdate.name} is now low (${newStock} remaining)`, "warning");
            }
        } catch (err) {
            console.error("Error updating part stock:", err);
            showNotification("Failed to update inventory records", "error");
        }
    };

    // Add a serial number field
    const addSerialNumberField = () => {
        setSerialNumbers([...serialNumbers, ""]);
    };

    // Update a serial number at specific index
    const updateSerialNumber = (index, value) => {
        const updated = [...serialNumbers];
        updated[index] = value;
        setSerialNumbers(updated);
    };

    // Remove a serial number field
    const removeSerialNumberField = (index) => {
        if (serialNumbers.length > 1) {
            const updated = [...serialNumbers];
            updated.splice(index, 1);
            setSerialNumbers(updated);
        }
    };

    // Update an edit serial number at specific index
    const updateEditSerialNumber = (index, value) => {
        const updated = [...editSerialNumbers];
        updated[index] = value;
        setEditSerialNumbers(updated);
    };

    // Enhanced parseJwt to better handle role extraction
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error parsing JWT:", e);
            return null;
        }
    };

    // Enhanced helper function to get user email from token
    const getUserEmailFromToken = (token) => {
        try {
            const decodedToken = parseJwt(token);
            // Try multiple possible locations where email might be stored in the token
            const email = decodedToken?.email ||
                decodedToken?.sub ||
                decodedToken?.preferred_username ||
                decodedToken?.user_email;

            console.log("Token payload:", decodedToken); // Debug what's in the token
            console.log("Extracted email:", email);

            return email || "unknown@example.com"; // Provide a default email format
        } catch (e) {
            console.error("Error extracting email from token:", e);
            return "error@example.com"; // Clearly indicate an error occurred
        }
    };

    // Show notification helper function
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000); // Auto-hide after 3 seconds
    };

    // Get token from various storage locations
    const getAuthToken = () => {
        const authToken = localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('authToken');
        return authToken;
    };

    // Update this function to open the delete modal instead of using window.confirm
    const handleDeletePart = (partId) => {
        if (isTechnician()) {
            showTechnicianRestrictionMessage();
            return;
        }

        const part = inventoryItems.find(item => item.id === partId);
        setPartToDelete(part);
        setShowDeleteModal(true);
    };

    // Add a new function to handle the actual deletion
    const confirmDeletePart = async () => {
        try {
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            await axios.delete(`http://localhost:8080/part/deletePart/${partToDelete.id}`, {
                headers: {
                    'Authorization': `Bearer ${freshToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Update UI after successful deletion
            setInventoryItems(prevItems => prevItems.filter(item => item.id !== partToDelete.id));

            // Show notification instead of alert
            showNotification("Part deleted successfully");

        } catch (err) {
            console.error("Error deleting part:", err);
            showNotification("Failed to delete part. " + (err.response?.data?.message || "Please try again."), "error");
        } finally {
            // Close the delete modal
            setShowDeleteModal(false);
            setPartToDelete(null);
        }
    };

    // Handle description click to show modal
    const handleDescriptionClick = (item) => {
        setSelectedDescription({
            title: item.name || "Part Description",
            content: item.description || "No description available"
        });
        setShowDescriptionModal(true);
    };

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found");
            }

            // Use the actual backend endpoint to get all parts
            const response = await axios.get('http://localhost:8080/part/getAllParts', {
                headers: {
                    'Authorization': `Bearer ${freshToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Transform API data to match the UI expectations
            const transformedItems = response.data.map(item => ({
                id: item.id,
                name: item.name,
                sku: item.partNumber || item.serialNumber,
                category: item.category || "Uncategorized",
                availability: {
                    status: calculateAvailabilityStatus(item.currentStock),
                    quantity: item.currentStock
                },
                // Store full item data for editing
                partNumber: item.partNumber,
                description: item.description,
                unitCost: item.unitCost,
                currentStock: item.currentStock,
                lowStockThreshold: item.lowStockThreshold,
                serialNumber: item.serialNumber,
                isDeleted: item.isDeleted,
                dateAdded: item.dateAdded,
                datePurchasedByCustomer: item.datePurchasedByCustomer,
                warrantyExpiration: item.warrantyExpiration,
                addedBy: item.addedBy
            }));

            setInventoryItems(transformedItems);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching inventory:", err);
            setError("Failed to load inventory items");
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                // Get token from storage
                const storedToken = getAuthToken();
                if (!storedToken) {
                    throw new Error("No authentication token found");
                }

                // Validate token by trying to parse it
                const decodedToken = parseJwt(storedToken);
                if (!decodedToken) {
                    throw new Error("Invalid authentication token");
                }

                // Extract the user's role from the token
                const role = decodedToken?.role ||
                    decodedToken?.authorities ||
                    decodedToken?.["cognito:groups"] ||
                    [];

                // Set the user role - handle both string and array formats
                const normalizedRole = Array.isArray(role) ? role[0]?.toLowerCase() : role.toLowerCase();
                setUserRole(normalizedRole);

                console.log("User role:", normalizedRole);

                await fetchInventory();
            } catch (err) {
                console.error("Authentication error:", err);
                setError("Authentication failed. Please log in again.");
                setLoading(false);
            }
        };

        checkAuthentication();
    }, []);

    // Check for low stock items on initial load
    useEffect(() => {
        const checkInitialLowStock = () => {
            const lowItems = inventoryItems.filter(item =>
                item.currentStock <= item.lowStockThreshold && item.currentStock > 0
            );

            if (lowItems.length > 0) {
                setLowStockItems(lowItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    currentStock: item.currentStock,
                    lowStockThreshold: item.lowStockThreshold
                })));

                if (isAdmin()) {
                    setShowLowStockModal(true);
                }
            }
        };

        if (inventoryItems.length > 0) {
            checkInitialLowStock();
        }
    }, [inventoryItems]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPart(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit button click
    const handleEditClick = (item) => {
        if (isTechnician()) {
            showTechnicianRestrictionMessage();
            return;
        }

        setEditPart({...item});

        // Initialize editSerialNumbers based on the part's serial number
        // If the serialNumber contains commas, treat it as multiple serial numbers
        const serialNumbersArray = item.serialNumber ?
            [item.serialNumber] : [""];

        setEditSerialNumbers(serialNumbersArray);
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

        if (isTechnician()) {
            showTechnicianRestrictionMessage();
            return;
        }

        setEditLoading(true);
        setEditError(null);
        setEditSuccess(false);

        try {
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            // Get the user's email from the token for the edit operation
            const userEmail = getUserEmailFromToken(freshToken);

            // Join all serial numbers with commas
            const serialNumber = editSerialNumbers[0].trim();

            // Check for duplicate part number or serial number (excluding the current part)
            const isDuplicate = inventoryItems.some(item =>
                    item.id !== editPart.id && (
                        (item.partNumber && item.partNumber.toLowerCase() === editPart.partNumber.toLowerCase()) ||
                        (item.serialNumber && serialNumber &&
                            item.serialNumber.toLowerCase() === serialNumber.toLowerCase()
                        )
                    )
            );

            if (isDuplicate) {
                throw new Error("A part with the same part number or serial number already exists in inventory.");
            }

            // Format the data for the API
            const updateData = {
                partNumber: editPart.partNumber || "",
                name: editPart.name || "",
                description: editPart.description || "",
                unitCost: parseFloat(editPart.unitCost) || 0,
                currentStock: parseInt(editPart.currentStock) || 0,
                lowStockThreshold: parseInt(editPart.lowStockThreshold) || 0,
                serialNumber: serialNumber,
                isDeleted: editPart.isDeleted || false,
                // dateAdded is excluded to preserve the original value
                datePurchasedByCustomer: editPart.datePurchasedByCustomer || "",
                warrantyExpiration: editPart.warrantyExpiration || "",
                addedBy: userEmail // Update to use email instead of preserving old value
            };

            console.log("Update data being sent to API:", updateData);

            // Make the PATCH request to update the part
            const response = await axios.patch(
                `http://localhost:8080/part/updatePart/${editPart.id}`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${freshToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("Update response:", response.data);
            setEditSuccess(true);

            // Update the item in local state with new status
            const updatedCurrentStock = parseInt(editPart.currentStock) || 0;
            const newStatus = calculateAvailabilityStatus(updatedCurrentStock);

            setInventoryItems(prevItems =>
                prevItems.map(item =>
                    item.id === editPart.id
                        ? {
                            ...item,
                            name: editPart.name,
                            sku: editPart.partNumber || serialNumber,
                            currentStock: updatedCurrentStock,
                            partNumber: editPart.partNumber,
                            description: editPart.description,
                            unitCost: parseFloat(editPart.unitCost) || 0,
                            lowStockThreshold: parseInt(editPart.lowStockThreshold) || 0,
                            serialNumber: serialNumber,
                            availability: {
                                status: newStatus,
                                quantity: updatedCurrentStock
                            },
                            addedBy: userEmail // Update to use email in the UI state as well
                        }
                        : item
                )
            );

            // Check if the update caused a low stock condition
            checkLowStockThreshold(
                updatedCurrentStock,
                parseInt(editPart.lowStockThreshold) || 0,
                editPart.id,
                editPart.name
            );

            // Close modal after success
            setTimeout(() => {
                setShowEditModal(false);
                setEditSuccess(false);
            }, 1500);

        } catch (err) {
            console.error("Error updating part:", err);
            setEditError(err.message || err.response?.data?.message || "Failed to update part");
        } finally {
            setEditLoading(false);
        }
    };

    // Handle add part form submission
    const handleAddPart = async (e) => {
        e.preventDefault();

        if (isTechnician()) {
            showTechnicianRestrictionMessage();
            return;
        }

        setAddPartLoading(true);
        setAddPartError(null);
        setAddPartSuccess(false);

        try {
            // Get a fresh token every time
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            // Get the user's email from the token
            const userEmail = getUserEmailFromToken(freshToken);
            console.log("User email extracted from token:", userEmail);

            // Combine all serial numbers with commas
            const combinedSerialNumbers = serialNumbers
                .filter(sn => sn.trim() !== "")
                .join(", ");

            // Check for duplicate part number or serial number
            const isDuplicate = inventoryItems.some(item =>
                (item.partNumber && item.partNumber.toLowerCase() === newPart.partNumber.toLowerCase()) ||
                (item.serialNumber && combinedSerialNumbers &&
                    item.serialNumber.toLowerCase().split(',').some(serial =>
                        combinedSerialNumbers.toLowerCase().split(',').some(newSerial =>
                            newSerial.trim() === serial.trim()
                        )
                    )
                )
            );

            if (isDuplicate) {
                throw new Error("A part with the same part number or serial number already exists in inventory.");
            }

            // Format the data to match API expectations
            const partData = {
                ...newPart,
                serialNumber: combinedSerialNumbers,
                unitCost: parseFloat(newPart.unitCost),
                currentStock: parseInt(newPart.currentStock),
                lowStockThreshold: parseInt(newPart.lowStockThreshold),
                addedBy: userEmail // Use the email from the token
            };

            console.log("Data being sent to API:", partData);

            // Make API call to add part with proper Bearer format
            const response = await axios.post(
                'http://localhost:8080/part/addPart',
                partData,
                {
                    headers: {
                        'Authorization': `Bearer ${freshToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log("API Response:", response.data);
            setAddPartSuccess(true);

            // Reset form
            setNewPart({
                partNumber: "",
                name: "",
                description: "",
                unitCost: 0,
                currentStock: 0,
                lowStockThreshold: 0,
                serialNumber: "",
                dateAdded: new Date().toISOString().split('T')[0] + "T00:00:00",
                datePurchasedByCustomer: null,
                warrantyExpiration: "",
                addedBy: ""
            });

            // Reset serial numbers
            setSerialNumbers([""]);

            // Refresh inventory after successful add
            await fetchInventory();

            // Close modal after short delay
            setTimeout(() => {
                setShowAddModal(false);
                setAddPartSuccess(false);
            }, 1500);
        } catch (err) {
            console.error("Error adding part:", err);
            if (err.response?.status === 401) {
                setAddPartError("Authentication failed. Please log in again.");
            } else {
                setAddPartError(err.message || err.response?.data?.message || "Failed to add part. Please try again.");
            }
        } finally {
            setAddPartLoading(false);
        }
    };

    // Filter items based on search query
    const filteredItems = inventoryItems.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Status badge color mapping
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
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
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="px-10 py-8">
                    {/* Header with conditional Add button */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {isTechnician()
                                    ? "View and search parts inventory"
                                    : "Manage your parts and inventory"}
                            </p>
                        </div>
                        {!isTechnician() && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-[#33e407] text-white rounded-md flex items-center hover:bg-[#2bb406] transition-colors"
                            >
                                <Plus size={16} className="mr-1" />
                                Add New Part
                            </button>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-md">
                            <p className="font-medium">{error}</p>
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
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {inventoryItems.length} items
                                </span>
                            </h2>
                        </div>

                        {/* Search and Filters */}
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search by name, SKU, or category..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="absolute left-3 top-2.5 text-gray-400">
                                        <Search size={18} />
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 flex items-center hover:bg-gray-50">
                                        <span className="mr-1">Filters</span>
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Part ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Availability
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedItems.length > 0 ? (
                                    paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.sku}</div>
                                                <div className="text-sm text-gray-500">{item.category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{item.name}</div>
                                                <button
                                                    onClick={() => handleDescriptionClick(item)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                                >
                                                    View details
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.availability?.status)}`}>
                                                        {item.availability?.status}
                                                    </span>
                                                    <span className="ml-2 text-sm text-gray-500">
                                                        {item.availability?.quantity} in stock
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {!isTechnician() ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(item)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Edit part"
                                                            >
                                                                <Pen size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePart(item.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete part"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDescriptionClick(item)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="View details"
                                                        >
                                                            <Search size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No inventory items found. Add a new part to get started.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Add New Part</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Success Message */}
                        {addPartSuccess && (
                            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                                <CheckCircle size={20} className="mr-2" />
                                Part added successfully!
                            </div>
                        )}

                        {/* Error Message */}
                        {addPartError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                                {addPartError}
                            </div>
                        )}

                        {/* Add Part Form */}
                        <form onSubmit={handleAddPart}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Part Number</label>
                                    <input
                                        type="text"
                                        name="partNumber"
                                        value={newPart.partNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newPart.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={newPart.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Unit Cost (₱)</label>
                                    <input
                                        type="number"
                                        name="unitCost"
                                        value={newPart.unitCost}
                                        onChange={handleInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">
                                        Serial Numbers
                                        <button
                                            type="button"
                                            onClick={addSerialNumberField}
                                            className="ml-2 p-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </label>
                                    {serialNumbers.map((serialNum, index) => (
                                        <div key={index} className="flex items-center mb-2">
                                            <input
                                                type="text"
                                                value={serialNum}
                                                onChange={(e) => updateSerialNumber(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSerialNumberField(index)}
                                                    className="ml-2 p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        name="currentStock"
                                        value={newPart.currentStock}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={newPart.lowStockThreshold}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addPartLoading}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${addPartLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {addPartLoading ? 'Adding...' : 'Add Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Part Modal */}
            {showEditModal && editPart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Edit Part</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Success Message */}
                        {editSuccess && (
                            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                                <CheckCircle size={20} className="mr-2" />
                                Part updated successfully!
                            </div>
                        )}

                        {/* Error Message */}
                        {editError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                                {editError}
                            </div>
                        )}

                        {/* Edit Part Form */}
                        <form onSubmit={handleUpdatePart}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Part Number</label>
                                    <input
                                        type="text"
                                        name="partNumber"
                                        value={editPart.partNumber || ""}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editPart.name || ""}
                                        onChange={handleEditInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={editPart.description || ""}
                                    onChange={handleEditInputChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Unit Cost (₱)</label>
                                    <input
                                        type="number"
                                        name="unitCost"
                                        value={editPart.unitCost || 0}
                                        onChange={handleEditInputChange}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        value={editSerialNumbers[0] || ""}
                                        onChange={(e) => updateEditSerialNumber(0, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Current Stock</label>
                                    <input
                                        type="number"
                                        name="currentStock"
                                        value={editPart.currentStock || 0}
                                        onChange={handleEditInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={editPart.lowStockThreshold || 0}
                                        onChange={handleEditInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${editLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {editLoading ? 'Updating...' : 'Update Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Description Modal */}
            {showDescriptionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">{selectedDescription.title}</h2>
                            <button
                                onClick={() => setShowDescriptionModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-md text-gray-700">
                            {selectedDescription.content}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowDescriptionModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && partToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <div className="flex items-center mb-4 text-red-600">
                            <Trash size={24} className="mr-2" />
                            <h2 className="text-xl font-semibold">Delete Part</h2>
                        </div>

                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete <strong>{partToDelete.name}</strong>? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeletePart}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded-md shadow-md z-50 transition-all duration-300 flex items-center ${
                    notification.type === 'error' ? 'bg-red-100 text-red-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'error' ? (
                            <X size={20} className="mr-2" />
                        ) : notification.type === 'warning' ? (
                            <AlertTriangle size={20} className="mr-2" />
                        ) : (
                            <CheckCircle size={20} className="mr-2" />
                        )}
                        <p>{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Low Stock Alert Modal */}
            {showLowStockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-xl w-full">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center text-yellow-600">
                                <AlertTriangle size={20} className="mr-2" />
                                <h2 className="text-xl font-semibold">Low Stock Alert</h2>
                            </div>
                            <button
                                onClick={() => setShowLowStockModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-gray-700">The following items are running low on stock:</p>
                        </div>

                        <div className="overflow-y-auto max-h-60">
                            <table className="min-w-full">
                                <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {lowStockItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{item.name}</td>
                                        <td className="px-4 py-3 text-red-600 font-medium">{item.currentStock}</td>
                                        <td className="px-4 py-3 text-gray-500">{item.lowStockThreshold}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowLowStockModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
//
export default Inventory;