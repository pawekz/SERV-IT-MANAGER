import React from 'react';
import { X, Copy, Trash, Plus } from 'lucide-react';

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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-5xl w-full h-[95vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Bulk Add Parts with Same Details</h2>
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
                                            Name
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
                                                    onChange={(e) => onBulkItemChange(index, 'partNumber', e.target.value)}
                                                    className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''}`}
                                                    placeholder="Part number"
                                                    required
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => onBulkItemChange(index, 'name', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''}`}
                                                placeholder="Part name"
                                                required
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => onBulkItemChange(index, 'description', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''}`}
                                                placeholder="Description"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={item.unitCost}
                                                onChange={(e) => onBulkItemChange(index, 'unitCost', e.target.value)}
                                                className={`w-full px-2 py-1 border border-gray-300 rounded text-sm ${index === 0 ? 'font-semibold bg-blue-50' : ''}`}
                                                min="0"
                                                step="0.01"
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
                                disabled={loading}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Adding...' : `Add ${bulkAddItems.length} Items`}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkAddModal; 