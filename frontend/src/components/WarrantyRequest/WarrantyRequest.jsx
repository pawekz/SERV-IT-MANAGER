import React, {useEffect, useState} from "react";
import {ChevronLeft, ChevronRight, Upload,X, SquareX} from "lucide-react";
import WarrantyStepper from "../WarrantyStepper/WarrantyStepper.jsx";
import WarrantyReceive from "../WarrantyRecieve/WarrantyReceive.jsx";


const WarrantyRequest = ({ isOpen, onClose,data = {}, onSuccess}) => {
    if (!data) return null;
    const [showWarrantyReceive, setShowWarrantyReceive] = useState(false);
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [agreed, setAgreed] = useState(false);
    const [readonly, setReadonly] = useState(false);
    const [success, setSuccess] = useState(false);
    const [photoFiles, setPhotoFiles] = useState(null);
    const [photoError, setPhotoError] = useState("");
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageViewerIndex, setImageViewerIndex] = useState(0);
    const [formData, setFormData] = useState(() => ({
        warrantyNumber: '',
        status: '',
        customerName: '',
        customerEmail: '',
        customerPhoneNumber: '',
        deviceName: '',
        deviceType: '',
        expirationDate: '',
        reportedIssue: '',
        returnReason: '' ,
        serialNumber: '' ,
        techObservation: '',
        warrantyPhotosUrls: [],
        digitalSignature: null // will be set after signing
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

    const currentStatusIndex = STATUS_OPTIONS.indexOf(data.status);

    function SecureImage({ src, idx, openImageViewer }) {
        const [imageUrl, setImageUrl] = useState(null);

        useEffect(() => {
            const fetchImageWithAuth = async () => {
                try {
                    const token = localStorage.getItem("authToken");
                    if (!token) throw new Error("Not authenticated. Please log in.");

                    const response = await fetch(`http://localhost:8080${src}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error("Failed to fetch image");
                    }

                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    setImageUrl(blobUrl);
                } catch (err) {
                    console.error("Error fetching image:", err);
                }
            };

            fetchImageWithAuth();
        }, [src]);

        if (!imageUrl) {
            return <div className="w-full h-full bg-gray-200 animate-pulse rounded" />; // Skeleton while loading
        }

        return (
            <img
                src={imageUrl}
                alt={`Device condition ${idx + 1}`}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "#f3f4f6",
                }}
                onClick={() => openImageViewer(idx)}
            />
        );
    }


        useEffect(() => {
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

    useEffect(() => {
        if (role === "customer") {
            setReadonly(true);
        } else {
            setReadonly(false);
        }
    }, [role]);

    const UpdateStatus = async () => {

        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Not authenticated. Please log in.");

        const form = new FormData();
        if (formData.warrantyNumber) {
            form.append("warrantyNumber", formData.warrantyNumber.toString());
        }
        if (formData.status) {
            form.append("status", formData.status.toString());
        }

        const response = await fetch("http://localhost:8080/warranty/updateWarrantyStatus", {
            method: "PATCH",
            headers: {Authorization: `Bearer ${token}`},
            body: form,
        });
        if (!response.ok) {
            let errorMessage;
            try {
                const errorData = await response.text();
                errorMessage = errorData || `Server returned ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `Server returned ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        const result = await response.json();
        setSuccess(result);
        onSuccess();

    }


    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            if (files.length > 3) {
                setPhotoError("You can upload a maximum of 3 photos.");
                return;
            }
            setPhotoError("");
            setPhotoFiles(files);

            Promise.all(files.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            })).then(base64Arr => {
                setFormData((prev) => ({
                    ...prev,
                    warrantyPhotosUrls: base64Arr
                }));
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if(formData.status === "ITEM_RETURNED") {
            const hasPhotos =
                (photoFiles && photoFiles.length > 0) ||
                (formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0);

            if (!hasPhotos) {
                setPhotoError("Please upload at least one photo of the device condition.");
                return;
            } else {
                setPhotoError("");
            }

            setShowWarrantyReceive(true);
        } else {
            UpdateStatus();
            onClose();
        }
    };

    const handleStatusChange = (e) => {
        setFormData({ ...data, status: e.target.value });
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
    const imageViewerNextPhoto = () => setImageViewerIndex((prev) => (prev + 1) % formData.warrantyPhotosUrls.length);
    const imageViewerPrevPhoto = () => setImageViewerIndex((prev) => (prev - 1 + formData.warrantyPhotosUrls.length) % formData.warrantyPhotosUrls.length);



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div
                className={`relative bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[95vh]
                  transform transition-all duration-700 scale-95 opacity-0
                  ${isOpen ? 'scale-100 opacity-100' : ''}`}
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
                                            disabled ={readonly} // disables editing (customer cannot change it)
                                            className=" font-semibold px-3 py-2 border rounded-md bg-gray-100 text-gray-800 w-48">
                                            {STATUS_OPTIONS.map((status, index) => (
                                                <option key={status} value={status} disabled={index < currentStatusIndex}>
                                                    {status.replace(/_/g, " ")}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>


                        {/* Customer Information Section */}
                        {role !== "customer" && (
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">CUSTOMER INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                        Full Name:
                                    </label>
                                    <input
                                        id="fullName"
                                        defaultValue={data.customerName}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email:
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        defaultValue={data.customerEmail}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Phone:
                                    </label>
                                    <input
                                        id="phone"
                                        defaultValue={data.customerPhoneNumber}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                        )}


                        {/* Device Information Section */}
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700">
                                        Device Name:
                                    </label>
                                    <input
                                        id="deviceName"
                                        defaultValue={data.deviceName}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700">
                                        Description:
                                    </label>
                                    <input
                                        id="deviceType"
                                        defaultValue={data.deviceType}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">
                                        Serial Number:
                                    </label>
                                    <input
                                        id="serialNumber"
                                        defaultValue={data.serialNumber}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
                                        Warranty Expiration Date:
                                    </label>
                                    <input
                                        id="expirationDate"
                                        defaultValue={new Date(data.expirationDate).toLocaleDateString()}
                                        readOnly={readonly}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

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
                                    <textarea
                                        id="customerIssues"
                                        defaultValue={data.reportedIssue}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent min-h-[100px]"
                                    ></textarea>
                                </div>
                                {role !== "customer" && (
                                <div className="space-y-2">
                                    <label htmlFor="technicianObservations" className="block text-sm font-medium text-gray-700">
                                        Technician Observations:
                                    </label>
                                    <textarea
                                        id="technicianObservations"
                                        defaultValue={data.techObservation}
                                        placeholder="To be filled by technician (Optional)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent min-h-[100px]"
                                    ></textarea>
                                </div>
                                )}
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
                                        disabled = {readonly}
                                        onChange={() => setReason({ ...data, returnReason: label })}
                                        className="accent-green-600 cursor-default"
                                    />
                                    <span className={`${data.returnReason === label ? 'text-green-700 font-medium' : ''}`}>
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {role === "customer" && (
                        <p className="text-sm italic text-green-500 mb-2">
                            * Note: Device must be brought to the office for diagnosis and warranty processing.
                        </p>)}

                        {/* Device Condition Section */}
                        {role !=="customer" && (
                        <div className="mb-6 mt-5">
                            <div className="mb-6">
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                    <h2 className="font-bold text-gray-800">DEVICE CONDITION</h2>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <div className="space-y-3">
                                        {!success && data.status === "CHECKED_IN" && (
                                            <>
                                                <label
                                                    htmlFor="photo-upload"
                                                    className="cursor-pointer inline-block px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-600"
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
                                            <p className="text-sm text-red-600">{photoError}</p>
                                        )}
                                        {formData.warrantyPhotosUrls && formData.warrantyPhotosUrls.length > 0 && (
                                            <div className="flex gap-4 mt-2 justify-center">
                                                {formData.warrantyPhotosUrls.map((src, idx) => (
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
                                                                    setFormData(prev => {
                                                                        const updatedPhotos = prev.warrantyPhotosUrls.filter((_, i) => i !== idx);
                                                                        if (updatedPhotos.length === 0) {
                                                                            setPhotoFiles([]);
                                                                            setPhotoError("Please upload at least one photo of the device condition.");
                                                                        }
                                                                        return {
                                                                            ...prev,
                                                                            warrantyPhotos: updatedPhotos
                                                                        };
                                                                    });
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
                                                        <SecureImage key={idx} src={src} idx={idx} openImageViewer={openImageViewer} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-400">Upload up to 3 photos of device condition</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Terms and Conditions */}
                        {role === "customer" && (
                        <div className="mb-6">
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#33e407] focus:ring-[#33e407]"
                                    checked
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600">
                                    I have read and agree to the warranty <span>terms and conditions</span>
                                </label>
                            </div>
                        </div>
                        )}


                        {/* Submit Button */}
                        <div className="flex justify-end mt-4">
                            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 mr-3">Close</button>
                            {role !== "customer" && (
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#33e407] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:ring-offset-2"
                                >
                                    Confirm Changes
                                </button>
                            )}
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
                                        className="absolute top-2 right-2 text-gray-700 hover:text-red-500"
                                        onClick={closeImageViewer}
                                    >
                                        <X size={28} />
                                    </button>
                                    <img
                                        src={formData.warrantyPhotosUrls[imageViewerIndex]}
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
                                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                            onClick={imageViewerPrevPhoto}
                                            disabled={formData.warrantyPhotos.length < 2}
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <span className="text-gray-700 text-sm">
                                    {imageViewerIndex + 1} / {formData.warrantyPhotos.length}
                                </span>
                                        <button
                                            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                            onClick={imageViewerNextPhoto}
                                            disabled={formData.warrantyPhotos.length < 2}
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
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
