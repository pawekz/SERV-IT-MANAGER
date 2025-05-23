"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function RepairCheckinForm() {
    const navigate = useNavigate()
    const [ticketNumber] = useState(
        `TKT-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`,
    )
    const [photoFile, setPhotoFile] = useState(null)

    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0])
        }
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="border-2 border-gray-200 shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gray-100 border-b border-gray-200 p-4">
                    <h1 className="text-center text-2xl font-bold">TECH REPAIR SERVICE</h1>
                    <p className="text-center text-gray-600">Repair Check-In Form</p>
                </div>
                <div className="p-6">
                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* Header with Ticket Number */}
                        <div className="flex flex-col md:flex-row justify-between mb-6">
                            <div className="text-xl font-semibold text-gray-800">Customer Check-In</div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                <span className="text-sm font-medium">Ticket #:</span>
                                <input
                                    value={ticketNumber}
                                    readOnly
                                    className="w-40 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* Customer Information Section */}
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
                                        placeholder="Enter full name"
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
                                        placeholder="Enter email address"
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
                                        placeholder="Enter phone number"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Device Information Section */}
                        <div className="mb-6">
                            <div className="bg-gray-100 p-2 mb-4 border-l-4 border-[#33e407]">
                                <h2 className="font-bold text-gray-800">DEVICE INFORMATION</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700">
                                        Device Type:
                                    </label>
                                    <input
                                        id="deviceType"
                                        placeholder="e.g., Laptop, Phone"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                                        Brand:
                                    </label>
                                    <input
                                        id="brand"
                                        placeholder="e.g., Apple, Samsung"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                                        Model:
                                    </label>
                                    <input
                                        id="model"
                                        placeholder="e.g., iPhone 13, XPS 15"
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
                                        placeholder="Enter serial number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                                        Color:
                                    </label>
                                    <input
                                        id="color"
                                        placeholder="e.g., Black, Silver"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password:
                                    </label>
                                    <input
                                        id="password"
                                        placeholder="Device password (if provided)"
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
                                        placeholder="Please describe the issues you're experiencing with your device"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent min-h-[100px]"
                                        required
                                    ></textarea>
                                </div>
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
                            </div>
                        </div>

                        {/* Device Condition Section */}
                        <div className="mb-6">
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
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">Upload photos of device condition</p>
                                        <div>
                                            <label htmlFor="photo-upload" className="cursor-pointer">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 bg-white border border-[#33e407] text-[#33e407] rounded-md hover:bg-gray-50 hover:text-[#2bc106] focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:ring-offset-2"
                                                >
                                                    Upload Photo
                                                </button>
                                                <input
                                                    id="photo-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handlePhotoUpload}
                                                />
                                            </label>
                                        </div>
                                        {photoFile && <p className="text-sm text-gray-600 mt-2">Selected: {photoFile.name}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="mb-6">
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#33e407] focus:ring-[#33e407]"
                                    required
                                />
                                <label className="text-sm text-gray-600">
                                    I have read and agree to the repair <a href="/termseditor" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline cursor-pointer hover:text-blue-800">terms and conditions</a>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => navigate('/signature')}
                                className="px-6 py-2 bg-[#33e407] hover:bg-[#2bc106] text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:ring-offset-2"
                            >
                                Submit Repair Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

// /test/
