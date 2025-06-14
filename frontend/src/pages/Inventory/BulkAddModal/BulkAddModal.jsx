import React, { useState, useCallback, useEffect } from 'react';
import { X, Copy, Trash, Plus } from 'lucide-react';
import api from '../../../services/api';

const BulkAddModal = ({ 
    isOpen, 
    onClose, 
    bulkAddItems,
    onBulkItemChange,
    onSubmit,
    onAddBulkItem,
    onRemoveBulkItem,
    loading
}) => {
    const [partExists, setPartExists] = useState(false);
    const [checkingPart, setCheckingPart] = useState(false);

    // Function to check if part number exists and auto-fill fields
    const checkPartNumber = useCallback(async (partNumber, index) => {
        if (!partNumber) {
            setPartExists(false);
            return;
        }
        
        // Only check for master row (index 0)
        if (index !== 0) return;
        
        setCheckingPart(true);
        try {
            const response = await api.get(`/part/getPartDetailsByPartNumber/${partNumber}`);
            const details = response.data;
            
            if (details.exists) {
                setPartExists(true);
                // Auto-fill the fields for the master row
                onBulkItemChange(0, 'name', details.name || '');
                onBulkItemChange(0, 'description', details.description || '');
                onBulkItemChange(0, 'unitCost', details.unitCost || 0);
                onBulkItemChange(0, 'brand', details.brand || '');
                onBulkItemChange(0, 'model', details.model || '');
                onBulkItemChange(0, 'addToExisting', true);
            } else {
                setPartExists(false);
                onBulkItemChange(0, 'addToExisting', false);
            }
        } catch (error) {
            console.error('Error checking part number:', error);
            setPartExists(false);
            onBulkItemChange(0, 'addToExisting', false);
        } finally {
            setCheckingPart(false);
        }
    }, [onBulkItemChange]);

    // Handle part number input change with proper debouncing
    const handlePartNumberChange = useCallback((index, value) => {
        onBulkItemChange(index, 'partNumber', value);
        
        // Only check for master row (index 0)
        if (index === 0) {
            // Clear any existing timeout
            if (window.bulkPartNumberCheckTimeout) {
                clearTimeout(window.bulkPartNumberCheckTimeout);
            }
            
            // Set a new timeout
            window.bulkPartNumberCheckTimeout = setTimeout(() => {
                checkPartNumber(value, index);
            }, 500);
        }
    }, [onBulkItemChange, checkPartNumber]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (window.bulkPartNumberCheckTimeout) {
                clearTimeout(window.bulkPartNumberCheckTimeout);
            }
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-5xl w-full h-[95vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {partExists ? 'Add to Existing Part' : 'Bulk Add Parts with Same Details'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            First row is the master - changes will copy to all rows. Serial Number can be different per row.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            💡 Use this for adding inventory stock. Warranty information can be added later when parts are sold to customers.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Part Exists Message */}
                {partExists && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-md">
                        Adding to existing part number. Other fields have been auto-filled and are locked.
                    </div>
                )}

                {/* Checking Part Message */}
                {checkingPart && (
                    <div className="mb-4 p-3 bg-gray-100 text-gray-800 rounded-md">
                        Checking part number...
                    </div>
                )}

                <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-auto mb-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center">
                                            Part Number
                                            <Copy size={12} className="ml-1 text-blue-500" title="Master row copies to all" />
                                        </div>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center">
                                            Brand
                                            <Copy size={12} className="ml-1 text-blue-500" />
                                        </div>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center">
                                            Model
                                            <Copy size={12} className="ml-1 text-blue-500" />
                                        </div>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center">
                                            Description
                                            <Copy size={12} className="ml-1 text-blue-500" />
                                        </div>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center">
                                            Cost
                                            <Copy size={12} className="ml-1 text-blue-500" />
                                        </div>
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial No.</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bulkAddItems.map((item, index) => (
                                    <tr key={index} className={index === 0 ? 'bg-blue-50 border-l-4 border-blue-500' : ''}>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center">
                                                {index === 0 && <span className="text-blue-600 text-xs mr-1"></span>}
                                                <input
                                                    type="text"
                                                    value={item.partNumber}
                                                    onChange={(e) => handlePartNumberChange(index, e.target.value)}
                                                    className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''}`}
                                                    placeholder="Part number"
                                                    required
                                                    disabled={checkingPart && index === 0}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.brand || ''}
                                                onChange={(e) => onBulkItemChange(index, 'brand', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''} ${partExists && index === 0 ? 'bg-gray-50' : ''}`}
                                                placeholder="Brand"
                                                readOnly={partExists && index === 0}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.model || ''}
                                                onChange={(e) => onBulkItemChange(index, 'model', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''} ${partExists && index === 0 ? 'bg-gray-50' : ''}`}
                                                placeholder="Model"
                                                readOnly={partExists && index === 0}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => onBulkItemChange(index, 'description', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''} ${partExists && index === 0 ? 'bg-gray-50' : ''}`}
                                                placeholder="Description"
                                                readOnly={partExists && index === 0}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={item.unitCost}
                                                onChange={(e) => onBulkItemChange(index, 'unitCost', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''} ${partExists && index === 0 ? 'bg-gray-50' : ''}`}
                                                min="0"
                                                step="0.01"
                                                readOnly={partExists && index === 0}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.serialNumber}
                                                onChange={(e) => onBulkItemChange(index, 'serialNumber', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                placeholder="Serial number"
                                                required
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex space-x-1">
                                                {index === 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={onAddBulkItem}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Add another row"
                                                        disabled={checkingPart}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemoveBulkItem(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Remove this row"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || checkingPart}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${(loading || checkingPart) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Adding...' : checkingPart ? 'Checking...' : partExists ? `Add ${bulkAddItems.length} Items to Existing Part` : `Add ${bulkAddItems.length} Items`}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkAddModal; 