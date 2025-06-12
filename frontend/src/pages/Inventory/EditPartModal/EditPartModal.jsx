import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const EditPartModal = ({ 
    isOpen, 
    onClose, 
    editPart,
    onInputChange,
    onSubmit,
    loading,
    success,
    error
}) => {
    const [showPurchaseDateCalendar, setShowPurchaseDateCalendar] = useState(false);
    const [showWarrantyExpirationCalendar, setShowWarrantyExpirationCalendar] = useState(false);
    const [isCustomerPurchased, setIsCustomerPurchased] = useState(false);
    const [warrantyType, setWarrantyType] = useState('7_DAYS');
    const [customWarrantyDays, setCustomWarrantyDays] = useState(7);

    // Initialize state when editPart changes
    useEffect(() => {
        if (editPart) {
            setIsCustomerPurchased(editPart.isCustomerPurchased || editPart.datePurchasedByCustomer ? true : false);
            // Reset warranty type to default when loading part
            setWarrantyType('7_DAYS');
            setCustomWarrantyDays(7);
        }
    }, [editPart]);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.react-calendar') && !event.target.closest('input[readonly]')) {
                setShowPurchaseDateCalendar(false);
                setShowWarrantyExpirationCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate warranty expiration date based on purchase date and warranty type
    const calculateWarrantyExpiration = (purchaseDate, type, customDays = 7) => {
        if (!purchaseDate) return null;
        const date = new Date(purchaseDate);
        
        switch(type) {
            case '7_DAYS':
                date.setDate(date.getDate() + 7);
                break;
            case '3_MONTHS':
                date.setMonth(date.getMonth() + 3);
                break;
            case '6_MONTHS':
                date.setMonth(date.getMonth() + 6);
                break;
            case '1_YEAR':
                date.setFullYear(date.getFullYear() + 1);
                break;
            case 'CUSTOM':
                date.setDate(date.getDate() + customDays);
                break;
            default:
                date.setDate(date.getDate() + 7);
        }
        return date;
    };

    // Handle warranty type change
    const handleWarrantyTypeChange = (e) => {
        const type = e.target.value;
        setWarrantyType(type);
        
        // No need to update editPart since we don't store warranty type
        
        if (type === 'CUSTOM') {
            // For custom option, don't auto-calculate, let user pick the date
            return;
        }
        
        if (editPart.datePurchasedByCustomer) {
            const expirationDate = calculateWarrantyExpiration(
                editPart.datePurchasedByCustomer,
                type,
                customWarrantyDays
            );
            onInputChange({ target: { name: 'warrantyExpiration', value: expirationDate } });
        }
    };

    // Handle custom warranty expiration date change
    const handleWarrantyExpirationDateChange = (date) => {
        // Set time to 23:59:59 for end of day
        const expirationDate = new Date(date);
        expirationDate.setHours(23, 59, 59, 999);
        
        onInputChange({ target: { name: 'warrantyExpiration', value: expirationDate } });
        setShowWarrantyExpirationCalendar(false);
    };

    // Handle purchase date change
    const handlePurchaseDateChange = (date) => {
        onInputChange({ target: { name: 'datePurchasedByCustomer', value: date } });
        setShowPurchaseDateCalendar(false);
        
        // Recalculate warranty expiration
        const expirationDate = calculateWarrantyExpiration(date, warrantyType, customWarrantyDays);
        onInputChange({ target: { name: 'warrantyExpiration', value: expirationDate } });
    };

    // Handle customer purchase toggle
    const handleCustomerPurchaseToggle = (e) => {
        const isEnabled = e.target.checked;
        setIsCustomerPurchased(isEnabled);
        
        // Update the editPart object
        onInputChange({ target: { name: 'isCustomerPurchased', value: isEnabled } });
        
        if (!isEnabled) {
            // Clear dates when disabled
            onInputChange({ target: { name: 'datePurchasedByCustomer', value: null } });
            onInputChange({ target: { name: 'warrantyExpiration', value: null } });
            // Reset warranty type UI state when disabled
            setWarrantyType('7_DAYS');
            setCustomWarrantyDays(7);
        }
    };

    // Calculate days remaining in warranty
    const calculateDaysRemaining = () => {
        if (!editPart.warrantyExpiration) return null;
        const expiration = new Date(editPart.warrantyExpiration);
        const today = new Date();
        const diffTime = expiration - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (!isOpen || !editPart) return null;

    const daysRemaining = calculateDaysRemaining();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Part</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                        <CheckCircle size={20} className="mr-2" />
                        Part updated successfully!
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                        {error}
                    </div>
                )}

                {/* Edit Part Form */}
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Part Number</label>
                            <input
                                type="text"
                                name="partNumber"
                                value={editPart.partNumber || ""}
                                onChange={onInputChange}
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
                                onChange={onInputChange}
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
                            onChange={onInputChange}
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
                                onChange={onInputChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Serial Number</label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={editPart.serialNumber || ""}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Current Stock and Low Stock Threshold are managed at SKU/part_number level, not individual parts */}
                    {/* 
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Current Stock</label>
                            <input
                                type="number"
                                name="currentStock"
                                value={editPart.currentStock || 0}
                                onChange={onInputChange}
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
                                onChange={onInputChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    */}

                    {/* Customer Purchase Toggle */}
                    <div className="mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isCustomerPurchased}
                                    onChange={handleCustomerPurchaseToggle}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
                                    isCustomerPurchased ? 'bg-blue-600' : 'bg-gray-300'
                                }`}>
                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
                                        isCustomerPurchased ? 'transform translate-x-6' : ''
                                    }`}></div>
                                </div>
                            </div>
                            <span className="text-gray-700 font-medium">Enable if this item is purchased by the customer</span>
                        </label>
                    </div>

                    {/* Purchase Date and Warranty Section */}
                    {isCustomerPurchased && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Warranty Information</h3>
                            
                            {/* Purchase Date */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Date Purchased by Customer</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={editPart.datePurchasedByCustomer ? new Date(editPart.datePurchasedByCustomer).toLocaleDateString() : ''}
                                        readOnly
                                        onClick={() => setShowPurchaseDateCalendar(true)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                        placeholder="Select purchase date"
                                    />
                                    <CalendarIcon className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                </div>
                                {showPurchaseDateCalendar && (
                                    <div className="absolute z-10 mt-1">
                                        <Calendar
                                            onChange={handlePurchaseDateChange}
                                            value={editPart.datePurchasedByCustomer ? new Date(editPart.datePurchasedByCustomer) : null}
                                            className="border border-gray-200 rounded-lg shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Warranty Type Selection */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Warranty Period</label>
                                <select
                                    value={warrantyType}
                                    onChange={handleWarrantyTypeChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="7_DAYS">7 Days</option>
                                    <option value="3_MONTHS">3 Months</option>
                                    <option value="6_MONTHS">6 Months</option>
                                    <option value="1_YEAR">1 Year</option>
                                    <option value="CUSTOM">Custom Set Expiration Date</option>
                                </select>
                            </div>

                            {/* Custom Warranty Expiration Date Selection */}
                            {warrantyType === 'CUSTOM' && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Custom Warranty Expiration Date</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editPart.warrantyExpiration ? new Date(editPart.warrantyExpiration).toLocaleDateString() : ''}
                                            readOnly
                                            onClick={() => setShowWarrantyExpirationCalendar(true)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                            placeholder="Select warranty expiration date"
                                        />
                                        <CalendarIcon className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                    </div>
                                    {showWarrantyExpirationCalendar && (
                                        <div className="absolute z-10 mt-1">
                                            <Calendar
                                                onChange={handleWarrantyExpirationDateChange}
                                                value={editPart.warrantyExpiration ? new Date(editPart.warrantyExpiration) : null}
                                                className="border border-gray-200 rounded-lg shadow-lg"
                                                minDate={editPart.datePurchasedByCustomer ? new Date(editPart.datePurchasedByCustomer) : new Date()}
                                            />
                                        </div>
                                    )}
                                    <div className="mt-2 text-xs text-gray-500">
                                        Warranty will expire at 23:59:59 on the selected date
                                    </div>
                                </div>
                            )}

                            {/* Warranty Expiration Date Display */}
                            {editPart.warrantyExpiration && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">Warranty Expiration:</span>{' '}
                                        {warrantyType === 'CUSTOM' 
                                            ? new Date(editPart.warrantyExpiration).toLocaleString()
                                            : new Date(editPart.warrantyExpiration).toLocaleDateString()
                                        }
                                    </div>
                                    {daysRemaining !== null && (
                                        <div className={`text-sm mt-1 ${
                                            daysRemaining > 30 ? 'text-green-600' :
                                            daysRemaining > 7 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                            {daysRemaining > 0 
                                                ? `${daysRemaining} days remaining`
                                                : 'Warranty expired'}
                                        </div>
                                    )}
                                    {warrantyType === 'CUSTOM' && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Custom expiration time: 23:59:59
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Updating...' : 'Update Part'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPartModal; 