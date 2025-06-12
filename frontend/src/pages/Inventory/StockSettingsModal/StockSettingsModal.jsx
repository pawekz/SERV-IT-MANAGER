import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const StockSettingsModal = ({ 
    isOpen, 
    onClose, 
    stockSettings,
    onStockSettingsChange,
    onSubmit
}) => {
    const [currentStockData, setCurrentStockData] = useState(null);
    const [loadingStockData, setLoadingStockData] = useState(false);

    if (!isOpen) return null;

    // Fetch current stock data when modal opens or part number changes
    useEffect(() => {
        if (isOpen && stockSettings.partNumber) {
            fetchCurrentStockData(stockSettings.partNumber);
        }
    }, [isOpen, stockSettings.partNumber]);

    const fetchCurrentStockData = async (partNumber) => {
        setLoadingStockData(true);
        try {
            const response = await fetch(`http://localhost:8080/part/stock/summary/${partNumber}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const stockData = await response.json();
                setCurrentStockData(stockData);
                // Update the current count in the form
                onStockSettingsChange(prev => ({
                    ...prev,
                    currentCount: stockData.currentAvailableStock
                }));
            } else {
                console.error('Failed to fetch stock data');
                setCurrentStockData(null);
            }
        } catch (error) {
            console.error('Error fetching stock data:', error);
            setCurrentStockData(null);
        } finally {
            setLoadingStockData(false);
        }
    };

    const handleInputChange = (field, value) => {
        onStockSettingsChange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Stock Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Part Number</label>
                            <input
                                type="text"
                                value={stockSettings.partNumber}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Low Stock Threshold</label>
                            <input
                                type="number"
                                value={stockSettings.lowStockThreshold}
                                onChange={(e) => handleInputChange('lowStockThreshold', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Priority Level</label>
                            <select
                                value={stockSettings.priorityLevel}
                                onChange={(e) => handleInputChange('priorityLevel', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="LOW">Low</option>
                                <option value="NORMAL">Normal</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Current Count</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={loadingStockData ? '' : (stockSettings.currentCount || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                    min="0"
                                    disabled
                                    title="Current count is automatically calculated from inventory"
                                    placeholder={loadingStockData ? 'Loading...' : 'Current available stock'}
                                />
                                {currentStockData && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        Total: {currentStockData.currentTotalStock} | 
                                        Available: {currentStockData.currentAvailableStock} | 
                                        Reserved: {currentStockData.reservedStock || 0}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-1">Notes</label>
                        <textarea
                            value={stockSettings.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Additional notes..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Update Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockSettingsModal; 