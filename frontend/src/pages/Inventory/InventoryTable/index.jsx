import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Pen, Trash, Eye, Settings, X, Upload, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../config/ApiConfig';
import { usePartPhoto } from '../../../hooks/usePartPhoto.js';

// Image validation utility
const validateImageFile = (file) => {
    if (!file) return { valid: true };
    
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.png', '.jpg', '.jpeg'];
    
    // Check MIME type
    const mimeType = file.type?.toLowerCase();
    if (!validMimeTypes.includes(mimeType)) {
        return {
            valid: false,
            error: 'Only PNG, JPG, and JPEG files are accepted.'
        };
    }
    
    // Check file extension (case-insensitive)
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
                <span className="text-xs text-gray-400">No Photo</span>
            </div>
        );
    }

    // Add cache-busting query parameter if cacheBuster is provided to force browser refresh
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
            
            // Invalidate React Query cache for this part photo
            queryClient.invalidateQueries({ queryKey: ['part-photo', partId] });
            
            // Update timestamp to force re-render
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
            
            // Don't set Content-Type manually - axios will set it with boundary
            await api.post(`/part/updatePartPhoto/${partId}`, formData);
            
            // Invalidate React Query cache for this part photo to force refresh
            queryClient.invalidateQueries({ queryKey: ['part-photo', partId] });
            
            // Update timestamp to force re-render of PartPhoto component
            setPhotoUpdateTimestamp(prev => ({ ...prev, [partId]: Date.now() }));
            
            // Wait for refresh to complete so the new photo URL is available
            if (onRefresh) {
                await onRefresh();
                // Small delay to ensure state updates propagate and cache is cleared
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
            
            // Handle image validation errors
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
        
        // Clear previous validation error
        setImageValidationError(null);
        
        // Validate image file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            setImageValidationError(validation.error);
            // Clear the file input
            e.target.value = '';
            // Clear preview
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
                setFilePreview(null);
            }
            setSelectedFile(null);
            return;
        }
        
        // Create preview
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
    
    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    return (
        <>
        <div className="overflow-x-auto max-w-full">
            <table className="w-full table-auto max-w-full">
                <thead>
                    <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                                <ChevronDown size={14} className="mr-1 text-gray-400" />
                                Part Number Groups
                            </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Photo
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
                                    <td className="px-6 py-4 whitespace-normal break-words">
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
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                // Get photo from first part in the group
                                                const firstPart = item.allParts && item.allParts.length > 0 ? item.allParts[0] : null;
                                                const hasPhoto = firstPart?.partPhotoUrl && firstPart.partPhotoUrl !== '0' && firstPart.partPhotoUrl.trim() !== '';
                                                
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <PartPhoto 
                                                            key={`photo-${firstPart?.id}-${firstPart?.partPhotoUrl || 'no-photo'}-${photoUpdateTimestamp[firstPart?.id] || 0}`}
                                                            partId={firstPart?.id} 
                                                            photoUrl={firstPart?.partPhotoUrl} 
                                                            size="md"
                                                            onClick={openImageModal}
                                                            cacheBuster={photoUpdateTimestamp[firstPart?.id] || 0}
                                                        />
                                                        {isAdmin && firstPart && (
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
                                                                {hasPhoto && (
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
                                                    </div>
                                                );
                                            })()}
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
                                    <td className="px-6 py-4 whitespace-normal break-words">
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
                                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium">
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
                                            <td className="px-6 py-3 whitespace-normal break-words pl-12" colSpan="2">
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
                                            <td className="px-6 py-3 whitespace-normal break-words">
                                                <div className="text-sm text-gray-700">
                                                    <div className="flex items-center">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
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
                                                    </div>
                                                    {part.isReserved && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Reserved for: {part.reservedForTicketId || 'Unknown'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 whitespace-normal break-words text-sm font-medium">
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
                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                No inventory items found. Add a new part to get started.
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