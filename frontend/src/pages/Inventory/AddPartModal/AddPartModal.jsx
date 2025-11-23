import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle } from 'lucide-react';
import api from '../../../config/ApiConfig';

const AddPartModal = ({ 
    isOpen, 
    onClose, 
    newPart,
    onInputChange,
    onSubmit,
    loading,
    success,
    error
}) => {
    const [partExists, setPartExists] = useState(false);
    const [checkingPart, setCheckingPart] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [objectUrl, setObjectUrl] = useState(null);
    const [imageError, setImageError] = useState(false);
    const [partId, setPartId] = useState(null);

    const fetchPresignedImageUrl = useCallback(async (id, originalUrl) => {
        try {
            console.log('Fetching presigned URL for part ID:', id);
            const response = await api.get(`/part/getPartPhoto/${id}`);
            if (response.data) {
                console.log('Presigned URL received:', response.data);
                setImagePreview(response.data);
                setImageError(false);
            } else {
                console.warn('No presigned URL returned, using original URL');
                setImagePreview(originalUrl);
                setImageError(false);
            }
        } catch (err) {
            console.error('Error fetching presigned photo URL:', err);
            // Fallback to original URL
            setImagePreview(originalUrl);
            setImageError(false);
        }
    }, []);

    // Function to check if part number exists and auto-fill fields
    const checkPartNumber = useCallback(async (partNumber) => {
        if (!partNumber) {
            setPartExists(false);
            return;
        }
        
        setCheckingPart(true);
        console.log('Checking part number:', partNumber);
        try {
            const token = localStorage.getItem('authToken');
            console.log('Auth token present:', !!token);
            
            console.log('Making API request to:', `/part/getPartDetailsByPartNumber/${partNumber}`);
            const response = await api.get(`/part/getPartDetailsByPartNumber/${partNumber}`);
            console.log('API response status:', response.status);
            console.log('API response headers:', response.headers);
            console.log('API response data:', response.data);
            
            const details = response.data;
            console.log('Part details:', details);
            
            if (details.exists) {
                console.log('Part exists, setting fields');
                setPartExists(true);
                // Auto-fill fields based on existing part
                onInputChange({
                    target: {
                        name: 'name',
                        value: details.name || ''
                    }
                });
                onInputChange({
                    target: {
                        name: 'description',
                        value: details.description || ''
                    }
                });
                onInputChange({
                    target: {
                        name: 'unitCost',
                        value: details.unitCost || ''
                    }
                });
                onInputChange({
                    target: {
                        name: 'brand',
                        value: details.brand || ''
                    }
                });
                onInputChange({
                    target: {
                        name: 'model',
                        value: details.model || ''
                    }
                });
                onInputChange({
                    target: {
                        name: 'partType',
                        value: details.partType || ''
                    }
                });
                onInputChange({
                    target: {
                        name: 'addToExisting',
                        value: true
                    }
                });
                
                // Store part ID for presigned URL fetching
                if (details.partId) {
                    setPartId(details.partId);
                }
                
                // Handle existing image URL if available
                if (details.partPhotoUrl && details.partPhotoUrl !== '0' && details.partPhotoUrl.trim() !== '') {
                    console.log('Part has existing image:', details.partPhotoUrl);
                    // Revoke any previous object URL if we created one
                    if (objectUrl) {
                        URL.revokeObjectURL(objectUrl);
                        setObjectUrl(null);
                    }
                    // Set the image URL (as string) instead of a File
                    onInputChange({
                        target: {
                            name: 'image',
                            value: details.partPhotoUrl
                        }
                    });
                    
                    // Check if it's an S3 URL that needs presigning
                    if (details.partPhotoUrl.includes('amazonaws.com/') && details.partId) {
                        // Fetch presigned URL
                        fetchPresignedImageUrl(details.partId, details.partPhotoUrl);
                    } else {
                        // Use URL directly if it's not S3
                        console.log('Setting image preview to:', details.partPhotoUrl);
                        setImagePreview(details.partPhotoUrl);
                        setImageError(false);
                    }
                } else {
                    console.log('No valid image URL found. partPhotoUrl:', details.partPhotoUrl);
                    // No existing image, clear preview
                    if (objectUrl) {
                        URL.revokeObjectURL(objectUrl);
                        setObjectUrl(null);
                    }
                    setImagePreview(null);
                    setImageError(false);
                    onInputChange({
                        target: {
                            name: 'image',
                            value: null
                        }
                    });
                }
            } else {
                console.log('Part does not exist');
                setPartExists(false);
                setPartId(null);
                onInputChange({
                    target: {
                        name: 'addToExisting',
                        value: false
                    }
                });
                // Clear image preview when part doesn't exist
                setImagePreview(null);
                onInputChange({
                    target: {
                        name: 'image',
                        value: null
                    }
                });
            }
        } catch (error) {
            console.error('Error checking part number:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            setPartExists(false);
            setPartId(null);
            onInputChange({
                target: {
                    name: 'addToExisting',
                    value: false
                }
            });
            // Clear image preview on error
            setImagePreview(null);
            onInputChange({
                target: {
                    name: 'image',
                    value: null
                }
            });
        } finally {
            setCheckingPart(false);
        }
    }, [onInputChange]);

    // Part-number input handlers (no debounce)
    const handlePartNumberChange = useCallback((e) => {
        onInputChange(e); // just update local state
    }, [onInputChange]);

    const handlePartNumberBlur = useCallback((e) => {
        const value = e.target.value;
        checkPartNumber(value);
    }, [checkPartNumber]);

    // Handle single image upload and preview
    const handleImageChange = useCallback((e) => {
        // Don't allow image upload if part exists (use existing image)
        if (partExists) {
            return;
        }
        
        const file = e.target.files && e.target.files[0];
        // Revoke previous object URL if we created one
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            setObjectUrl(null);
        }

        onInputChange({
            target: {
                name: 'image',
                value: file || null
            }
        });
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            setObjectUrl(url);
        } else {
            setImagePreview(null);
        }
    }, [onInputChange, objectUrl, partExists]);

    // Remove currently selected image
    const handleRemoveImage = useCallback(() => {
        // Don't allow removing image if part exists (must use existing image)
        if (partExists) {
            return;
        }
        
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            setObjectUrl(null);
        }
        setImagePreview(null);
        onInputChange({
            target: {
                name: 'image',
                value: null
            }
        });
    }, [onInputChange, objectUrl, partExists]);

    useEffect(() => {
        // If part exists, don't let this useEffect interfere with the image preview
        // The image preview is managed directly in checkPartNumber when part exists
        if (partExists) {
            return;
        }
        
        // If parent passes an image (string URL or File), show preview
        if (newPart && newPart.image) {
            // If the parent provided a File, create an object URL
            if (typeof newPart.image === 'string') {
                // Revoke previous if we created one
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                    setObjectUrl(null);
                }
                setImagePreview(newPart.image);
                setImageError(false);
            } else if (newPart.image instanceof File) {
                // Revoke previous if we created one
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
                const url = URL.createObjectURL(newPart.image);
                setImagePreview(url);
                setObjectUrl(url);
                setImageError(false);
                return () => {
                    // cleanup created url when component unmounts or new file arrives
                    if (url) URL.revokeObjectURL(url);
                };
            }
        } else if (!newPart?.image) {
            // Clear preview if no image
            setImagePreview(null);
            setImageError(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newPart, partExists]);

    // Cleanup on unmount: revoke any created object URL
    useEffect(() => {
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [objectUrl]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {partExists ? 'Add to Existing Part' : 'Add New Part'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {partExists ? 'Adding to existing part number. Other fields are locked.' : 'Fill in the details for the new part.'}
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
                    <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-md flex items-center">
                        <CheckCircle className="mr-2" size={16} />
                        Part number exists. Adding to existing part.
                    </div>
                )}

                {/* Checking Part Message */}
                {checkingPart && (
                    <div className="mb-4 p-3 bg-gray-100 text-gray-800 rounded-md">
                        Checking part number...
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Part Number *
                            </label>
                            <input
                                type="text"
                                name="partNumber"
                                value={newPart.partNumber || ''}
                                onChange={handlePartNumberChange}
                                onBlur={handlePartNumberBlur}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter part number"
                                required
                                disabled={checkingPart}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Serial Number *
                            </label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={newPart.serialNumber || ''}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter serial number"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={newPart.name || ''}
                                onChange={onInputChange}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${partExists ? 'bg-gray-50' : ''}`}
                                placeholder="Enter part name"
                                required
                                readOnly={partExists}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand
                            </label>
                            <input
                                type="text"
                                name="brand"
                                value={newPart.brand || ''}
                                onChange={onInputChange}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${partExists ? 'bg-gray-50' : ''}`}
                                placeholder="Enter brand"
                                readOnly={partExists}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Model
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={newPart.model || ''}
                                onChange={onInputChange}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${partExists ? 'bg-gray-50' : ''}`}
                                placeholder="Enter model"
                                readOnly={partExists}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Cost *
                            </label>
                            <input
                                type="number"
                                name="unitCost"
                                value={newPart.unitCost || ''}
                                onChange={onInputChange}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${partExists ? 'bg-gray-50' : ''}`}
                                placeholder="Enter unit cost"
                                min="0"
                                step="0.01"
                                required
                                readOnly={partExists}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={newPart.description || ''}
                            onChange={onInputChange}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${partExists ? 'bg-gray-50' : ''}`}
                            placeholder="Enter part description"
                            rows="3"
                            readOnly={partExists}
                        />
                    </div>

                    {/* Upload picture - custom file input and larger preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {partExists ? 'Part Image' : 'Upload picture'}
                        </label>
                        {partExists && (
                            <p className="text-xs text-gray-500 mb-2">
                                Using existing part image. Image upload is not required.
                            </p>
                        )}

                        {/* Hidden native input - we use a label/button so filename won't be displayed */}
                        <div className="flex items-center space-x-3">
                            {!partExists && (
                                <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    Select image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="sr-only" // hide from visual flow and screen readers handled by label
                                    />
                                </label>
                            )}

                            {imagePreview && !partExists && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="px-3 py-2 bg-red-50 text-red-700 border border-red-100 rounded-md text-sm hover:bg-red-100"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        {/* Larger, clearer preview area */}
                        <div className="mt-3">
                            <div className="w-full h-48 md:h-60 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                                {imagePreview && !imageError ? (
                                    <img
                                        src={imagePreview}
                                        alt="preview"
                                        className="w-full h-full object-contain"
                                        onError={() => {
                                            console.error('Failed to load image:', imagePreview);
                                            setImageError(true);
                                        }}
                                        onLoad={() => setImageError(false)}
                                    />
                                ) : imageError ? (
                                    <div className="text-sm text-red-400">Failed to load image</div>
                                ) : (
                                    <div className="text-sm text-gray-400">No image selected</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-100 text-red-800 rounded-md">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-100 text-green-800 rounded-md">
                            Part added successfully!
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6">
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
                            {loading ? 'Adding...' : checkingPart ? 'Checking...' : partExists ? 'Add to Existing Part' : 'Add Part'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPartModal;

