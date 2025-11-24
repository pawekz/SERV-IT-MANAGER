import React, {useEffect, useState, useMemo} from "react";
import {ChevronLeft, ChevronRight, X} from "lucide-react"; // removed unused Upload, SquareX
import WarrantyStepper from "../WarrantyStepper/WarrantyStepper.jsx";
import WarrantyReceive from "../WarrantyRecieve/WarrantyReceive.jsx";
import Toast from "../Toast/Toast.jsx";
import api from '../../config/ApiConfig';
import { useWarrantyPhoto } from '../../hooks/useWarrantyPhoto';

function TicketWarrantyImage({ path, alt, className }) {
    const { data: src, isLoading } = useWarrantyPhoto(path); // custom hook

    if (isLoading) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center`}>
                Loading...
            </div>
        );
    }

    if (!src) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center`}>
                <Camera size={40} className="text-gray-300" />
            </div>
        );
    }

    return <img src={src} alt={alt} className={className} />;
}


const WarrantyRequest = ({ isOpen, onClose, data = {}, onSuccess }) => {
    if (!data) return null;
    if (!isOpen) return null;
    const [showWarrantyReceive, setShowWarrantyReceive] = useState(false);
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [showToast, setShowToast] = useState(false);
    const [success, setSuccess] = useState(false);
    const [photoFiles, setPhotoFiles] = useState(null);
    // removed readonly (was never updated) and its usages
    const [photoError, setPhotoError] = useState("");
    const [error, setError] = useState("");
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageViewerIndex, setImageViewerIndex] = useState(0);
    const [formData, setFormData] = useState(() => ({
        warrantyNumber: '',
        accessories: '' ,
        color: '' ,
        password: '' ,
        type: '',
        techObservation: '',
        warrantyPhotosUrls: data.warrantyPhotosfs
    }));
    const [reason, setReason] = useState({
        warrantyNumber: data.warrantyNumber,
        returnReason: data.returnReason
    });
    const STATUS_OPTIONS = [
        "CHECKED_IN",
        "ITEM_RETURNED",
        "WAITING_FOR_WARRANTY_REPLACEMENT",
        "WARRANTY_REPLACEMENT_ARRIVED",
        "WARRANTY_REPLACEMENT_COMPLETED",
        "DENIED"
    ];

    // removed unused currentStatusIndex

    const downloadWarrantyPdf = async (warrantyNumber) => {
        try {
            const response = await api.get(`/warranty/getWarrantyPdf/${warrantyNumber}`, { responseType: 'blob' });
            const blob = response.data;
            const contentDisposition = response.headers['content-disposition'];
            const fileNameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const fileName = fileNameMatch ? fileNameMatch[1] : `Warranty-${warrantyNumber}.pdf`;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF download error:", error);
            alert("Something went wrong while downloading the PDF.");
        }
    };

    useEffect(() => {
        setSuccess(null);
        console.log(data);
        if (data) {
            setFormData(prev => {
                if (prev.warrantyNumber === data.warrantyNumber) return prev;
                return {
                    ...prev,
                    ...data
                };
            });
        }
    }, [data?.warrantyNumber]);
    
    // Reset fetched photos when warranty photos URLs change
    useEffect(() => {
        setFetchedWarrantyPhotos({});
    }, [data?.warrantyNumber]);

    // Component to fetch individual warranty photo with caching
    const WarrantyPhotoFetcher = ({ photoUrl, index }) => {
        const { data: presignedUrl } = useWarrantyPhoto(photoUrl);
        
        useEffect(() => {
            if (presignedUrl) {
                setFetchedWarrantyPhotos(prev => ({ ...prev, [index]: presignedUrl }));
            }
        }, [presignedUrl, index]);
        
        return null;
    };
    
    // State to store fetched warranty photo URLs by index
    const [fetchedWarrantyPhotos, setFetchedWarrantyPhotos] = useState({});
    
    // Extract photo URLs, handling both base64 (new uploads) and presigned URLs
    const warrantyPhotos = useMemo(() => {
        if (!data.warrantyPhotosUrls || data.warrantyPhotosUrls.length === 0) return [];
        
        return data.warrantyPhotosUrls.map((photoUrl, idx) => {
            // If it's already a base64 data URL (from new uploads), use it directly
            if (photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('blob:'))) {
                return photoUrl;
            }
            // Otherwise, use the cached presigned URL
            return fetchedWarrantyPhotos[idx] || photoUrl;
        });
    }, [data.warrantyPhotosUrls, fetchedWarrantyPhotos]);

    const UpdateStatus = async () => {
        try {
            const form = new FormData();
            if (formData.warrantyNumber) form.append("warrantyNumber", formData.warrantyNumber.toString());
            if (formData.status) form.append("status", formData.status.toString());
            const response = await api.patch(`/warranty/updateWarrantyStatus`, form);
            const result = response.data;
            setSuccess(result);
            onSuccess();
        } catch (error) {
            const errorMessage = error.response?.data || error.message;
            setError(errorMessage);
            setShowToast(true);
            console.error("Status update failed:", errorMessage);
        }
    }


    const handlePhotoUpload = (e) => {
        const selected = e.target.files ? Array.from(e.target.files) : [];
        if (selected.length === 0) return;
        const maxPhotos = 3;
        const currentCount = formData.warrantyPhotosUrls ? formData.warrantyPhotosUrls.length : 0;
        const remainingSlots = maxPhotos - currentCount;
        if (remainingSlots <= 0) {
            setPhotoError(`Maximum of ${maxPhotos} photos reached.`);
            e.target.value = '';
            return;
        }
        const filesToAdd = selected.slice(0, remainingSlots);
        const ignored = selected.length - filesToAdd.length;
        setPhotoError(ignored > 0
            ? `Only ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'} allowed (maximum ${maxPhotos}).`
            : ''
        );
        Promise.all(filesToAdd.map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }))).then(base64Arr => {
            setFormData(prev => ({
                ...prev,
                warrantyPhotosUrls: [...(prev.warrantyPhotosUrls || []), ...base64Arr]
            }));
            setPhotoFiles(prev => ([...(prev || []), ...filesToAdd]));
        }).catch(() => setPhotoError('Failed to read one or more files.'))
          .finally(() => { e.target.value = ''; });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Normalize accessories to 'N/A' if blank/whitespace
        const sanitizedAccessories = !formData.accessories || formData.accessories.trim() === '' ? 'N/A' : formData.accessories;
        if (sanitizedAccessories !== formData.accessories) {
            setFormData(prev => ({ ...prev, accessories: sanitizedAccessories }));
        }
        const statusChanged = (formData.status !== data.status);
        if (!statusChanged){
            setError("Please Update the status above.");
            setShowToast(true);
            return;
        }
        if(formData.status === "ITEM_RETURNED") {
            const hasPhotos = (photoFiles && photoFiles.length > 0) || (formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0);
            if (!hasPhotos ) {
                setError("Please upload at least one photo of the device condition.");
                setShowToast(true);
                return;
            }
            setError("");
            setPhotoError("");
            setShowWarrantyReceive(true);
        } else {
            UpdateStatus();
            onClose();
        }
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({
            ...prev,
            status: e.target.value
        }));
    };

    const reasonsList = [
        "Defective/Not Working",
        "Wrong Item Received",
        "Performance Issues",
        "Physical Damage",
        "Upgrade Request",
        "Other",
    ];

    const openImageViewer = (idx) => {
        setImageViewerIndex(idx);
        setImageViewerOpen(true);
    };
    const closeImageViewer = () => setImageViewerOpen(false);

    // Unified photo source preference: formData.warrantyPhotosUrls first (new uploads), else warrantyPhotos fallback (cached)
    const displayedPhotos = useMemo(() => {
        if (formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0) {
            return formData.warrantyPhotosUrls;
        }
        return warrantyPhotos;
    }, [formData.warrantyPhotosUrls, warrantyPhotos]);

    const imageViewerNextPhoto = () => setImageViewerIndex((prev) => (prev + 1) % (displayedPhotos.length || 1));
    const imageViewerPrevPhoto = () => setImageViewerIndex((prev) => (prev - 1 + displayedPhotos.length) % (displayedPhotos.length || 1));

    if(success === true){
        onClose();
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div
                className={`relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[95vh]
            transform transition-all duration-300
            ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
                {/* Close Button (stays fixed at the top-right of the modal) */}
            <div className=" relative bg-white border-2 border-gray-200 shadow-lg rounded-lg overflow-y-auto max-h-[95vh] scrollbar-hide">
                <button
                    onClick={onClose}
                    className=" absolute top-4 right-8 z-50 text-gray-600 hover:text-black text-2xl font-bold"
                >
                    &times;
                </button>
                { /* Stepper Header */}
                <div className=" justify-center bg-gray-100 border-b border-gray-200 p-6 pb-10">
               <WarrantyStepper step={data.status}/>
                </div>
                {/* Form Section */}
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Header Section */}
                            <div className="mb-4">
                                <div className="flex flex-col md:flex-row justify-between mb-6">
                                    <div className="text-xl font-semibold text-gray-800">Warranty: {data.warrantyNumber}</div>
                                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                                        <span className="text-sm font-medium">Status:</span>
                                        <select
                                            onChange={handleStatusChange}
                                            value={formData.status}
                                            disabled={false}
                                            className="font-semibold px-3 py-2 border rounded-md bg-gray-100 text-gray-800 w-48"
                                        >
                                            {STATUS_OPTIONS.filter((status) => {
                                                const currentIndex = STATUS_OPTIONS.indexOf(formData.status);
                                                const statusIndex = STATUS_OPTIONS.indexOf(status);

                                                if (status === "DENIED") return true; // Always show DENIED

                                                if (status === formData.status) return true; // Show current status as selected

                                                if (formData.status === "CHECKED_IN") {
                                                    return status === "ITEM_RETURNED";
                                                }

                                                if (formData.status === "ITEM_RETURNED") {
                                                    return role === "admin" && statusIndex > currentIndex;
                                                }

                                                // For other statuses, only allow forward movement
                                                return statusIndex > currentIndex;
                                            }).map((status) => (
                                                <option key={status} value={status}>
                                                    {status.replace(/_/g, " ")}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>


                        {/* Customer Information Section */}

                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">CUSTOMER INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-3 gap-2 text-m w-full">
                                <div><strong>Customer Name:</strong><br />{data.customerFirstName} {data.customerLastName}</div>
                                <div><strong>Customer Email:</strong><br />{data.customerEmail}</div>
                                <div><strong>Customer Phone Number:</strong><br />{data.customerPhoneNumber}</div>
                            </div>
                        </div>



                        {/* Device Information Section */}
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-3 gap-2 text-m w-full">
                                <div><strong>Device Name:</strong><br />{data.deviceName}</div>
                                <div><strong>Description:</strong><br />{data.deviceType}</div>
                                <div><strong>Brand:</strong><br />{data.brand}</div>
                                <div><strong>Model:</strong><br />{data.model}</div>
                                <div><strong>Serial Number:</strong><br />{data.serialNumber}</div>
                                <div>
                                    <strong>Warranty Expiration:</strong><br />
                                    {new Date(data.expirationDate).toLocaleDateString('en-US')}
                                </div>
                            </div>
                        </div>

                        {/* Additional Section if warranty becomes repair*/}
                        {(data.kind === "IN_WARRANTY_REPAIR" && data.status === "CHECKED_IN" ) && (<div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">OTHER INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-3 gap-2 text-m w-full">

                                <div className="space-y-2">
                                    <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                                        Device Color:
                                    </label>
                                    <input
                                        id="color"
                                        value={formData.color}
                                        onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                        required
                                        className=" w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent "
                                    ></input>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Device Password:
                                    </label>
                                    <input
                                        id="password"
                                        value={formData.password}
                                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        required
                                        placeholder="Please put 'NA' if none "
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent "
                                    ></input>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                        Device Type:
                                    </label>
                                    <select
                                        id="type"
                                        value={formData.type}
                                        onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent bg-white"
                                    >
                                        <option value="">Select device type</option>
                                        <option value="LAPTOP">Laptop</option>
                                        <option value="COMPUTER">Computer</option>
                                        <option value="PRINTER">Printer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="accessories" className="block text-sm font-medium text-gray-700">
                                    Acessories Included:
                                </label>
                                <input
                                    id="accessories"
                                    value={formData.accessories}
                                    onChange={e => setFormData(prev => ({ ...prev, accessories: e.target.value }))}
                                    // accessories optional: default to 'N/A' on submit if left blank
                                    className=" w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent "
                                />
                            </div>

                        </div>)}


                        {/* Problem Description Section */}
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">PROBLEM DESCRIPTION</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="customerIssues" className="block text-sm font-medium text-gray-700">
                                        Customer Reported Issues:
                                    </label>
                                    <input
                                        id="customerIssues"
                                        defaultValue={data.reportedIssue}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent "
                                    ></input>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="technicianObservations" className="block text-sm font-medium text-gray-700">
                                        Technician Observations:
                                    </label>
                                    <textarea
                                        id="technicianObservations"
                                        value={data.techObservation}
                                        onChange={e => setFormData(prev => ({ ...prev, techObservation: e.target.value }))}
                                        placeholder="To be filled by technician (Optional)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent min-h-[100px]"
                                    ></textarea>
                                </div>

                            </div>
                        </div>

                        {/* Reason Section */}
                        <label htmlFor="technicianObservations" className="block text-sm font-medium text-gray-700">
                            Return Reason:
                        </label>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]">
                            {reasonsList.map((label, i) => (
                                <label key={i} className="flex items-center space-x-2 text-gray-800">
                                    <input
                                        type="radio"
                                        name="returnReason"
                                        defaultValue={label}
                                        checked={reason.returnReason === label}
                                        disabled={false}
                                        onChange={() => setReason({ ...data, returnReason: label })}
                                        className="accent-green-600 cursor-default"
                                    />
                                    <span className={`${data.returnReason === label ? 'text-green-700 font-medium' : ''}`}>
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* Device Condition Section */}
                        {/* Fetch warranty photos in background */}
                        {data.warrantyPhotosUrls && data.warrantyPhotosUrls.length > 0 && data.warrantyPhotosUrls.map((photoUrl, idx) => {
                            // Only fetch if it's not already a base64/blob URL
                            if (photoUrl && !photoUrl.startsWith('data:') && !photoUrl.startsWith('blob:')) {
                                return (
                                    <WarrantyPhotoFetcher
                                        key={`warranty-photo-${idx}-${photoUrl}`}
                                        photoUrl={photoUrl}
                                        index={idx}
                                    />
                                );
                            }
                            return null;
                        })}

                        <div className="mb-6 mt-5">
                            {/* Header */}
                            <div className="mb-6">
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                    <h2 className="font-bold text-gray-800">DEVICE CONDITION</h2>
                                </div>

                                {/* Container */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center space-y-3">

                                    {/* Upload Button - only if not success AND status is CHECKED_IN */}
                                    {!success && data.status === "CHECKED_IN" && (
                                        <>
                                            <label
                                                htmlFor="photo-upload"
                                                className="cursor-pointer inline-block px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-600"
                                            >
                                                Upload Photo(s)
                                            </label>
                                            <p className="text-sm text-gray-400">Upload up to 3 photos of device condition</p>
                                        </>
                                    )}

                                    {/* File Input */}
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        multiple
                                        onChange={handlePhotoUpload}
                                        disabled={success}
                                        max={3}
                                    />

                                    {/* Error */}
                                    {photoError && (
                                        <p className="text-sm text-red-600">
                                            {photoError instanceof Error ? photoError.message : photoError}
                                        </p>
                                    )}

                                    {/* Photo Display */}
                                    {displayedPhotos.length > 0 && (
                                        <div className="flex gap-4 mt-2 justify-center flex-wrap">
                                            {displayedPhotos.map((src, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer"
                                                >
                                                    Upload Photo(s)
                                                </label>
                                            </>
                                        )}
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            multiple
                                            onChange={handlePhotoUpload}
                                            disabled={success}
                                            max={3}
                                        />
                                        {formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0 && (
                                            <p className="text-sm text-gray-600">
                                                Uploaded Images:
                                            </p>
                                        )}
                                        {photoError && (
                                            <p className="text-sm text-red-600">
                                                {photoError instanceof Error ? photoError.message : photoError}
                                            </p>
                                        )}
                                        {displayedPhotos && displayedPhotos.length > 0 && (
                                            <div className="flex gap-4 mt-2 justify-center">
                                                {displayedPhotos.map((src, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            width: 96,
                                                            height: 96,
                                                            background: "#f3f4f6",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderRadius: 8,
                                                            border: "1px solid #e5e7eb",
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            position: "relative"
                                                        }}
                                                    >
                                                        {!success && (
                                                            <button
                                                                type="button"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    if (formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0) {
                                                                        setFormData(prev => {
                                                                            const updated = prev.warrantyPhotosUrls.filter((_, i) => i !== idx);
                                                                            setPhotoFiles(pf => (pf ? pf.filter((_, i) => i !== idx) : pf));
                                                                            if (updated.length === 0) {
                                                                                setPhotoError("Please upload at least one photo of the device condition.");
                                                                            } else {
                                                                                setPhotoError('');
                                                                            }
                                                                            return { ...prev, warrantyPhotosUrls: updated };
                                                                        });
                                                                    }
                                                                }}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: 4,
                                                                    right: 4,
                                                                    background: "rgba(255,255,255,0.8)",
                                                                    border: "none",
                                                                    borderRadius: "50%",
                                                                    width: 24,
                                                                    height: 24,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    cursor: "pointer",
                                                                    zIndex: 2
                                                                }}
                                                                aria-label="Remove photo"
                                                                disabled={success}
                                                            >
                                                                <X size={18} className="text-gray-500 hover:text-red-500" />
                                                            </button>
                                                        )}
                                                        <img
                                                            src={src}
                                                            alt={`Device condition ${idx + 1}`}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "contain",
                                                                background: "#f3f4f6"
                                                            }}
                                                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/80 border-none z-10 hover:bg-red-100"
                                                            aria-label="Remove photo"
                                                        >
                                                            <X size={16} className="text-gray-500 hover:text-red-500" />
                                                        </button>
                                                    )}
                                                    <img
                                                        src={src}
                                                        alt={`Device condition ${idx + 1}`}
                                                        className="w-full h-full object-contain"
                                                        onClick={() => openImageViewer(idx)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* No Photos Placeholder */}
                                    {displayedPhotos.length === 0 && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            {(!success && data.status === "CHECKED_IN")
                                                ? "No photos uploaded yet"
                                                : "No photos available"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Submit Button */}
                        <div className="flex justify-between mt-4">
                            {/* Left side: Download PDF */}
                            <div>
                                {data.status !== "CHECKED_IN" && (<button
                                    onClick={() => downloadWarrantyPdf(data.warrantyNumber)}
                                    className="px-6 py-2 bg-[#2bc106] text-white rounded hover:bg-green-700"
                                >
                                    Download PDF
                                </button>)}

                            </div>

                            {/* Right side: Close and Confirm buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#2bc106] hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:ring-offset-2"
                                >
                                    Confirm Changes
                                </button>
                            </div>
                        </div>

                        {/* Image Viewer Modal */}
                        {imageViewerOpen && (
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
                                onClick={closeImageViewer}
                            >
                                <div
                                    className="relative bg-white rounded-lg shadow-lg p-4 flex flex-col items-center"
                                    style={{ minWidth: 350, minHeight: 350, maxWidth: 500, maxHeight: 500 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 text-gray-700 hover:text-red-500"
                                        onClick={closeImageViewer}
                                    >
                                        <X size={28} />
                                    </button>
                                    <img
                                        src={displayedPhotos[imageViewerIndex]}
                                        alt={`Device condition ${imageViewerIndex + 1}`}
                                        style={{
                                            maxWidth: 400,
                                            maxHeight: 400,
                                            objectFit: "contain",
                                            borderRadius: 8,
                                            background: "#f3f4f6"
                                        }}
                                    />
                                    <div className="flex items-center justify-between w-full mt-4">
                                        <button
                                            type="button"
                                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                            onClick={imageViewerPrevPhoto}
                                            disabled={displayedPhotos.length < 2}
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <span className="text-gray-700 text-sm">
                                            {imageViewerIndex + 1} / {displayedPhotos.length}
                                        </span>
                                        <button
                                            type="button"
                                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                            onClick={imageViewerNextPhoto}
                                            disabled={displayedPhotos.length < 2}
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                    <Toast
                        show={showToast}
                        message={error instanceof Error ? error.message : error}
                        type="error"
                        onClose={() => setShowToast(false)}
                    />

                    {showWarrantyReceive && (
                        <WarrantyReceive reason={reason} data={formData} success={success} setSuccess={setSuccess} OnClose={() => setShowWarrantyReceive(false) } />
                    )}

                </div>
            </div>
            </div>
        </div>
    );
};

export default WarrantyRequest;
