import React, { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RepairForm = ({ status, onNext  }) => {
    const role = localStorage.getItem("userRole")?.toLowerCase();
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    let readonly;

    if (role === "admin") {
        readonly = false;
    }

    const navigate = useNavigate();

    const [ticketNumber] = useState(
        `TKT-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`
    );
    const [photoFile, setPhotoFile] = useState(null);

    const [formData, setFormData] = useState({
        repairTicketId:"",
        fullName: "",
        email: "",
        phoneNumber: "",
        deviceType: "",
        deviceBrand: "",
        deviceModel: "",
        deviceSerialNumber: "",
        deviceColor: "",
        devicePassword: "",
        accessories:"",
        reportedIssue: "",
        technicianObservations: "",
        technicianEmail: userData.email || "",
        technicianName: userData.firstName + " " + userData.lastName || "",
        repairPhotos:""
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            console.log("File selected:", e.target.files[0]);
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        sessionStorage.setItem('repairTicket', JSON.stringify(formData));
        sessionStorage.setItem('cameFromCheckIn', 'true');
        navigate("/newrepair");
    }

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const fetchRepairTicketId = async () => {
            try {
                setLoading(true);

                // Check if we have cached user data in sessionStorage first
                const cachedUserData = sessionStorage.getItem('repairTicket');
                if (cachedUserData) {
                    const parsedData = JSON.parse(cachedUserData);
                    setFormData(parsedData);
                    setLoading(false);
                    return;
                }

                // Get token from localStorage if no cached data
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error("Not authenticated. Please log in.");
                }

                const response = await fetch(`http://localhost:8080/repairTicket/generateRepairTicketNumber`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.text();
                console.log(data)

                setFormData((prev) => ({
                    ...prev,
                    repairTicketId: data
                }));

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchRepairTicketId();
    }, []);


    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="border-2 border-gray-200 shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gray-100 border-b border-gray-200 p-4">
                    <h1 className="text-center text-2xl font-bold">OICONNECT REPAIR SERVICE</h1>
                    <p className="text-center text-gray-600">Repair Check-In Form</p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Header with Ticket Number */}
                        <div className="flex flex-col md:flex-row justify-between mb-6">
                            <div className="text-xl font-semibold text-gray-800">Customer Check-In</div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                <span className="text-sm font-medium">Ticket #:</span>
                                <input
                                    value={formData.repairTicketId}
                                    readOnly
                                    className="w-40 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">CUSTOMER INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name:</label>
                                    <input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email address"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone:</label>
                                    <input
                                        id="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Device Information */}
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Device Type */}
                                <div className="space-y-2">
                                    <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700">Device Type:</label>
                                    <select
                                        id="deviceType"
                                        value={formData.deviceType}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] bg-white"
                                    >
                                        <option value="" disabled hidden>Select device type</option>
                                        <option value="LAPTOP">LAPTOP</option>
                                        <option value="COMPUTER">COMPUTER</option>
                                        <option value="PRINTER">PRINTER</option>
                                    </select>
                                </div>

                                {/* Brand */}
                                <div className="space-y-2">
                                    <label htmlFor="deviceBrand" className="block text-sm font-medium text-gray-700">Brand:</label>
                                    <input
                                        id="deviceBrand"
                                        value={formData.deviceBrand}
                                        onChange={handleChange}
                                        placeholder="Enter brand"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>

                                {/* Model */}
                                <div className="space-y-2">
                                    <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-700">Model:</label>
                                    <input
                                        id="deviceModel"
                                        value={formData.deviceModel}
                                        onChange={handleChange}
                                        placeholder="Enter model"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>

                                {/* Serial Number */}
                                <div className="space-y-2">
                                    <label htmlFor="deviceSerialNumber" className="block text-sm font-medium text-gray-700">Serial Number:</label>
                                    <input
                                        id="deviceSerialNumber"
                                        value={formData.deviceSerialNumber}
                                        onChange={handleChange}
                                        placeholder="Enter serial number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <label htmlFor="deviceColor" className="block text-sm font-medium text-gray-700">Color:</label>
                                    <input
                                        id="deviceColor"
                                        value={formData.deviceColor}
                                        onChange={handleChange}
                                        placeholder="Enter color"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                                    />
                                </div>

                                {/* Password */}
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

                        {/* Accessories */}
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
                                        placeholder="Describe the issues you're experiencing"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Problem Description */}
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
                                        <label htmlFor="technicianObservations" className="block text-sm font-medium text-gray-700">Technician Observations:</label>
                                        <textarea
                                            id="technicianObservations"
                                            value={formData.technicianObservations}
                                            onChange={handleChange}
                                            placeholder="Technician notes (optional)"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] min-h-[100px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Device Condition - Photo Upload */}
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
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Upload photos of device condition</p>
                                    <label
                                        htmlFor="photo-upload"
                                        className="cursor-pointer inline-block px-4 py-2 bg-white border border-green-600 text-green-600 rounded-md hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-600"
                                    >
                                        Upload Photo
                                    </label>
                                        <input
                                            id="photo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoUpload}
                                        />
                                    {photoFile && (
                                        <p className="text-sm text-gray-600 mt-2">Selected: {photoFile.name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                onClick={onNext}
                                className="px-6 py-2 bg-[#33e407] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407]"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RepairForm;