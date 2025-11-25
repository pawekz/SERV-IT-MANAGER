import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Pen, Trash, Eye, Settings, X, Upload, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Package, Hash } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../config/ApiConfig';
import { usePartPhoto } from '../../../hooks/usePartPhoto.js';

// Image validation utility
const validateImageFile = (file) => {
    if (!file) return { valid: true };
    
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.png', '.jpg', '.jpeg'];
    
    const mimeType = file.type?.toLowerCase();
    if (!validMimeTypes.includes(mimeType)) {
        return {
            valid: false,
            error: 'Only PNG, JPG, and JPEG files are accepted.'
        };
    }
    
    const fileName = file.name?.toLowerCase() || '';
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    if (!validExtensions.includes(extension)) {
        return {
            valid: false,
            error: 'Only PNG, JPG, and JPEG files are accepted.'
        };
    }
    
    return { valid: true };
};

// Component to handle part photo display with presigned URL fetching
const PartPhoto = ({ partId, photoUrl, size = 'md', onClick, cacheBuster = 0 }) => {
    const { data: src, isLoading, isError } = usePartPhoto(partId, photoUrl);

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;

    if (isLoading) {
        return (
            <div className={`${sizeClass} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse`}>
                <span className="text-xs text-gray-400">Loading...</span>
            </div>
        );
    }

    if (isError || !src) {
        return (
            <div className={`${sizeClass} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center`}>
                <Package size={size === 'sm' ? 16 : 20} className="text-gray-400" />
            </div>
        );
    }

    const imageSrc = cacheBuster > 0 ? `${src}${src.includes('?') ? '&' : '?'}t=${cacheBuster}` : src;

    return (
        <img 
            key={`img-${partId}-${cacheBuster}`}
            src={imageSrc} 
            alt="Part photo"
            className={`${sizeClass} object-cover rounded-lg border border-gray-200 shadow-sm ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onError={() => {}}
            onClick={onClick ? () => onClick(src) : undefined}
        />
    );
};

// Sortable Table Header Component
const SortableHeader = ({ children, sortKey, currentSort, onSort, className = '' }) => {
    const isActive = currentSort.key === sortKey;
    const sortDirection = isActive ? currentSort.direction : null;

    return (
        <th 
            className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                {children}
                <div className="flex flex-col">
                    <ArrowUp 
                        size={10} 
                        className={`text-gray-400 ${sortDirection === 'asc' ? 'text-blue-600' : ''}`}
                        style={{ marginBottom: '-2px' }}
                    />
                    <ArrowDown 
                        size={10} 
                        className={`text-gray-400 ${sortDirection === 'desc' ? 'text-blue-600' : ''}`}
                    />
                </div>
            </div>
        </th>
    );
};

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
    highlightText,
    onRefresh
}) => {
    const queryClient = useQueryClient();
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [partToDeletePhoto, setPartToDeletePhoto] = useState(null);
    const [updatingPhoto, setUpdatingPhoto] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    const [partToUpdatePhoto, setPartToUpdatePhoto] = useState(null);
    const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [imageValidationError, setImageValidationError] = useState(null);
    const [photoUpdateTimestamp, setPhotoUpdateTimestamp] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'partNumber', direction: 'asc' });

    // Sorting function
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Sort items based on current sort configuration
    const sortedItems = React.useMemo(() => {
        const sorted = [...paginatedItems];
        sorted.sort((a, b) => {
            let aVal, bVal;
            
            switch (sortConfig.key) {
                case 'partNumber':
                    aVal = a.partNumber?.toLowerCase() || '';
                    bVal = b.partNumber?.toLowerCase() || '';
                    break;
                case 'name':
                    aVal = a.name?.toLowerCase() || '';
                    bVal = b.name?.toLowerCase() || '';
                    break;
                case 'stock':
                    aVal = a.availableStock || 0;
                    bVal = b.availableStock || 0;
                    break;
                case 'cost':
                    aVal = a.unitCost || 0;
                    bVal = b.unitCost || 0;
                    break;
                case 'status':
                    aVal = a.availability?.status || '';
                    bVal = b.availability?.status || '';
                    break;
                default:
                    return 0;
            }
            
            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc' 
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            } else {
                return sortConfig.direction === 'asc' 
                    ? aVal - bVal
                    : bVal - aVal;
            }
        });
        
        return sorted;
    }, [paginatedItems, sortConfig]);

    const openImageModal = (imageSrc) => {
        setSelectedImageSrc(imageSrc);
        setImageModalOpen(true);
    };

    const closeImageModal = () => {
        setImageModalOpen(false);
        setSelectedImageSrc(null);
    };

    const handleDeletePhoto = async (partId, partNumber) => {
        setDeletingPhoto(true);
        try {
            await api.delete(`/part/removePartPhoto/${partId}`);
            queryClient.invalidateQueries({ queryKey: ['part-photo', partId] });
            setPhotoUpdateTimestamp(prev => ({ ...prev, [partId]: Date.now() }));
            if (onRefresh) {
                await onRefresh();
            }
            setDeleteConfirmOpen(false);
            setPartToDeletePhoto(null);
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo. Please try again.');
        } finally {
            setDeletingPhoto(false);
        }
    };

    const handleUpdatePhoto = async (partId, file) => {
        if (!file) return;
        
        setUpdatingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            await api.post(`/part/updatePartPhoto/${partId}`, formData);
            queryClient.invalidateQueries({ queryKey: ['part-photo', partId] });
            setPhotoUpdateTimestamp(prev => ({ ...prev, [partId]: Date.now() }));
            
            if (onRefresh) {
                await onRefresh();
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            setPartToUpdatePhoto(null);
            setSelectedFile(null);
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
            setFilePreview(null);
            setUploadConfirmOpen(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error updating photo:', error);
            let errorMessage = 'Failed to update photo. Please try again.';
            
            if (error.response?.status === 400 || error.response?.status === 500) {
                const responseData = error.response.data;
                if (typeof responseData === 'string' && (responseData.includes('Only PNG') || responseData.includes('Invalid photo type') || responseData.includes('PNG, JPG, and JPEG'))) {
                    errorMessage = 'Only PNG, JPG, and JPEG files are accepted.';
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                } else if (responseData?.message) {
                    errorMessage = responseData.message;
                }
            }
            
            alert(errorMessage);
        } finally {
            setUpdatingPhoto(false);
        }
    };

    const openDeleteConfirm = (partId, partNumber) => {
        setPartToDeletePhoto({ id: partId, partNumber });
        setDeleteConfirmOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !partToUpdatePhoto) {
            return;
        }
        
        setImageValidationError(null);
        const validation = validateImageFile(file);
        if (!validation.valid) {
            setImageValidationError(validation.error);
            e.target.value = '';
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
                setFilePreview(null);
            }
            setSelectedFile(null);
            return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setFilePreview(previewUrl);
        setUploadConfirmOpen(true);
    };
    
    const confirmUploadPhoto = () => {
        if (selectedFile && partToUpdatePhoto) {
            handleUpdatePhoto(partToUpdatePhoto.id, selectedFile);
        }
    };
    
    const cancelUploadPhoto = () => {
        setUploadConfirmOpen(false);
        setSelectedFile(null);
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Out of Stock':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Low Stock':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Normal':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Good':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <>
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
            <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                        <SortableHeader 
                            sortKey="partNumber" 
                            currentSort={sortConfig} 
                            onSort={handleSort}
                            className="pl-6"
                        >
                            <div className="flex items-center gap-2">
                                <Hash size={14} />
                                Part Number
                            </div>
                        </SortableHeader>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Package size={14} />
                                Photo
                            </div>
                        </th>
                        <SortableHeader 
                            sortKey="name" 
                            currentSort={sortConfig} 
                            onSort={handleSort}
                        >
                            Product Info
                        </SortableHeader>
                        <SortableHeader 
                            sortKey="stock" 
                            currentSort={sortConfig} 
                            onSort={handleSort}
                        >
                            Stock
                        </SortableHeader>
                        <SortableHeader 
                            sortKey="cost" 
                            currentSort={sortConfig} 
                            onSort={handleSort}
                        >
                            <div className="flex items-center gap-2">
                                <span>Unit Cost (Php)</span>
                            </div>
                        </SortableHeader>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedItems.length > 0 ? (
                        sortedItems.map((item) => {
                            const firstPart = item.allParts && item.allParts.length > 0 ? item.allParts[0] : null;
                            const isExpanded = expandedGroups.has(item.partNumber);
                            
                            return (
                                <React.Fragment key={item.partNumber}>
                                    {/* Main Group Row */}
                                    <tr 
                                        className="group transition-all duration-200 hover:bg-blue-50/50 border-l-4 border-blue-500 cursor-pointer bg-white"
                                        onClick={() => onToggleGroupExpansion(item.partNumber)}
                                    >
                                        <td className="pl-6 pr-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="p-1.5 hover:bg-blue-100 rounded-md transition-all group"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onToggleGroupExpansion(item.partNumber);
                                                    }}
                                                    title={isExpanded ? "Collapse" : "Expand"}
                                                >
                                                    <ChevronDown 
                                                        size={16} 
                                                        className={`transform transition-transform duration-200 text-gray-600 group-hover:text-blue-600 ${
                                                            isExpanded ? 'rotate-180' : ''
                                                        }`}
                                                    />
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-900 truncate">
                                                        {highlightText(item.partNumber, searchQuery)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Package size={12} />
                                                            {item.totalParts} {item.totalParts === 1 ? 'item' : 'items'}
                                                        </span>
                                                        {item.suppliersCount > 0 && (
                                                            <span className="text-gray-400">•</span>
                                                        )}
                                                        {item.suppliersCount > 0 && (
                                                            <span>{item.suppliersCount} supplier{item.suppliersCount > 1 ? 's' : ''}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                {firstPart && (
                                                    <>
                                                        <PartPhoto 
                                                            key={`photo-${firstPart.id}-${photoUpdateTimestamp[firstPart.id] || 0}`}
                                                            partId={firstPart.id} 
                                                            photoUrl={firstPart.partPhotoUrl} 
                                                            size="md"
                                                            onClick={openImageModal}
                                                            cacheBuster={photoUpdateTimestamp[firstPart.id] || 0}
                                                        />
                                                        {isAdmin && (
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPartToUpdatePhoto({ id: firstPart.id, partNumber: item.partNumber });
                                                                        fileInputRef.current?.click();
                                                                    }}
                                                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Update photo"
                                                                    disabled={updatingPhoto}
                                                                >
                                                                    <Upload size={14} />
                                                                </button>
                                                                {firstPart.partPhotoUrl && firstPart.partPhotoUrl !== '0' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteConfirm(firstPart.id, item.partNumber);
                                                                        }}
                                                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                                        title="Delete photo"
                                                                        disabled={deletingPhoto}
                                                                    >
                                                                        <Trash size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                                                    {item.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1.5 space-y-0.5">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">Brand:</span>
                                                        <span className="font-medium text-gray-700">{item.brand || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-500">Model:</span>
                                                        <span className="font-medium text-gray-700">{item.model || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDescriptionClick(item);
                                                    }}
                                                    className="text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium inline-flex items-center gap-1 transition-colors"
                                                >
                                                    View full details
                                                    <ChevronRight size={12} className="inline" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="space-y-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(item.availability?.status)}`}>
                                                    {item.availability?.status}
                                                </span>
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-20 text-gray-500">Available:</span>
                                                        <span className="font-bold text-gray-900 text-sm">{item.availableStock}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-20 text-gray-500">Reserved:</span>
                                                        <span className="font-semibold text-gray-700">{item.reservedStock || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-20 text-gray-500">Threshold:</span>
                                                        <span className="font-semibold text-gray-700">{item.lowStockThreshold}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    Php {item.unitCost?.toFixed(2) || '0.00'}
                                                </div>
                                                {item.unitCost && item.availableStock > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Total: Php {(item.unitCost * item.availableStock).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onStockSettings(item.partNumber);
                                                        }}
                                                        className="p-2 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-lg transition-colors"
                                                        title="Stock Settings"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDescriptionClick(item);
                                                    }}
                                                    className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Individual Items (Accordion Content) */}
                                    {isExpanded && item.allParts && (
                                        item.allParts.map((part, index) => (
                                            <tr 
                                                key={`${item.partNumber}-${part.id}`} 
                                                className="bg-gray-50/80 border-l-4 border-gray-300 hover:bg-gray-100 transition-colors"
                                            >
                                                <td className="pl-16 pr-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-700">Item #{index + 1}</span>
                                                        <div className="text-xs text-gray-500">ID: {part.id}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-center">
                                                        <PartPhoto 
                                                            partId={part.id} 
                                                            photoUrl={part.partPhotoUrl} 
                                                            size="sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm space-y-1">
                                                        <div className="font-medium text-gray-900">
                                                            Serial: {highlightText(part.serialNumber || 'N/A', searchQuery)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 space-y-0.5">
                                                            {part.dateAdded && (
                                                                <div>Added: {new Date(part.dateAdded).toLocaleDateString()}</div>
                                                            )}
                                                            {part.addedBy && (
                                                                <div>By: {part.addedBy}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        part.isReserved 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : (part.isCustomerPurchased || part.datePurchasedByCustomer)
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {part.isReserved 
                                                            ? 'Reserved' 
                                                            : (part.isCustomerPurchased || part.datePurchasedByCustomer)
                                                                ? 'Purchased'
                                                                : 'Available'}
                                                    </span>
                                                    {part.isReserved && part.reservedForTicketId && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Ticket: {part.reservedForTicketId}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-700">
                                                        Php {part.unitCost?.toFixed(2) || '0.00'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        {isAdmin ? (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEditClick(part);
                                                                    }}
                                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Pen size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onDeletePart(part.id);
                                                                    }}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDescriptionClick(part);
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="View details"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                                        <Package size={48} className="text-gray-400" />
                                    </div>
                                    <p className="text-gray-700 font-semibold text-lg mb-1">No inventory items found</p>
                                    <p className="text-sm text-gray-500">Try adjusting your filters or add a new part to get started</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Hidden file input for photo update */}
        <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="hidden"
        />

        {/* Image Modal */}
        {imageModalOpen && selectedImageSrc && (
            <div 
                className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" 
                onClick={closeImageModal}
                role="dialog"
                aria-modal="true"
            >
                <div 
                    className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm z-10"
                        onClick={closeImageModal}
                        aria-label="Close image viewer"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={selectedImageSrc}
                        alt="Part photo - full size"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                        onError={(e) => {
                            console.error('Error loading full-size image');
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            </div>
        )}

        {/* Upload Photo Confirmation Modal */}
        {uploadConfirmOpen && partToUpdatePhoto && selectedFile && (
            <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
                onClick={cancelUploadPhoto}
                role="dialog"
                aria-modal="true"
            >
                <div 
                    className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <AlertCircle size={20} className="mr-2 text-blue-600" />
                            Confirm Upload Photo
                        </h3>
                        <button
                            onClick={cancelUploadPhoto}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={updatingPhoto}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    
                    {imageValidationError && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md flex items-center">
                            <AlertCircle size={16} className="mr-2" />
                            <span className="text-sm">{imageValidationError}</span>
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-3">
                            Are you sure you want to upload this photo for part <span className="font-medium">{partToUpdatePhoto.partNumber}</span>?
                        </p>
                        {filePreview && (
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                <div className="w-full h-48 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                                    <img
                                        src={filePreview}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">File: {selectedFile.name}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={cancelUploadPhoto}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            disabled={updatingPhoto}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmUploadPhoto}
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                            disabled={updatingPhoto || !!imageValidationError}
                        >
                            {updatingPhoto ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Photo Confirmation Modal */}
        {deleteConfirmOpen && partToDeletePhoto && (
            <div 
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
                onClick={() => {
                    setDeleteConfirmOpen(false);
                    setPartToDeletePhoto(null);
                }}
                role="dialog"
                aria-modal="true"
            >
                <div 
                    className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-red-600 flex items-center">
                            <AlertCircle size={20} className="mr-2" />
                            Delete Photo
                        </h3>
                        <button
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setPartToDeletePhoto(null);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={deletingPhoto}
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to delete the photo for part <span className="font-medium">{partToDeletePhoto.partNumber}</span>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setDeleteConfirmOpen(false);
                                setPartToDeletePhoto(null);
                            }}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            disabled={deletingPhoto}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDeletePhoto(partToDeletePhoto.id, partToDeletePhoto.partNumber)}
                            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                            disabled={deletingPhoto}
                        >
                            {deletingPhoto ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default InventoryTable;
