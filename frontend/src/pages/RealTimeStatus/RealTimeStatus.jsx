"use client"

import { useState, useEffect } from "react"
import { useLocation } from 'react-router-dom'
import api from "../../services/api.jsx"
import Sidebar from "../../components/SideBar/Sidebar.jsx"
import BeforePicturesGallery from '../../components/BeforePictures/BeforePicturesGallery.jsx'

const RealTimeStatus = () => {
    const location = useLocation()
    const ticketNumberParam = location.state?.ticketNumber || null

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("All")
    const [dateRange, setDateRange] = useState("All Time")

    const statusOrder = [
        "RECEIVED",
        "DIAGNOSING",
        "AWAITING_PARTS",
        "REPAIRING",
        "READY_FOR_PICKUP",
        "COMPLETED",
    ]

    const [history, setHistory] = useState([])
    const [currentStatus, setCurrentStatus] = useState(null)
    const [ticketDetails, setTicketDetails] = useState(null)

    useEffect(() => {
        const fetchHistory = async () => {
            if (!ticketNumberParam) return
            try {
                const { data } = await api.get(`/repairTicket/getRepairStatusHistory/${ticketNumberParam}`)
                setHistory(data)
                if (data && data.length > 0) {
                    setCurrentStatus(data[0].repairStatus)
                }
            } catch (e) {
                console.error("Failed to fetch history", e)
            }
        }
        fetchHistory()

        const fetchDetails = async () => {
            if (!ticketNumberParam) return;
            try {
                const { data } = await api.get(`/repairTicket/getRepairTicket/${ticketNumberParam}`);
                setTicketDetails(data);
            } catch (e) {
                console.error('Failed to fetch ticket details', e);
            }
        };
        fetchDetails();
    }, [ticketNumberParam])

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

                {/* Stepper */}
                {ticketNumberParam && (
                    <div className="flex justify-center mb-8">
                        <ol className="flex flex-wrap items-center gap-6 max-w-full">
                            {statusOrder.map((step, idx) => {
                                const reached = currentStatus ? statusOrder.indexOf(currentStatus) >= idx : idx === 0;
                                const activeColor = reached ? "border-blue-600 text-blue-600" : "border-gray-500 text-gray-500"
                                return (
                                    <li key={step} className={`flex items-center space-x-2.5 rtl:space-x-reverse ${activeColor}`}>
                                        <span className={`flex items-center justify-center w-8 h-8 border rounded-full shrink-0 ${activeColor}`}>
                                            {idx + 1}
                                        </span>
                                        <span>
                                            <h3 className="font-medium leading-tight capitalize">{step.replace(/_/g, ' ').toLowerCase()}</h3>
                                        </span>
                                    </li>
                                )
                            })}
                        </ol>
                    </div>
                )}

                {!ticketNumberParam && (
                    <div className="flex justify-center mb-8">
                        <ol className="flex flex-wrap items-center gap-6 max-w-full">
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
                    </div>
                )}

                {/* History list for ticket */}
                {ticketNumberParam && history.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Status History</h2>
                        <ul className="space-y-4">
                            {history.map((h, idx) => (
                                <li key={idx} className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-medium capitalize">{h.repairStatus.replace(/_/g, ' ').toLowerCase()}</p>
                                        {h.notes && <p className="text-sm text-gray-500">Notes: {h.notes}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-700">{h.updatedBy}</p>
                                        <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Ticket Details */}
                {ticketNumberParam && ticketDetails && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 max-w-3xl mx-auto">
                        <h2 className="text-lg font-semibold mb-4">Ticket Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Ticket #:</span> {ticketDetails.ticketNumber}
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Check-in Date:</span> {ticketDetails.checkInDate}
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Device:</span> {`${ticketDetails.deviceType} • ${ticketDetails.deviceBrand} ${ticketDetails.deviceModel}`}
                            </div>
                            <div className="sm:col-span-2">
                                <span className="font-medium text-gray-700">Reported Issue:</span> {ticketDetails.reportedIssue}
                            </div>
                        </div>
                    </div>
                )}

                {ticketDetails && ticketDetails.repairPhotosUrls && ticketDetails.repairPhotosUrls.length > 0 && (
                    <BeforePicturesGallery photos={ticketDetails.repairPhotosUrls} />
                )}

                {/* Repair Cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {/* --- Sample repair data & cards moved to SampleRepairCards component --- */}
                    {/*
                    <SampleRepairCards />
                    */}
                </div>

                {/* No Results */}
                {/* filteredRepairs.length === 0 && (
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
                )} */}
            </div>
        </div>
    )
}

export default RealTimeStatus
