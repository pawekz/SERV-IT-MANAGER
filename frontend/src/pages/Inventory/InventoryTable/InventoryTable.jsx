import React from 'react';
import { ChevronDown, Pen, Trash, Eye, Settings } from 'lucide-react';

const InventoryTable = ({
    paginatedItems,
    searchQuery,
    expandedGroups,
    isAdmin,
    onToggleGroupExpansion,
    onDescriptionClick,
    onStockSettings,
    onEditClick,
    onDeletePart,
    highlightText
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                                <ChevronDown size={14} className="mr-1 text-gray-400" />
                                Part Number Groups
                            </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description / Serial Numbers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.length > 0 ? (
                        paginatedItems.map((item) => (
                            <React.Fragment key={item.partNumber}>
                                {/* Main Group Row */}
                                <tr className="group transition-all duration-200 ease-in-out hover:bg-gray-50 border-l-4 border-blue-500 cursor-pointer" 
                                    onClick={() => onToggleGroupExpansion(item.partNumber)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <button
                                                className="mr-3 p-1 hover:bg-gray-200 rounded-md transition-all duration-200 ease-in-out"
                                                title={expandedGroups.has(item.partNumber) ? "Collapse" : "Expand"}
                                            >
                                                <ChevronDown 
                                                    size={16} 
                                                    className={`transform transition-transform duration-200 ease-in-out ${
                                                        expandedGroups.has(item.partNumber) ? 'rotate-180' : 'rotate-0'
                                                    }`}
                                                />
                                            </button>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {highlightText(item.partNumber, searchQuery)}
                                                </div>
                                                <div className="text-sm text-gray-500">{item.category} • {item.totalParts} items</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                            <span className="block">Brand: {item.brand || '-'}</span>
                                            <span className="block">Model: {item.model || '-'}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDescriptionClick(item);
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                        >
                                            View details
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <div className="flex items-center mb-1">
                                                <span className={`px-2 py-1 text-xs rounded-full ${item.availability?.color}`}>
                                                    {item.availability?.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Available: {item.availableStock} | Threshold: {item.lowStockThreshold} | Reserved: {item.reservedStock}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3 items-center">
                                            {isAdmin && (
                                                <div className="relative group">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStockSettings(item.partNumber);
                                                        }}
                                                        className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 hover:text-purple-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                        title="Stock Settings & Thresholds"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                        Configure stock settings & low stock thresholds
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center text-gray-400">
                                                    {expandedGroups.has(item.partNumber) ? (
                                                        <>
                                                            <ChevronDown size={14} className="transform rotate-180 transition-transform duration-200 ease-in-out" />
                                                            <span className="text-xs text-gray-500 ml-1 transition-opacity duration-200">Expanded</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown size={14} className="transform rotate-0 transition-transform duration-200 ease-in-out" />
                                                            <span className="text-xs text-gray-500 ml-1 transition-opacity duration-200">Click to view {item.totalParts} items</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                {/* Individual Items (Accordion Content) */}
                                {expandedGroups.has(item.partNumber) && item.allParts && (
                                    item.allParts.map((part, index) => (
                                        <tr key={`${item.partNumber}-${part.id}`} className="animate-in slide-in-from-top-1 duration-200 ease-in-out bg-gray-50 border-l-4 border-gray-300 hover:bg-gray-100 transition-colors duration-150">
                                            <td className="px-6 py-3 whitespace-nowrap pl-12">
                                                <div className="text-sm text-gray-700">
                                                    <span className="font-medium">Item #{index + 1}</span>
                                                    <div className="text-xs text-gray-500">ID: {part.id}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="text-sm text-gray-700">
                                                    <div className="font-medium">
                                                        Serial: {highlightText(part.serialNumber, searchQuery)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Added: {part.dateAdded ? new Date(part.dateAdded).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        By: {part.addedBy || 'Unknown'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    <div className="flex items-center">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            part.isReserved ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {part.isReserved ? 'Reserved' : 'Available'}
                                                        </span>
                                                    </div>
                                                    {part.isReserved && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Reserved for: {part.reservedForTicketId || 'Unknown'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {isAdmin ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEditClick(part);
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                                                                title="Edit this individual part"
                                                            >
                                                                <Pen size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeletePart(part.id);
                                                                }}
                                                                className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                                                title="Delete this individual part"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDescriptionClick(part);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150"
                                                            title="View details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </React.Fragment>
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
    );
};

export default InventoryTable; 