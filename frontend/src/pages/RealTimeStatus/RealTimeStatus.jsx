"use client"

import { useState } from "react"
import Sidebar from "../../components/SideBar/Sidebar.jsx"

const RealTimeStatus = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [dateRange, setDateRange] = useState("All Time")

    // Sample repair data
    const repairs = [
        {
            id: "RT-8742",
            item: "Dell Laptop",
            submitted: "05/10/2025",
            status: "Repairing",
            lastUpdated: "05/12/2025",
            progress: 60,
            technician: "John Paulo",
            estimatedCompletion: "05/13/2025",
            notes: "Display and battery replaced. Testing in progress.",
        },
        {
            id: "RT-8721",
            item: "MacBook Air",
            submitted: "05/05/2025",
            status: "Ready for Pickup",
            lastUpdated: "05/11/2025",
            progress: 100,
            technician: "Reene Doe",
            estimatedCompletion: "05/11/2025",
            notes: "Keyboard replacement completed. Quality check passed.",
        },
        {
            id: "RT-8689",
            item: "HP Printer",
            submitted: "04/28/2025",
            status: "Completed",
            lastUpdated: "05/03/2025",
            progress: 100,
            technician: "Kyle Doe",
            estimatedCompletion: "05/03/2025",
            notes: "Screen repair completed. Device picked up by customer.",
        },
    ]

    const getStatusColor = (status) => {
        switch (status) {
            case "Received":
                return "bg-purple-100 text-purple-800 border-purple-200"
            case "Diagnosing":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "Awaiting Parts":
                return "bg-orange-100 text-orange-800 border-orange-200"
            case "Repairing":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "Ready for Pickup":
                return "bg-green-100 text-green-800 border-green-200"
            case "Completed":
                return "bg-gray-100 text-gray-800 border-gray-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getProgressColor = (progress) => {
        if (progress === 100) return "bg-[#33e407]"
        if (progress >= 60) return "bg-yellow-500"
        return "bg-blue-500"
    }

    const filteredRepairs = repairs.filter((repair) => {
        const matchesSearch =
            repair.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
            repair.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "All" || repair.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const resetFilters = () => {
        setSearchTerm("")
        setStatusFilter("All")
        setDateRange("All Time")
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-[250px] p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Repairs Status Dashboard</h1>
                    <p className="text-gray-600">Track the progress of your repair requests in real-time</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Repairs</label>
                            <input
                                type="text"
                                placeholder="Search by item or ticket..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Received">Received</option>
                                <option value="Diagnosing">Diagnosing</option>
                                <option value="Awaiting Parts">Awaiting Parts</option>
                                <option value="Repairing">Repairing</option>
                                <option value="Ready for Pickup">Ready for Pickup</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                            >
                                <option value="All Time">All Time</option>
                                <option value="Last 7 Days">Last 7 Days</option>
                                <option value="Last 30 Days">Last 30 Days</option>
                                <option value="Last 90 Days">Last 90 Days</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={resetFilters}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stepper */}
                <ol className="items-center w-full space-y-4 sm:flex sm:space-x-8 sm:space-y-0 rtl:space-x-reverse mb-6">
                    {/* Step 1 - Received */}
                    <li className="flex items-center text-blue-600 dark:text-blue-500 space-x-2.5 rtl:space-x-reverse">
                        <span className="flex items-center justify-center w-8 h-8 border border-blue-600 rounded-full shrink-0 dark:border-blue-500">
                            1
                        </span>
                        <span>
                            <h3 className="font-medium leading-tight">Received</h3>
                        </span>
                    </li>
                    
                    {/* Step 2 - Diagnosed */}
                    <li className="flex items-center text-gray-500 dark:text-gray-400 space-x-2.5 rtl:space-x-reverse">
                        <span className="flex items-center justify-center w-8 h-8 border border-gray-500 rounded-full shrink-0 dark:border-gray-400">
                            2
                        </span>
                        <span>
                            <h3 className="font-medium leading-tight">Diagnosed</h3>
                        </span>
                    </li>
                    
                    {/* Step 3 - Awaiting Parts */}
                    <li className="flex items-center text-gray-500 dark:text-gray-400 space-x-2.5 rtl:space-x-reverse">
                        <span className="flex items-center justify-center w-8 h-8 border border-gray-500 rounded-full shrink-0 dark:border-gray-400">
                            3
                        </span>
                        <span>
                            <h3 className="font-medium leading-tight">Awaiting Parts</h3>
                        </span>
                    </li>

                    {/* Step 4 - Repairing */}
                    <li className="flex items-center text-gray-500 dark:text-gray-400 space-x-2.5 rtl:space-x-reverse">
                        <span className="flex items-center justify-center w-8 h-8 border border-gray-500 rounded-full shrink-0 dark:border-gray-400">
                            4
                        </span>
                        <span>
                            <h3 className="font-medium leading-tight">Repairing</h3>
                        </span>
                    </li>

                    {/* Step 5 - Ready For Pickup */}
                    <li className="flex items-center text-gray-500 dark:text-gray-400 space-x-2.5 rtl:space-x-reverse">
                        <span className="flex items-center justify-center w-8 h-8 border border-gray-500 rounded-full shrink-0 dark:border-gray-400">
                            5
                        </span>
                        <span>
                            <h3 className="font-medium leading-tight">Ready For Pickup</h3>
                        </span>
                    </li>

                    {/* Step 6 - Completed */}
                    <li className="flex items-center text-gray-500 dark:text-gray-400 space-x-2.5 rtl:space-x-reverse">
                        <span className="flex items-center justify-center w-8 h-8 border border-gray-500 rounded-full shrink-0 dark:border-gray-400">
                            6
                        </span>
                        <span>
                            <h3 className="font-medium leading-tight">Completed</h3>
                        </span>
                    </li>
                </ol>

                {/* Repair Cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {filteredRepairs.map((repair) => (
                        <div
                            key={repair.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                        >
                            {/* Card Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{repair.item}</h3>
                                        <p className="text-sm text-gray-500">Ticket #{repair.id}</p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(repair.status)}`}
                                    >
                                        {repair.status}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-700">Progress</span>
                                        <span className="text-xs text-gray-500">{repair.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(repair.progress)}`}
                                            style={{ width: `${repair.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Submitted:</span>
                                        <span className="text-sm font-medium text-gray-900">{repair.submitted}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Last Updated:</span>
                                        <span className="text-sm font-medium text-gray-900">{repair.lastUpdated}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Technician:</span>
                                        <span className="text-sm font-medium text-gray-900">{repair.technician}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Est. Completion:</span>
                                        <span className="text-sm font-medium text-gray-900">{repair.estimatedCompletion}</span>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                    <p className="text-xs text-gray-600 font-medium mb-1">Notes:</p>
                                    <p className="text-sm text-gray-700">{repair.notes}</p>
                                </div>

                                {/* Action Button */}
                                <button className="w-full mt-4 px-4 py-2 bg-[#33e407] text-white rounded-md hover:bg-[#2bc406] transition-colors duration-200 font-medium">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Results */}
                {filteredRepairs.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No repairs found</h3>
                        <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RealTimeStatus
