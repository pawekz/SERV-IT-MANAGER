import React, { useState, useEffect } from "react";
import { Search, ChevronDown, Package, ChevronLeft, ChevronRight, X, Pen, Trash, Plus, CheckCircle } from 'lucide-react';
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
    const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState({ title: "", content: "" });
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [partToDelete, setPartToDelete] = useState(null);

    // Edit functionality state variables
    const [showEditModal, setShowEditModal] = useState(false);
    const [editPart, setEditPart] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editSuccess, setEditSuccess] = useState(false);
    const [editError, setEditError] = useState(null);

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
        addedBy: ""
    });

    // Show notification helper function
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000); // Auto-hide after 3 seconds
    };

    // Update this function to open the delete modal instead of using window.confirm
    const handleDeletePart = (partId) => {
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

    // Toggle description expansion
    const toggleDescriptionExpand = (id) => {
        if (expandedDescriptionId === id) {
            setExpandedDescriptionId(null);
        } else {
            setExpandedDescriptionId(id);
        }
    };

    // Function to decode JWT token - needed for sidebar functionality
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    // Get token from various storage locations
    const getAuthToken = () => {
        const authToken = localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('authToken');
        return authToken;
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
                    status: item.currentStock > 0
                        ? (item.currentStock <= item.lowStockThreshold ? "Low Stock" : "In Stock")
                        : "Out of Stock",
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

                await fetchInventory();
            } catch (err) {
                console.error("Authentication error:", err);
                setError("Authentication failed. Please log in again.");
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

    // Handle edit button click
    const handleEditClick = (item) => {
        setEditPart({...item});
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
        setEditLoading(true);
        setEditError(null);
        setEditSuccess(false);

        try {
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            // Format the data for the API
            const updateData = {
                partNumber: editPart.partNumber || "",
                name: editPart.name || "",
                description: editPart.description || "",
                unitCost: parseFloat(editPart.unitCost) || 0,
                currentStock: parseInt(editPart.currentStock) || 0,
                lowStockThreshold: parseInt(editPart.lowStockThreshold) || 0,
                serialNumber: editPart.serialNumber || "",
                isDeleted: editPart.isDeleted || false,
                dateAdded: editPart.dateAdded || "",
                datePurchasedByCustomer: editPart.datePurchasedByCustomer || "",
                warrantyExpiration: editPart.warrantyExpiration || "",
                addedBy: editPart.addedBy || ""
            };

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

            // Refresh inventory to show updated data
            await fetchInventory();

            // Close modal after success
            setTimeout(() => {
                setShowEditModal(false);
                setEditSuccess(false);
            }, 1500);

        } catch (err) {
            console.error("Error updating part:", err);
            setEditError(err.response?.data?.message || "Failed to update part");
        } finally {
            setEditLoading(false);
        }
    };

    // Handle add part form submission
    const handleAddPart = async (e) => {
        e.preventDefault();
        setAddPartLoading(true);
        setAddPartError(null);
        setAddPartSuccess(false);

        try {
            // Get a fresh token every time
            const freshToken = getAuthToken();
            if (!freshToken) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            // Format the data to match API expectations
            const partData = {
                ...newPart,
                unitCost: parseFloat(newPart.unitCost),
                currentStock: parseInt(newPart.currentStock),
                lowStockThreshold: parseInt(newPart.lowStockThreshold),
                addedBy: newPart.addedBy || "system"
            };

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
                setAddPartError(err.response?.data?.message || "Failed to add part. Please try again.");
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
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                            <p className="text-sm text-gray-600 mt-1">Manage your parts and inventory</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} className="mr-1" />
                            Add New Part
                        </button>
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
                                        placeholder="Search parts by name or SKU..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                </div>
                                <div className="ml-4">
                                    <button className="px-3 py-2 border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50">
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedItems.length > 0 ? (
                                    paginatedItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.sku || `#${item.id}`}</div>
                                                <div className="text-xs text-gray-500">{item.category}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900 mb-1">{item.name}</div>
                                                <div
                                                    className={`text-xs text-gray-500 ${item.description && item.description.length > 50 ? 'cursor-pointer' : ''}`}
                                                    onClick={() => item.description && item.description.length > 50 ? handleDescriptionClick(item) : null}
                                                >
                                                    {item.description ? (
                                                        expandedDescriptionId === item.id
                                                            ? item.description
                                                            : `${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}`
                                                    ) : (
                                                        <span className="text-gray-400 italic">No description</span>
                                                    )}
                                                    {item.description && item.description.length > 50 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleDescriptionExpand(item.id); }}
                                                            className="ml-1 text-blue-500 hover:text-blue-700"
                                                        >
                                                            {expandedDescriptionId === item.id ? 'Show less' : 'Show more'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.availability.status)}`}>
                                                        {item.availability.status}
                                                    </span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {item.availability.quantity} in stock
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditClick(item)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        <Pen size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePart(item.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            {searchQuery
                                                ? "No parts match your search criteria."
                                                : "No parts in inventory. Add some parts to get started."}
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
                                    Showing <span className="font-medium">{Math.min(1 + (currentPage - 1) * itemsPerPage, filteredItems.length)}-{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> of <span className="font-medium">{filteredItems.length}</span> results
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm ${
                                        currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <ChevronLeft size={16} className="mr-1" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages}
                                    className={`inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm ${
                                        currentPage >= totalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Next
                                    <ChevronRight size={16} className="ml-1" />
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
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter part number"
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
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter part name"
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
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter part description"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Unit Cost ($)</label>
                                    <input
                                        type="number"
                                        name="unitCost"
                                        value={newPart.unitCost}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        name="serialNumber"
                                        value={newPart.serialNumber}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter serial number (if applicable)"
                                    />
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
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={newPart.lowStockThreshold}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0"
                                        min="0"
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
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                        addPartLoading ? 'opacity-75 cursor-wait' : ''
                                    }`}
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
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter part number"
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
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter part name"
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
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter part description"
                                    rows="3"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Unit Cost ($)</label>
                                    <input
                                        type="number"
                                        name="unitCost"
                                        value={editPart.unitCost || 0}
                                        onChange={handleEditInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        name="serialNumber"
                                        value={editPart.serialNumber || ""}
                                        onChange={handleEditInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter serial number (if applicable)"
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
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        name="lowStockThreshold"
                                        value={editPart.lowStockThreshold || 0}
                                        onChange={handleEditInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0"
                                        min="0"
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
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                                        editLoading ? 'opacity-75 cursor-wait' : ''
                                    }`}
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
                    notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                    <div className="flex items-center">
                        {notification.type === 'error' ? (
                            <X size={20} className="mr-2" />
                        ) : (
                            <CheckCircle size={20} className="mr-2" />
                        )}
                        <p>{notification.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;