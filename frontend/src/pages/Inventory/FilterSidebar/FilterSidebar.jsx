import React, { useState } from 'react';
import { X, Filter, SlidersHorizontal } from 'lucide-react';

const FilterSidebar = ({ isOpen, onClose, filters, onFilterChange, onClearFilters }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearAll = () => {
        const clearedFilters = {
            stockStatus: 'all',
            priceRange: { min: '', max: '' },
            dateRange: { start: '', end: '' }
        };
        setLocalFilters(clearedFilters);
        onClearFilters();
    };

    const activeFiltersCount = Object.values(localFilters).filter(v => {
        if (typeof v === 'object' && v !== null) {
            return Object.values(v).some(val => val !== '' && val !== null);
        }
        return v !== '' && v !== 'all' && v !== null;
    }).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div 
                className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <SlidersHorizontal size={20} className="mr-2 text-gray-700" />
                            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                            {activeFiltersCount > 0 && (
                                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Stock Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock Status
                        </label>
                        <select
                            value={localFilters.stockStatus || 'all'}
                            onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="in-stock">In Stock</option>
                            <option value="low-stock">Low Stock</option>
                            <option value="out-of-stock">Out of Stock</option>
                        </select>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={localFilters.priceRange?.min || ''}
                                onChange={(e) => handleFilterChange('priceRange', {
                                    ...localFilters.priceRange,
                                    min: e.target.value
                                })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={localFilters.priceRange?.max || ''}
                                onChange={(e) => handleFilterChange('priceRange', {
                                    ...localFilters.priceRange,
                                    max: e.target.value
                                })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Added
                        </label>
                        <div className="space-y-2">
                            <input
                                type="date"
                                value={localFilters.dateRange?.start || ''}
                                onChange={(e) => handleFilterChange('dateRange', {
                                    ...localFilters.dateRange,
                                    start: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={localFilters.dateRange?.end || ''}
                                onChange={(e) => handleFilterChange('dateRange', {
                                    ...localFilters.dateRange,
                                    end: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;

