import React, { useEffect, useState } from "react";
import { Upload, X, ChevronLeft, ChevronRight  } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const RepairForm = ({ status, onNext, formData: initialFormData = {} }) => {
    const role = localStorage.getItem("userRole")?.toLowerCase();
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const [loading, setLoading] = useState(true);
    const [photoError, setPhotoError] = useState("");
    const [error, setError] = useState(null);

    const location = useLocation();

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const openViewer = (idx) => {
        setViewerIndex(idx);
        setViewerOpen(true);
    };

    const closeViewer = () => setViewerOpen(false);

    const nextPhoto = () => setViewerIndex((prev) => (prev + 1) % formData.repairPhotos.length);
    const prevPhoto = () => setViewerIndex((prev) => (prev - 1 + formData.repairPhotos.length) % formData.repairPhotos.length);

    let readonly;
    if (role === "admin") {
        readonly = false;
    }

    const navigate = useNavigate();

    const [ticketNumber, setTicketNumber] = useState("");
    const [photoFiles, setPhotoFiles] = useState([]);

    const [formData, setFormData] = useState({
        ticketNumber: "",
        customerName: "",
        customerEmail: "",
        customerPhoneNumber: "",
        deviceType: "",
        deviceBrand: "",
        deviceModel: "",
        deviceSerialNumber: "",
        deviceColor: "",
        devicePassword: "",
        accessories: "",
        reportedIssue: "",
        observations: "",
        technicianEmail: userData.email || "",
        technicianName: (userData.firstName ? userData.firstName + " " : "") + (userData.lastName || ""),
        repairPhotos: [],
        ...initialFormData
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ...initialFormData
        }));
    }, [initialFormData]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

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
                    repairPhotos: base64Arr
                }));
            });
        }
        // Do nothing if no files selected (cancel)
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasPhotos =
            (photoFiles && photoFiles.length > 0) ||
            (formData.repairPhotos && formData.repairPhotos.length > 0);

        if (!hasPhotos) {
            setPhotoError("Please upload at least one photo of the device condition.");
            return;
        } else {
            setPhotoError("");
        }
        if (onNext) {
            onNext(formData);
        }
    };

    useEffect(() => {
        const fetchRepairTicketNumber = async () => {
            try {
                setLoading(true);
                const cached = sessionStorage.getItem('repairTicket');
                if (cached) {
                    setFormData(JSON.parse(cached));
                    setLoading(false);
                    return;
                }
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error("Not authenticated. Please log in.");
                const response = await fetch(`http://localhost:8080/repairTicket/generateRepairTicketNumber`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.text();
                setFormData((prev) => ({
                    ...prev,
                    ticketNumber: data
                }));
                setTicketNumber(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRepairTicketNumber();
    }, []);

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="border-2 border-gray-200 shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gray-100 border-b border-gray-200 p-4">
                    <h1 className="text-center text-2xl font-bold">IOCONNECT REPAIR SERVICE</h1>
                    <p className="text-center text-gray-600">Repair Check-In Form</p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col md:flex-row justify-between mb-6">
                            <div className="text-xl font-semibold text-gray-800">Customer Check-In</div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                <span className="text-sm font-medium">Ticket #:</span>
                                <input
                                    value={formData.ticketNumber}
                                    readOnly
                                    className="w-40 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">CUSTOMER INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Full Name:</label>
                                    <input
                                        id="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">Email:</label>
                                    <input
                                        id="customerEmail"
                                        type="email"
                                        value={formData.customerEmail}
                                        onChange={handleChange}
                                        placeholder="Enter email address"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="customerPhoneNumber" className="block text-sm font-medium text-gray-700">Phone:</label>
                                    <input
                                        id="customerPhoneNumber"
                                        value={formData.customerPhoneNumber}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700">Device Type:</label>
                                    <select
                                        id="deviceType"
                                        value={formData.deviceType}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] bg-white"
                                    >
                                        <option value="" disabled hidden>Select device type</option>
                                        <option value="LAPTOP">LAPTOP</option>
                                        <option value="COMPUTER">COMPUTER</option>
                                        <option value="PRINTER">PRINTER</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="deviceBrand" className="block text-sm font-medium text-gray-700">Brand:</label>
                                    <input
                                        id="deviceBrand"
                                        value={formData.deviceBrand}
                                        onChange={handleChange}
                                        placeholder="Enter brand"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-700">Model:</label>
                                    <input
                                        id="deviceModel"
                                        value={formData.deviceModel}
                                        onChange={handleChange}
                                        placeholder="Enter model"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="deviceSerialNumber" className="block text-sm font-medium text-gray-700">Serial Number:</label>
                                    <input
                                        id="deviceSerialNumber"
                                        value={formData.deviceSerialNumber}
                                        onChange={handleChange}
                                        placeholder="Enter serial number"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="deviceColor" className="block text-sm font-medium text-gray-700">Color:</label>
                                    <input
                                        id="deviceColor"
                                        value={formData.deviceColor}
                                        onChange={handleChange}
                                        placeholder="Enter color"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="devicePassword" className="block text-sm font-medium text-gray-700">Device Password (if any):</label>
                                    <input
                                        id="devicePassword"
                                        value={formData.devicePassword}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">ACCESSORIES</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="accessories" className="block text-sm font-medium text-gray-700">Customer Owned Accessories:</label>
                                    <textarea
                                        id="accessories"
                                        value={formData.accessories}
                                        onChange={handleChange}
                                        placeholder="Describe the accessories"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">PROBLEM DESCRIPTION</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="reportedIssue" className="block text-sm font-medium text-gray-700">Customer Reported Issues:</label>
                                    <textarea
                                        id="reportedIssue"
                                        value={formData.reportedIssue}
                                        onChange={handleChange}
                                        placeholder="Describe the issues you're experiencing"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] min-h-[100px]"
                                    />
                                </div>
                                {status !== "new" && (
                                    <div className="space-y-2">
                                        <label htmlFor="observations" className="block text-sm font-medium text-gray-700">Observations:</label>
                                        <textarea
                                            id="observations"
                                            value={formData.observations}
                                            onChange={handleChange}
                                            placeholder="Technician notes (optional)"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] min-h-[100px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE CONDITION</h2>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <div className="mb-4">
                                    <div className="mx-auto bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-[#33e407]" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">Upload up to 3 photos of device condition</p>
                                    <label
                                        htmlFor="photo-upload"
                                        className="cursor-pointer inline-block px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    >
                                        Upload Photo(s)
                                    </label>
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        multiple
                                        onChange={handlePhotoUpload}
                                        max={3}
                                    />
                                    {((photoFiles && photoFiles.length > 0) || (formData.repairPhotos && formData.repairPhotos.length > 0)) && (
                                        <p className="text-sm text-gray-600">
                                            Selected Images:
                                        </p>
                                    )}
                                    {photoError && (
                                        <p className="text-sm text-red-600">{photoError}</p>
                                    )}
                                    {formData.repairPhotos && formData.repairPhotos.length > 0 && (
                                        <div className="flex gap-4 mt-2 justify-center">
                                            {formData.repairPhotos.map((src, idx) => (
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
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => openViewer(idx)}
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Device condition ${idx + 1}`}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "contain",
                                                            background: "#f3f4f6"
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-[#33e407] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                            >
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {viewerOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
                    onClick={closeViewer}
                >
                    <div
                        className="relative bg-white rounded-lg shadow-lg p-4 flex flex-col items-center"
                        style={{ minWidth: 350, minHeight: 350, maxWidth: 500, maxHeight: 500 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-2 right-2 text-gray-700 hover:text-red-500"
                            onClick={closeViewer}
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={formData.repairPhotos[viewerIndex]}
                            alt={`Device condition ${viewerIndex + 1}`}
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
                                onClick={prevPhoto}
                                disabled={formData.repairPhotos.length < 2}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <span className="text-gray-700 text-sm">
                                {viewerIndex + 1} / {formData.repairPhotos.length}
                            </span>
                            <button
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                onClick={nextPhoto}
                                disabled={formData.repairPhotos.length < 2}
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepairForm;