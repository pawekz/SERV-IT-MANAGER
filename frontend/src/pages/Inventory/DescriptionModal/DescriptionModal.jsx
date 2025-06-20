import React from 'react';
import { X, Package, Tag, Box, Layers, AlertTriangle, Hash, User, Calendar, FileText } from 'lucide-react';

const DescriptionModal = ({
                              isOpen,
                              onClose,
                              title,
                              content,
                              part
                          }) => {
    if (!isOpen) return null;

    // Helper function to format number with commas and decimals
    const formatNumber = (number, includeDecimals = false) => {
        if (number == null) return '-';
        
        // For prices, use 2 decimal places
        if (includeDecimals) {
            return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        
        // For other numbers (like stock), just use commas
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 pr-4">Name: {title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>
                {part && (
                    <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-gray-700">
                        <div className="flex items-center">
                            <Package size={16} className="mr-2 text-blue-600" />
                            <span><span className="font-semibold">Part Group:</span> {part.partNumber || part.sku || '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <Tag size={16} className="mr-2 text-green-600" />
                            <span><span className="font-semibold">Brand:</span> {part.brand || '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <Box size={16} className="mr-2 text-purple-600" />
                            <span><span className="font-semibold">Model:</span> {part.model || '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2 text-yellow-600 font-bold text-lg">₱</span>
                            <span><span className="font-semibold">Price:</span> {part.unitCost != null ? formatNumber(part.unitCost, true) : '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <Layers size={16} className="mr-2 text-indigo-600" />
                            <span><span className="font-semibold">Current Stock:</span> {part.currentStock != null ? formatNumber(part.currentStock) : '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <AlertTriangle size={16} className="mr-2 text-orange-600" />
                            <span><span className="font-semibold">Low Stock Threshold:</span> {part.lowStockThreshold != null ? formatNumber(part.lowStockThreshold) : '-'}</span>
                        </div>
                        {/*<div className="flex items-center">
                            <Hash size={16} className="mr-2 text-red-600" />
                            <span><span className="font-semibold">Serial Number:</span> {part.serialNumber || '-'}</span>
                        </div>*/}
                        <div className="flex items-center">
                            <User size={16} className="mr-2 text-teal-600" />
                            <span><span className="font-semibold">Added By:</span> {part.addedBy || '-'}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar size={16} className="mr-2 text-pink-600" />
                            <span><span className="font-semibold">Date Added:</span> {part.dateAdded ? new Date(part.dateAdded).toLocaleDateString() : '-'}</span>
                        </div>
                        {/*{part.serialNumber && (
                            <>
                                <div><span className="font-semibold">Warranty Expiration:</span> {part.warrantyExpiration ? new Date(part.warrantyExpiration).toLocaleDateString() : '-'}</div>
                                <div><span className="font-semibold">Is Customer Purchased:</span> {part.isCustomerPurchased ? 'Yes' : 'No'}</div>
                            </>
                        )}*/}
                    </div>
                )}
                <div className="text-gray-600 overflow-y-auto flex-grow" style={{ maxHeight: 'calc(85vh - 120px)' }}>
                    <div className="flex items-start">
                        <FileText size={16} className="mr-2 text-gray-600 mt-1 flex-shrink-0" />
                        <p className="whitespace-pre-wrap break-words">Description: {content}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end pt-2 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptionModal;