import React, { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from '../../config/ApiConfig';

const RepairForm = ({ status, onNext, formData: initialFormData = {}, success = false }) => {
    const navigate = useNavigate();
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
    // Technician assignment error state
    const [technicianError, setTechnicianError] = useState("");
    const [photoError, setPhotoError] = useState("");

    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageViewerIndex, setImageViewerIndex] = useState(0);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [isTamperModalOpen, setIsTamperModalOpen] = useState(false);

    const [warrantyStatus, setWarrantyStatus] = useState(null);
    const [warrantyIndicator, setWarrantyIndicator] = useState(null);
    const [warrantyClass, setWarrantyClass] = useState(null);

    const [formData, setFormData] = useState({
        ticketNumber: "",
        customerName: "", // legacy full name (computed from first + last on submit)
        customerFirstName: "",
        customerLastName: "",
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
        technicianEmail: initialFormData.technicianEmail ? initialFormData.technicianEmail : (userRole === 'ADMIN' ? '' : (userData.email || '')),
        technicianName: initialFormData.technicianName ? initialFormData.technicianName : (userRole === 'ADMIN' ? '' : ((userData.firstName ? userData.firstName + " " : "") + (userData.lastName || ""))),
        repairPhotos: [],
        isDeviceTampered: false,
        ...initialFormData
    });

    // Technician search states (re-added)
    const [techQuery, setTechQuery] = useState('');
    const [techResults, setTechResults] = useState([]);
    const [techLoading, setTechLoading] = useState(false);
    const [techError, setTechError] = useState(null);
    const [showTechDropdown, setShowTechDropdown] = useState(false);
    const techSearchTimeout = useRef(null);
    const techContainerRef = useRef(null);

    // If admin and no initial technician provided, ensure cleared (avoid auto self-assignment)
    useEffect(() => {
        if (userRole === 'ADMIN' && !initialFormData.technicianEmail) {
            setFormData(prev => ({ ...prev, technicianEmail: '', technicianName: '' }));
        }
    }, [userRole, initialFormData.technicianEmail]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ...initialFormData
        }));
    }, [initialFormData]);

    useEffect(() => {
        if (initialFormData.ticketNumber) {
            setFormData(prev => ({
                ...prev,
                ticketNumber: initialFormData.ticketNumber
            }));
            return;
        }
        const fetchRepairTicketNumber = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("Not authenticated. Please log in.");
                    return;
                }
                const response = await fetch(`${window.__API_BASE__}/repairTicket/generateRepairTicketNumber`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });
                if (!response.ok) {
                    console.error(`HTTP error! status: ${response.status}`);
                    return;
                }
                const data = await response.text();
                setFormData(prev => ({ ...prev, ticketNumber: data }));
            } catch (err) {
                console.error('Ticket generation failed:', err.message);
            }
        };
        fetchRepairTicketNumber();
    }, [initialFormData.ticketNumber]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handlePhotoUpload = (e) => {
        const inputFiles = e.target.files ? Array.from(e.target.files) : [];
        if (inputFiles.length === 0) return;

        const currentCount = formData.repairPhotos ? formData.repairPhotos.length : 0;
        const maxPhotos = 3;
        const remainingSlots = maxPhotos - currentCount;

        if (remainingSlots <= 0) {
            setPhotoError(`Maximum of ${maxPhotos} photos reached.`);
            // Reset the input so selecting same files again triggers onChange
            e.target.value = '';
            return;
        }

        // Take only the number of files that fit in remaining slots
        const filesToAdd = inputFiles.slice(0, remainingSlots);
        const ignoredCount = inputFiles.length - filesToAdd.length;

        setPhotoError(ignoredCount > 0
            ? `Only ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'} allowed (maximum ${maxPhotos}).`
            : ''
        );

        // Read new files as base64 and append
        Promise.all(filesToAdd.map(file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }))).then(base64Arr => {
            setFormData(prev => ({
                ...prev,
                repairPhotos: [...(prev.repairPhotos || []), ...base64Arr]
            }));
            setPhotoFiles(prev => ([...prev, ...filesToAdd]));
        }).catch(() => {
            setPhotoError('Failed to read one or more files.');
        }).finally(() => {
            // Clear input so user can re-select same files if needed
            e.target.value = '';
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setTechnicianError('');
        // Admin must assign a technician
        if (userRole === 'ADMIN' && !formData.technicianEmail) {
            setTechnicianError('Please assign a technician before proceeding.');
            return;
        }
        // Photo validation
        const hasPhotos =
            (photoFiles && photoFiles.length > 0) ||
            (formData.repairPhotos && formData.repairPhotos.length > 0);

        if (!hasPhotos) {
            setPhotoError("Please upload at least one photo of the device condition.");
            return;
        }

        const formattedPhoneNumber = formData.customerPhoneNumber.replace(/\s/g, '');
        const accessoriesValue = formData.accessories && formData.accessories.trim() !== '' ? formData.accessories : 'N/A';
        const fullName = `${formData.customerFirstName || ""} ${formData.customerLastName || ""}`.trim();
        const submitData = {
            ...formData,
            customerName: fullName || formData.customerName, // ensure legacy field populated
            customerPhoneNumber: formattedPhoneNumber,
            warrantyClass: warrantyClass,
            accessories: accessoriesValue
        };
        if (onNext) onNext(submitData);
    };

    const handlePhoneInput = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/\D/g, '');
        let formattedValue = '';
        if (numericValue.length > 0) {
            formattedValue = numericValue.slice(0, 3);
            if (numericValue.length > 3) {
                formattedValue += ' ' + numericValue.slice(3, 6);
            }
            if (numericValue.length > 6) {
                formattedValue += ' ' + numericValue.slice(6, 10);
            }
        }
        setFormData((prev) => ({
            ...prev,
            customerPhoneNumber: formattedValue
        }));
    };

    const openTamperModal = () => setIsTamperModalOpen(true);
    const closeTamperModal = () => setIsTamperModalOpen(false);

    const showQuestionMark = formData.deviceSerialNumber && formData.deviceSerialNumber.trim() !== '';

    const openImageViewer = (idx) => {
        setImageViewerIndex(idx);
        setImageViewerOpen(true);
    };
    const closeImageViewer = () => setImageViewerOpen(false);
    const imageViewerNextPhoto = () => setImageViewerIndex((prev) => (prev + 1) % formData.repairPhotos.length);
    const imageViewerPrevPhoto = () => setImageViewerIndex((prev) => (prev - 1 + formData.repairPhotos.length) % formData.repairPhotos.length);

    const fetchWarrantyStatus = async (serial, isTampered) => {
        try {
            setWarrantyStatus(null);
            setWarrantyIndicator(null);
            setWarrantyClass(null);

            const token = localStorage.getItem("token");
            const response = await api.get(
                `/warranty/check/${serial}?isDeviceTampered=${isTampered}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;
            setWarrantyStatus(data);
            setWarrantyClass(data.warrantyClass || null);

            const allowedDeviceTypes = ["LAPTOP", "COMPUTER", "PRINTER"];
            if (data && data.serialNumber === serial && data.brand) {
                setFormData((prev) => ({
                    ...prev,
                    deviceBrand: data.brand || prev.deviceBrand,
                    deviceModel: data.model || prev.deviceModel,
                    deviceType: allowedDeviceTypes.includes(data.deviceType) ? data.deviceType : "",
                    deviceSerialNumber: data.serialNumber,
                }));
            }

            if (data && data.serialNumber === serial) {
                let color = "bg-gray-100 text-gray-600";
                let statusText = data.warrantyClass
                    ? data.warrantyClass.replace(/_/g, " ")
                    : (data.message || "Warranty Status Unknown");
                if (data.warrantyClass === "AUTO_REPLACEMENT") color = "bg-blue-100 text-blue-600";
                else if (data.warrantyClass === "IN_WARRANTY_REPAIR") color = "bg-green-100 text-green-600";
                else if (data.warrantyClass === "OUT_OF_WARRANTY_CHARGEABLE") color = "bg-red-100 text-red-600";
                else if (data.warrantyClass === "PENDING_ADMIN_REVIEW") color = "bg-yellow-100 text-yellow-600";
                setWarrantyIndicator({ status: statusText, color });
            } else {
                setWarrantyIndicator({ status: "Serial Not Found", color: "bg-yellow-100 text-yellow-600" });
            }
        } catch (err) {
            setWarrantyStatus(null);
            setWarrantyClass(null);
            setWarrantyIndicator({ status: "Warranty Check Failed", color: "bg-gray-100 text-gray-600" });
        }
    };

    const serialScanTimeout = useRef(null);

    const handleSerialNumberChange = (e) => {
        handleChange(e);
        const serial = e.target.value.trim();
        if (serialScanTimeout.current) {
            clearTimeout(serialScanTimeout.current);
        }
        if (!serial) {
            setWarrantyStatus(null);
            setWarrantyIndicator(null);
            setWarrantyClass(null);
            return;
        }
        setWarrantyIndicator({ status: "Scanning...", color: "bg-gray-100 text-gray-600" });
        serialScanTimeout.current = setTimeout(() => {
            fetchWarrantyStatus(serial, formData.isDeviceTampered);
        }, 2000);
    };

    const handleTamperChange = (isTampered) => {
        setFormData(prev => ({ ...prev, isDeviceTampered: isTampered }));
        if (formData.deviceSerialNumber && formData.deviceSerialNumber.trim() !== '') {
            fetchWarrantyStatus(formData.deviceSerialNumber, isTampered);
        }
        closeTamperModal();
    };

    // Technician search effect (admin only)
    useEffect(() => {
        if (userRole !== 'ADMIN') return; // only admins use technician search
        if (!techQuery || techQuery.trim() === '') {
            setTechResults([]);
            setShowTechDropdown(false);
            setTechError(null);
            return;
        }
        if (techSearchTimeout.current) clearTimeout(techSearchTimeout.current);
        techSearchTimeout.current = setTimeout(async () => {
            try {
                setTechLoading(true);
                setTechError(null);
                const resp = await api.get('/user/searchTechnicians', { params: { query: techQuery.trim() } });
                let results = Array.isArray(resp.data) ? resp.data.slice(0, 3) : [];
                // Filter out the admin user (can't assign themselves)
                results = results.filter(t => t.email !== userData.email);
                setTechResults(results);
                setShowTechDropdown(true);
            } catch (e) {
                setTechError('Search failed');
                setTechResults([]);
                setShowTechDropdown(true);
            } finally {
                setTechLoading(false);
            }
        }, 300);
        return () => techSearchTimeout.current && clearTimeout(techSearchTimeout.current);
    }, [techQuery, userRole]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (techContainerRef.current && !techContainerRef.current.contains(e.target)) {
                setShowTechDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectTechnician = (tech) => {
        if (tech.email === userData.email) {
            // Safety guard (should not appear due to filter)
            setTechError('You cannot assign yourself.');
            return;
        }
        setFormData(prev => ({
            ...prev,
            technicianEmail: tech.email,
            technicianName: `${tech.firstName} ${tech.lastName}`.trim()
        }));
        setTechQuery(`${tech.firstName} ${tech.lastName}`.trim());
        setShowTechDropdown(false);
        setTechnicianError('');
    };

    const clearSelectedTechnician = () => {
        setFormData(prev => ({ ...prev, technicianEmail: '', technicianName: '' }));
        setTechQuery('');
        setTechResults([]);
        setShowTechDropdown(false);
    };


    return (
        <>
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
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#25D482]">
                                    <h2 className="font-bold text-gray-800">CUSTOMER INFORMATION</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="customerFirstName" className="block text-sm font-medium text-gray-700">First Name:</label>
                                        <input
                                            id="customerFirstName"
                                            value={formData.customerFirstName}
                                            onChange={handleChange}
                                            placeholder="Enter first name"
                                            required
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="customerLastName" className="block text-sm font-medium text-gray-700">Last Name:</label>
                                        <input
                                            id="customerLastName"
                                            value={formData.customerLastName}
                                            onChange={handleChange}
                                            placeholder="Enter last name"
                                            required
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
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
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="customerPhoneNumber" className="block text-sm font-medium text-gray-700">Phone:</label>
                                        <div className="flex items-center w-full border border-gray-300 rounded-md focus-within:border-[#25D482] focus-within:ring-1 focus-within:ring-[#25D482] transition-colors overflow-hidden">
                                            <div className="flex items-center bg-gray-50 px-3 py-2 border-r border-gray-200">
                                                <img
                                                    src="https://flagcdn.com/16x12/ph.png"
                                                    alt="Philippine flag"
                                                    className="mr-2 w-5 h-auto"
                                                />
                                                <span className="text-sm text-gray-600">+63</span>
                                            </div>
                                            <input
                                                id="customerPhoneNumber"
                                                value={formData.customerPhoneNumber}
                                                onChange={handlePhoneInput}
                                                placeholder="905 123 4567"
                                                required
                                                disabled={success}
                                                className="flex-1 px-4 py-2 text-sm border-none focus:outline-none"
                                                maxLength={13}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {userRole === 'ADMIN' && !success && (
                                <div className="mb-6" ref={techContainerRef}>
                                    <div className="bg-gray-100 p-2 mb-3 border-l-4 border-[#25D482]">
                                        <h2 className="font-bold text-gray-800 text-sm">TECHNICIAN ASSIGNMENT</h2>
                                    </div>
                                    {formData.technicianEmail && (
                                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2 mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-green-700">{formData.technicianName}</p>
                                                <p className="text-xs text-green-600">{formData.technicianEmail}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={clearSelectedTechnician}
                                                className="text-xs text-red-500 hover:text-red-600"
                                            >Change</button>
                                        </div>
                                    )}
                                    {!formData.technicianEmail && (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search technician by name or email..."
                                                value={techQuery}
                                                onChange={e => setTechQuery(e.target.value)}
                                                disabled={success}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                            />
                                            {showTechDropdown && (
                                                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto text-sm">
                                                    {techLoading && <div className="px-3 py-2 text-gray-500">Searching...</div>}
                                                    {techError && !techLoading && <div className="px-3 py-2 text-red-500">{techError}</div>}
                                                    {!techLoading && !techError && techResults.length === 0 && techQuery.trim() !== '' && (
                                                        <div className="px-3 py-2 text-gray-500">No technicians found</div>
                                                    )}
                                                    {techResults.map(t => (
                                                        <button
                                                            type="button"
                                                            key={t.userId || t.email}
                                                            onClick={() => handleSelectTechnician(t)}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 flex flex-col"
                                                        >
                                                            <span className="font-medium text-gray-800">{t.firstName} {t.lastName}</span>
                                                            <span className="text-xs text-gray-500">{t.email}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">Technician is required before proceeding.</p>
                                        </div>
                                    )}
                                    {technicianError && (
                                        <p className="mt-2 text-sm text-red-600">{technicianError}</p>
                                    )}
                                </div>
                            )}
                            <div className="mb-6">
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#25D482]">
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
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482] bg-white"
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
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
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
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="deviceSerialNumber" className="block text-sm font-medium text-gray-700">Serial Number:</label>
                                        <div className="relative flex items-center">
                                            <input
                                                id="deviceSerialNumber"
                                                value={formData.deviceSerialNumber}
                                                onChange={handleSerialNumberChange}
                                                placeholder="Enter serial number"
                                                required
                                                disabled={success}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                            />
                                            {showQuestionMark && (
                                                <button
                                                    type="button"
                                                    onClick={openTamperModal}
                                                    className="absolute right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                    disabled={success}
                                                >
                                                    <HelpCircle size={20} />
                                                </button>
                                            )}
                                        </div>
                                        {warrantyIndicator && (
                                            <div className={`mt-2 px-3 py-1 rounded text-sm font-semibold inline-block ${warrantyIndicator.color}`}>
                                                {warrantyIndicator.status}
                                                {warrantyStatus && warrantyStatus.daysFromPurchase != null && (
                                                    <span className="ml-2">({warrantyStatus.daysFromPurchase} days from purchase)</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="deviceColor" className="block text-sm font-medium text-gray-700">Color:</label>
                                        <input
                                            id="deviceColor"
                                            value={formData.deviceColor}
                                            onChange={handleChange}
                                            placeholder="Enter color"
                                            required
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="devicePassword" className="block text-sm font-medium text-gray-700">
                                            Device Password: <span className="text-gray-400">(If Any)</span>
                                        </label>
                                        <input
                                            id="devicePassword"
                                            value={formData.devicePassword}
                                            onChange={handleChange}
                                            placeholder="Enter password"
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#25D482]">
                                    <h2 className="font-bold text-gray-800">ACCESSORIES</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="accessories" className="block text-sm font-medium text-gray-700">Customer Owned Accessories: <span className="text-gray-400">(If Any)</span></label>
                                        <textarea
                                            id="accessories"
                                            value={formData.accessories}
                                            onChange={handleChange}
                                            placeholder="Describe the accessories"
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482] min-h-[100px]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#25D482]">
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
                                            disabled={success}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482] min-h-[100px]"
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
                                                disabled={success}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482] min-h-[100px]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#25D482]">
                                    <h2 className="font-bold text-gray-800">DEVICE CONDITION</h2>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <div className="space-y-3">
                                        {!success && (
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
                                        {formData.repairPhotos && formData.repairPhotos.length > 0 && (
                                            <p className="text-sm text-gray-600">
                                                Uploaded Images:
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
                                                                        const updatedPhotos = prev.repairPhotos.filter((_, i) => i !== idx);
                                                                        const newPhotoFiles = photoFiles.filter((_, i) => i !== idx);
                                                                        setPhotoFiles(newPhotoFiles);
                                                                        if (updatedPhotos.length === 0) {
                                                                            setPhotoError("Please upload at least one photo of the device condition.");
                                                                        } else {
                                                                            setPhotoError("");
                                                                        }
                                                                        return {
                                                                            ...prev,
                                                                            repairPhotos: updatedPhotos
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
                                                        <img
                                                            src={src}
                                                            alt={`Device condition ${idx + 1}`}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "contain",
                                                                background: "#f3f4f6"
                                                            }}
                                                            onClick={() => openImageViewer(idx)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-400">Upload up to 3 photos of device condition</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between gap-4">
                                <button
                                    type="button"
                                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md focus:outline-none"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#25D482] hover:bg-[#1fab6b] transition text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#25D482]"
                                >
                                    Next
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                {isTamperModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                        <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                            <button
                                className="absolute top-2 right-2 text-gray-700 hover:text-red-500"
                                onClick={closeTamperModal}
                            >
                                <X size={24} />
                            </button>
                            <h3 className="text-xl font-semibold mb-4">Device Tamper Check</h3>
                            <p className="text-gray-700 mb-4">Is the device tampered with?</p>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="deviceTamperedYes"
                                        name="deviceTampered"
                                        checked={formData.isDeviceTampered === true}
                                        onChange={() => handleTamperChange(true)}
                                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <label htmlFor="deviceTamperedYes" className="ml-2 block text-sm font-medium text-gray-700">
                                        Yes
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="deviceTamperedNo"
                                        name="deviceTampered"
                                        checked={formData.isDeviceTampered === false}
                                        onChange={() => handleTamperChange(false)}
                                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <label htmlFor="deviceTamperedNo" className="ml-2 block text-sm font-medium text-gray-700">
                                        No
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={closeTamperModal}
                                    className="px-4 py-2 bg-[#25D482] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                                src={formData.repairPhotos[imageViewerIndex]}
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
                                    disabled={formData.repairPhotos.length < 2}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <span className="text-gray-700 text-sm">
                                    {imageViewerIndex + 1} / {formData.repairPhotos.length}
                                </span>
                                <button
                                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                                    onClick={imageViewerNextPhoto}
                                    disabled={formData.repairPhotos.length < 2}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <style>{`
                    .sticky-nav {
                        position: fixed;
                        left: 160px;
                        top: 33%;
                        z-index: 100;
                    }
                `}</style>
            </div>
        </>
    );
};

export default RepairForm;
