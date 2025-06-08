import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const LowStockModal = ({ 
    isOpen, 
    onClose, 
    lowStockItems,
    onConfigureStock
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-yellow-600">
                        <AlertTriangle size={20} className="mr-2" />
                        <h2 className="text-xl font-semibold">Low Stock Alert</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4">
                    {lowStockItems.length > 0 ? (
                        <p className="text-gray-700">The following part numbers are running low on stock:</p>
                    ) : (
                        <p className="text-gray-700">No low stock items found. All inventory levels are currently adequate.</p>
                    )}
                </div>

                {lowStockItems.length > 0 && (
                    <div className="overflow-y-auto max-h-60">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Alert Level</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {lowStockItems.map(item => (
                                    <tr key={item.partNumber} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{item.partNumber}</td>
                                        <td className="px-4 py-3">{item.partName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                item.currentAvailableStock <= 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                                {item.currentAvailableStock} available
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                item.alertLevel === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                                item.alertLevel === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                'bg-yellow-100 text-yellow-600'
                                            }`}>
                                                {item.alertLevel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => onConfigureStock(item.partNumber)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Configure
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LowStockModal; 