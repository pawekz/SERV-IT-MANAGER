import React, {useEffect, useState} from "react";
import {Upload} from "lucide-react";

const WarrantyRequest = ({ isOpen, onClose,data = {}, readonly  }) => {
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [agreed, setAgreed] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);

    if (role === "admin"){
        readonly = false;
    }

    useEffect(() => {
        if (readonly) {
            setAgreed(true);
        }
    }, [readonly]);

    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0])
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle form submission logic here
        alert("Form submitted successfully!")
    }

    const reasonsList = [
        "Defective/Not Working",
        "Wrong Item Received",
        "Performance Issues",
        "Physical Damage",
        "Upgrade Request",
        "Other",
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div
                className={`bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh]
                transform transition-all duration-700 scale-95 opacity-0 ${isOpen ? 'scale-100 opacity-100' : ''}`}
            >
            <div className="border-2 border-gray-200 shadow-lg rounded-lg overflow-y-auto max-h-[90vh]">
                <div className="bg-gray-100 border-b border-gray-200 p-4">
                    <h1 className="text-center text-2xl font-bold">RETURN REQUEST FORM</h1>
                </div>
                <div className="p-6">
                    <form>
                        {/* Header with Ticket Number */}


                            <div className="mb-4">
                                <div className="flex flex-col md:flex-row justify-between mb-6">
                                    <div className="text-xl font-semibold text-gray-800">Warranty: {data.warrantyNumber}</div>
                                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                                        <span className="text-sm font-medium">Status:</span>
                                        <input
                                            value={data.status}
                                            readOnly
                                            className={`text-50 font-semibold text-gray-800 ${data.status === "Requested" || data.status === "Denied" ? "text-yellow-600" : "text-green-600"}`}
                                        />
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
                                        readOnly={readonly}
                                        required
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
                                        readOnly={readonly}
                                        required
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
                                        readOnly={readonly}
                                        required
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
                                        readOnly={readonly}
                                        required
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
                                        readOnly={readonly}
                                        required
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
                                        readOnly={readonly}
                                        required
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
                                        readOnly={readonly}
                                        required
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
                                        checked={data.returnReason === label}
                                        disabled
                                        className="accent-green-600 cursor-default"
                                    />
                                    <span className={`${data.returnReason === label ? 'text-green-700 font-medium' : ''}`}>
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {!readonly && role === "customer" && (
                        <p className="text-sm italic text-green-500 mb-2">
                            * Note: Device must be brought to the office for diagnosis and repair processing.
                        </p>)}

                        {/* Device Condition Section */}
                        {role !=="customer" && (
                        <div className="mb-6 mt-5">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE CONDITION</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <div className="mb-4">
                                        <div className="mx-auto bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                                            <Upload className="h-8 w-8 text-[#33e407]" />
                                        </div>
                                    </div>
                                    {!readonly && (
                                        <div>
                                            <label htmlFor="photo-upload" className="cursor-pointer">
                                                <button type="button" className="...">Upload Photo</button>
                                                <input
                                                    id="photo-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePhotoUpload}
                                                />
                                            </label>
                                        </div>
                                    )}
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
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    disabled={readonly}
                                    required={!readonly}
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600">
                                    I have read and agree to the repair <span>terms and conditions</span>
                                </label>
                            </div>
                        </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 mr-3">Close</button>
                            {role === "admin" && !readonly && (
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-[#33e407] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:ring-offset-2"
                                >
                                    Confirm Repair Request
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
        </div>
    );
};

export default WarrantyRequest;
