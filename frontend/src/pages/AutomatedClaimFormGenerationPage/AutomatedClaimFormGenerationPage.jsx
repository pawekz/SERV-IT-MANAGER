// "use client"

import { useState } from "react"
import { LayoutGrid, Users, Monitor, Wrench, FileText, Clock, UserPlus, Settings, Download, Edit } from "lucide-react"

export default function AutomatedClaimForm() {
    const [sidebarExpanded, setSidebarExpanded] = useState(false)

    const toggleSidebar = () => {
        setSidebarExpanded(!sidebarExpanded)
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`fixed h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 
        ${sidebarExpanded ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-[70px] lg:w-64"}`}
            >
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div className="font-bold text-xl text-gray-800">
                        IO
                        <span className={`${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"} text-[#33e407]`}>
                            CONNECT
                        </span>
                    </div>
                    <button onClick={toggleSidebar} className="md:block text-gray-600 hover:text-gray-900">
                        ≡
                    </button>
                </div>

                <div className="py-5 overflow-y-auto h-[calc(100vh-70px)]">
                    {/* Main Section */}
                    <div className="mb-6">
                        <div
                            className={`px-5 text-xs font-semibold text-gray-500 uppercase mb-2 ${sidebarExpanded ? "block" : "hidden md:hidden lg:block"}`}
                        >
                            Main
                        </div>
                        <ul>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <LayoutGrid size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Dashboard
                                    </span>
                                </a>
                            </li>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <Users size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Customers
                                    </span>
                                </a>
                            </li>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <Monitor size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Devices
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Service Section */}
                    <div className="mb-6">
                        <div
                            className={`px-5 text-xs font-semibold text-gray-500 uppercase mb-2 ${sidebarExpanded ? "block" : "hidden md:hidden lg:block"}`}
                        >
                            Service
                        </div>
                        <ul>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <Wrench size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Repairs
                                    </span>
                                </a>
                            </li>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 bg-green-50 text-[#33e407] border-l-3 border-[#33e407]"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <FileText size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Claim Forms
                                    </span>
                                </a>
                            </li>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <Clock size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Service History
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Administration Section */}
                    <div className="mb-6">
                        <div
                            className={`px-5 text-xs font-semibold text-gray-500 uppercase mb-2 ${sidebarExpanded ? "block" : "hidden md:hidden lg:block"}`}
                        >
                            Administration
                        </div>
                        <ul>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <UserPlus size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        User Management
                                    </span>
                                </a>
                            </li>
                            <li className="mb-0.5">
                                <a
                                    href="#"
                                    className="flex items-center px-5 py-2.5 text-gray-600 hover:bg-green-50 hover:text-[#33e407] border-l-3 border-transparent"
                                >
                                    <div className="flex items-center justify-center w-5 h-5 mr-3">
                                        <Settings size={18} />
                                    </div>
                                    <span className={`text-sm ${sidebarExpanded ? "inline" : "hidden md:hidden lg:inline"}`}>
                                        Settings
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-[#33e407] font-semibold text-sm mr-3">
                            TM
                        </div>
                        <div className={`${sidebarExpanded ? "block" : "hidden md:hidden lg:block"}`}>
                            <div className="text-sm font-medium text-gray-800">Tech Manager</div>
                            <div className="text-xs text-gray-500">Manager</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Sidebar Overlay */}
            {sidebarExpanded && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={toggleSidebar}></div>}

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 ${sidebarExpanded ? "ml-0 md:ml-0" : "ml-0 md:ml-[70px] lg:ml-64"}`}
            >
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 bg-white shadow-sm md:hidden">
                    <button onClick={toggleSidebar} className="text-gray-600 text-2xl">
                        ☰
                    </button>
                    <div className="font-bold text-xl">
                        IO<span className="text-[#33e407]">CONNECT</span>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Automated Claim Form</h1>
                        <p className="text-gray-600 text-sm max-w-3xl">
                            Review the automatically generated claim form with prefilled customer, device, and repair details. You can
                            export or download the form as PDF for printing or digital submission.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-base font-semibold text-gray-800">Claim Form Preview</h2>
                            <div>
                                <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[#33e407] text-white rounded-md text-sm font-medium hover:bg-[#2bc906] transition-colors">
                                    <Download size={16} className="mr-2" />
                                    Download PDF
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            {/* Preview Container */}
                            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                                    <div className="text-2xl font-bold">
                                        IO<span className="text-[#33e407]">CONNECT</span>
                                    </div>
                                    <div className="text-sm">
                                        <div>Claim #: CL-2025-0042</div>
                                        <div>Date: 03/24/2025</div>
                                    </div>
                                </div>

                                <h2 className="text-xl font-semibold text-center mb-5">Device Repair Claim Form</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <div>
                                        <div className="font-semibold text-gray-800 mb-2">Customer Information</div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Name:</span>
                                            <span>Sarah Johnson</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Email:</span>
                                            <span>sarah.johnson@example.com</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Phone:</span>
                                            <span>(555) 123-4567</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Address:</span>
                                            <span>
                                                123 Main Street, Apt 4B
                                                <br />
                                                New York, NY 10001
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="font-semibold text-gray-800 mb-2">Device Information</div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Device Type:</span>
                                            <span>Smartphone</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Brand/Model:</span>
                                            <span>iPhone 13 Pro</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Serial Number:</span>
                                            <span>IMEI: 352789104563214</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Purchase Date:</span>
                                            <span>06/15/2023</span>
                                        </div>
                                        <div className="text-sm mb-1">
                                            <span className="inline-block font-medium min-w-[120px]">Warranty Status:</span>
                                            <span>In Warranty (Valid until 06/15/2025)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <div className="font-semibold text-gray-800 mb-2">Repair Details</div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="text-left p-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
                                                        Issue Description
                                                    </th>
                                                    <th className="text-left p-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
                                                        Repair Type
                                                    </th>
                                                    <th className="text-left p-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
                                                        Parts Required
                                                    </th>
                                                    <th className="text-left p-2.5 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
                                                        Cost
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="p-2.5 border-b border-gray-200">Cracked screen with display malfunction</td>
                                                    <td className="p-2.5 border-b border-gray-200">Screen Replacement</td>
                                                    <td className="p-2.5 border-b border-gray-200">iPhone 13 Pro OLED Display Assembly</td>
                                                    <td className="p-2.5 border-b border-gray-200">$279.99</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2.5 border-b border-gray-200">Battery draining quickly</td>
                                                    <td className="p-2.5 border-b border-gray-200">Battery Replacement</td>
                                                    <td className="p-2.5 border-b border-gray-200">iPhone 13 Pro Battery</td>
                                                    <td className="p-2.5 border-b border-gray-200">$89.99</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <div className="font-semibold text-gray-800 mb-2">Additional Notes</div>
                                    <p className="text-sm text-gray-600">
                                        Customer reported that the device was dropped from approximately 3 feet onto a hard surface. The
                                        screen cracked and touch functionality is intermittent. Battery was already showing signs of
                                        degradation before the incident. Device has been backed up by the customer.
                                    </p>
                                </div>

                                <div className="mt-10 pt-5 border-t border-gray-200 flex flex-col md:flex-row justify-between">
                                    <div className="w-full md:w-48 mb-5 md:mb-0">
                                        <div className="border-b border-gray-300 h-10 mb-2"></div>
                                        <div className="text-xs text-gray-500">Customer Signature</div>
                                    </div>
                                    <div className="w-full md:w-48">
                                        <div className="border-b border-gray-300 h-10 mb-2"></div>
                                        <div className="text-xs text-gray-500">Technician Signature</div>
                                    </div>
                                </div>
                            </div>

                            {/* Form Sections */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <h3 className="flex items-center text-base font-semibold text-gray-800 mb-4">
                                    <Users size={18} className="mr-2" />
                                    Customer Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="Sarah Johnson"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="sarah.johnson@example.com"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="(555) 123-4567"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Address</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="123 Main Street, Apt 4B, New York, NY 10001"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <h3 className="flex items-center text-base font-semibold text-gray-800 mb-4">
                                    <Monitor size={18} className="mr-2" />
                                    Device Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Device Type</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="Smartphone"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Brand/Model</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="iPhone 13 Pro"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Serial Number/IMEI</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="IMEI: 352789104563214"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Purchase Date</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="06/15/2023"
                                            disabled
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Warranty Status</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            value="In Warranty (Valid until 06/15/2025)"
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="flex items-center text-base font-semibold text-gray-800 mb-4">
                                    <Wrench size={18} className="mr-2" />
                                    Repair Details
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Issue Description</label>
                                        <textarea
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            rows={3}
                                            disabled
                                            defaultValue="Cracked screen with display malfunction. Battery draining quickly."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Repair Type</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                                value="Screen Replacement, Battery Replacement"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-1.5 text-sm font-medium text-gray-700">Estimated Cost</label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                                value="$369.98"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-1.5 text-sm font-medium text-gray-700">Additional Notes</label>
                                        <textarea
                                            className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-800 disabled:cursor-not-allowed"
                                            rows={3}
                                            disabled
                                            defaultValue="Customer reported that the device was dropped from approximately 3 feet onto a hard surface. The screen cracked and touch functionality is intermittent. Battery was already showing signs of degradation before the incident. Device has been backed up by the customer."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                                    <Edit size={16} className="mr-2" />
                                    Edit Form
                                </button>
                                <button className="inline-flex items-center justify-center px-4 py-2.5 bg-[#33e407] text-white rounded-md text-sm font-medium hover:bg-[#2bc906] transition-colors">
                                    <Download size={16} className="mr-2" />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
