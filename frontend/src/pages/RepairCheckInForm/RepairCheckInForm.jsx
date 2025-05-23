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


            <ol className="flex items-center w-full">
                <li className="flex w-full items-center text-[#33e407] dark:text-[#33e407] after:content-[''] after:w-full after:h-1 after:border-b after:border-[#33e407]/20 after:border-4 after:inline-block dark:after:border-[#33e407]/40">
        <span
            className="flex items-center justify-center w-10 h-10 bg-[#33e407]/20 rounded-full lg:h-12 lg:w-12 dark:bg-[#33e407]/30 shrink-0">
            <svg className="w-3.5 h-3.5 text-[#33e407] lg:w-4 lg:h-4 dark:text-[#33e407]" aria-hidden="true"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M1 5.917 5.724 10.5 15 1.5"/>
            </svg>
        </span>
                </li>
                <li className="flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-100 after:border-4 after:inline-block dark:after:border-gray-700">
        <span
            className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full lg:h-12 lg:w-12 dark:bg-gray-700 shrink-0">
            <svg className="w-4 h-4 text-gray-500 lg:w-5 lg:h-5 dark:text-gray-100" aria-hidden="true"
                 xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                <path
                    d="M18 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2ZM6.5 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.014 13.021l.157-.625A3.427 3.427 0 0 1 6.5 9.571a3.426 3.426 0 0 1 3.322 2.805l.159.622-6.967.023ZM16 12h-3a1 1 0 0 1 0-2h3a1 1 0 0 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Zm0-3h-3a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2Z"/>
            </svg>
        </span>
                </li>
                <li className="flex items-center w-full">
        <span
            className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full lg:h-12 lg:w-12 dark:bg-gray-700 shrink-0">
            <svg className="w-4 h-4 text-gray-500 lg:w-5 lg:h-5 dark:text-gray-100" aria-hidden="true"
                 xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                <path
                    d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2ZM7 2h4v3H7V2Zm5.7 8.289-3.975 3.857a1 1 0 0 1-1.393 0L5.3 12.182a1.002 1.002 0 1 1 1.4-1.436l1.328 1.289 3.28-3.181a1 1 0 1 1 1.392 1.435Z"/>
            </svg>
        </span>
                </li>
            </ol>


            {/*Main Content*/}
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
                                    <label htmlFor="technicianObservations"
                                           className="block text-sm font-medium text-gray-700">
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
                                        <div
                                            className="mx-auto bg-gray-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                                            <Upload className="h-8 w-8 text-[#33e407]"/>
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
                                        {photoFile &&
                                            <p className="text-sm text-gray-600 mt-2">Selected: {photoFile.name}</p>}
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
                                    I have read and agree to the repair <a href="/termseditor" target="_blank"
                                                                           rel="noopener noreferrer"
                                                                           className="text-blue-600 underline cursor-pointer hover:text-blue-800">terms
                                    and conditions</a>
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
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

// /test/

