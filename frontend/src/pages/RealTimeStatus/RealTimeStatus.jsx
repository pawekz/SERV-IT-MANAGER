"use client"

import { useState, useEffect, useRef } from "react"
import { useLocation, Link } from 'react-router-dom'
import api from "../../config/ApiConfig.jsx"
import Sidebar from "../../components/SideBar/Sidebar.jsx"
import BeforePicturesGallery from '../../components/BeforePictures/BeforePicturesGallery.jsx'
import AfterPicturesGallery from '../DashboardPage/CustomerDashboardComponents/AfterPicturesGallery.jsx'
import { connectWebSocket, subscribeToTopic, unsubscribeFromTopic } from '../../config/WebSocketConfig.jsx'
import { usePartPhoto } from '../../hooks/usePartPhoto.js'
import { Package, Wrench, ClipboardCheck, FileText, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

// PartPhoto component for displaying part images
const PartPhoto = ({ partId, photoUrl, className = "w-20 h-20 object-cover rounded-lg border border-gray-200" }) => {
    const { data: src, isLoading, isError } = usePartPhoto(partId, photoUrl);
    
    if (isLoading) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center animate-pulse`}>
                <span className="text-xs text-gray-400">Loading...</span>
            </div>
        );
    }
    
    if (isError || !src) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center`}>
                <Package size={24} className="text-gray-400" />
            </div>
        );
    }
    
    return <img src={src} alt="Part" className={className} onError={() => {}} />;
};

const RealTimeStatus = () => {
    const location = useLocation()
    const ticketNumberParam = location.state?.ticketNumber || null
    const prevStatusRef = useRef(null)

    const [history, setHistory] = useState([])
    const [currentStatus, setCurrentStatus] = useState(null)
    const [ticketDetails, setTicketDetails] = useState(null)
    const [quotation, setQuotation] = useState(null)
    const [quotationParts, setQuotationParts] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusTransition, setStatusTransition] = useState(false)

    const statusOrder = [
        "RECEIVED",
        "DIAGNOSING",
        "AWAITING_PARTS",
        "REPAIRING",
        "READY_FOR_PICKUP",
        "COMPLETED",
    ]

    // Helper function to normalize status
    const normalizeStatus = (status) => {
        if (!status) return null
        return status.toUpperCase().trim()
    }

    // Fetch all data
    const fetchData = async () => {
        if (!ticketNumberParam) {
            setLoading(false)
            return
        }

        try {
            // Fetch ticket details first (primary source for current status)
            let ticketData = null
            try {
                const { data } = await api.get(`/repairTicket/getRepairTicket/${ticketNumberParam}`)
                ticketData = data
                setTicketDetails(data)
                
                // Use ticket's repairStatus as the primary source
                if (data && data.repairStatus) {
                    const newStatus = normalizeStatus(data.repairStatus)
                    if (newStatus && statusOrder.includes(newStatus)) {
                        if (prevStatusRef.current && prevStatusRef.current !== newStatus) {
                            setStatusTransition(true)
                            setTimeout(() => setStatusTransition(false), 600)
                        }
                        setCurrentStatus(newStatus)
                        prevStatusRef.current = newStatus
                    } else {
                        console.warn('Unknown status from ticket:', data.repairStatus, 'Expected one of:', statusOrder)
                    }
                }
            } catch (e) {
                console.error('Failed to fetch ticket details', e)
            }

            // Fetch history (fallback if ticket details don't have status)
            try {
                const { data: historyData } = await api.get(`/repairTicket/getRepairStatusHistory/${ticketNumberParam}`)
                setHistory(historyData || [])
                
                // Only use history status if we don't have one from ticket details
                if (!ticketData?.repairStatus && historyData && historyData.length > 0) {
                    const newStatus = normalizeStatus(historyData[0].repairStatus)
                    if (newStatus && statusOrder.includes(newStatus)) {
                        if (prevStatusRef.current && prevStatusRef.current !== newStatus) {
                            setStatusTransition(true)
                            setTimeout(() => setStatusTransition(false), 600)
                        }
                        setCurrentStatus(newStatus)
                        prevStatusRef.current = newStatus
                    }
                }
            } catch (e) {
                console.error("Failed to fetch history", e)
            }

            // Fetch quotation if status requires it
            try {
                const { data: quotationData } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketNumberParam}`)
                if (quotationData && quotationData.length > 0) {
                    const latestQuotation = quotationData[0]
                    setQuotation(latestQuotation)
                    
                    // Fetch part details
                    const allPartIds = [
                        ...(Array.isArray(latestQuotation.recommendedPart) ? latestQuotation.recommendedPart : (latestQuotation.recommendedPart ? [latestQuotation.recommendedPart] : [])),
                        ...(Array.isArray(latestQuotation.alternativePart) ? latestQuotation.alternativePart : (latestQuotation.alternativePart ? [latestQuotation.alternativePart] : []))
                    ]
                    
                    if (allPartIds.length > 0) {
                        const uniquePartIds = Array.from(new Set(allPartIds))
                        const partResponses = await Promise.all(
                            uniquePartIds.map(id => api.get(`/part/getPartById/${id}`).catch(() => null))
                        )
                        setQuotationParts(partResponses.filter(r => r && r.data).map(r => r.data))
                    }
                }
            } catch (e) {
                // No quotation found is okay
                console.debug('No quotation found for ticket', ticketNumberParam)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [ticketNumberParam])

    // WebSocket for real-time updates
    useEffect(() => {
        if (!ticketNumberParam) return
        
        let repairSubscription = null
        const ticketNum = ticketNumberParam // Capture for closure
        
        connectWebSocket({
            onConnect: () => {
                repairSubscription = subscribeToTopic('/topic/repair-tickets', (message) => {
                    try {
                        if (message && message.body) {
                            const update = typeof message.body === 'string' ? JSON.parse(message.body) : message.body
                            // Check if update is for this ticket
                            if (update && (
                                update.ticketNumber === ticketNum || 
                                update.repairTicketNumber === ticketNum
                            )) {
                                // Small delay to ensure backend has processed the update
                                setTimeout(() => fetchData(), 300)
                            }
                        } else {
                            // Refresh on any message if body is missing (fallback)
                            setTimeout(() => fetchData(), 300)
                        }
                    } catch (e) {
                        console.warn('Failed to parse WebSocket message', e)
                        setTimeout(() => fetchData(), 300)
                    }
                })
            },
            onDisconnect: () => {
                console.log('WebSocket disconnected')
            }
        })

        return () => {
            unsubscribeFromTopic(repairSubscription)
        }
    }, [ticketNumberParam])

    // Polling fallback for status updates (every 30 seconds)
    useEffect(() => {
        if (!ticketNumberParam) return
        
        const interval = setInterval(() => {
            fetchData()
        }, 30000) // Poll every 30 seconds as fallback
        
        return () => clearInterval(interval)
    }, [ticketNumberParam])

    const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`
    
    // Get selected parts from quotation
    const getSelectedParts = () => {
        if (!quotation || !quotationParts.length) return []
        const selectionId = quotation.customerSelection ? Number(quotation.customerSelection) : null
        if (!selectionId) return []
        
        const recommendedIds = Array.isArray(quotation.recommendedPart) 
            ? quotation.recommendedPart 
            : (quotation.recommendedPart ? [quotation.recommendedPart] : [])
        const alternativeIds = Array.isArray(quotation.alternativePart) 
            ? quotation.alternativePart 
            : (quotation.alternativePart ? [quotation.alternativePart] : [])
        
        if (recommendedIds.includes(selectionId)) {
            return quotationParts.filter(p => recommendedIds.includes(p.id))
        } else if (alternativeIds.includes(selectionId)) {
            return quotationParts.filter(p => alternativeIds.includes(p.id))
        }
        return []
    }

    const selectedParts = getSelectedParts()
    const selectedPartsTotal = selectedParts.reduce((sum, p) => sum + (p.unitCost || 0), 0)
    const laborCost = quotation?.laborCost || 0
    const selectedTotal = selectedPartsTotal + laborCost

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 ml-[250px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading repair status...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!ticketNumberParam) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 ml-[250px] p-6">
                    <div className="text-center py-12">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h3>
                        <p className="text-gray-500">Please select a repair ticket to view its status.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex-1 ml-[250px] p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Repair Status Dashboard</h1>
                    <p className="text-gray-600">Track the progress of your repair request in real-time</p>
                </div>

                {/* Animated Status Stepper */}
                <div className={`flex justify-center mb-8 transition-all duration-500 ${statusTransition ? 'scale-105' : 'scale-100'}`}>
                    <ol className="flex flex-wrap items-center gap-4 md:gap-6 max-w-full">
                        {statusOrder.map((step, idx) => {
                            // Normalize currentStatus for comparison
                            const normalizedStatus = normalizeStatus(currentStatus)
                            const currentIdx = normalizedStatus && statusOrder.includes(normalizedStatus) 
                                ? statusOrder.indexOf(normalizedStatus) 
                                : (normalizedStatus ? -1 : 0)
                            const isActive = currentIdx === idx && currentIdx >= 0
                            const isReached = currentIdx >= idx && currentIdx >= 0
                            const isCurrent = isActive
                            
                            return (
                                <li 
                                    key={step} 
                                    className={`flex items-center space-x-2.5 transition-all duration-500 ${
                                        isReached 
                                            ? isCurrent 
                                                ? "text-green-600 scale-110" 
                                                : "text-green-500" 
                                            : "text-gray-400"
                                    }`}
                                >
                                    <span className={`flex items-center justify-center w-10 h-10 border-2 rounded-full shrink-0 transition-all duration-500 ${
                                        isReached 
                                            ? isCurrent 
                                                ? "border-green-600 bg-green-50 shadow-lg" 
                                                : "border-green-500 bg-green-50" 
                                            : "border-gray-300 bg-white"
                                    }`}>
                                        {isCurrent && <CheckCircle size={20} className="text-green-600" />}
                                        {!isCurrent && <span className="text-sm font-semibold">{idx + 1}</span>}
                                    </span>
                                    <span className="hidden sm:block">
                                        <h3 className="font-medium leading-tight capitalize text-sm md:text-base">
                                            {step.replace(/_/g, ' ').toLowerCase()}
                                        </h3>
                                    </span>
                                </li>
                            )
                        })}
                    </ol>
                </div>

                {/* Action Buttons */}
                {normalizeStatus(currentStatus) === "AWAITING_PARTS" && (
                    <div className="flex justify-center mb-8 animate-fade-in">
                        <Link to={`/quotationapproval/${ticketNumberParam}`} className="inline-block">
                            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium transform hover:scale-105">
                                View Quotation / Approve
                            </button>
                        </Link>
                    </div>
                )}

                {normalizeStatus(currentStatus) === "COMPLETED" && (
                    <div className="flex justify-center mb-8 animate-fade-in">
                        <Link to={`/feedbackform/${ticketDetails?.repairTicketId || 0}`} className="inline-block">
                            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium transform hover:scale-105">
                                Give Feedback
                            </button>
                        </Link>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left Column - Ticket Info & Diagnostics */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ticket Information Card */}
                        {ticketDetails && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="text-green-600" size={20} />
                                    <h2 className="text-xl font-semibold text-gray-900">Ticket Information</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Ticket Number</span>
                                        <p className="text-lg font-semibold text-gray-900">{ticketDetails.ticketNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Check-in Date</span>
                                        <p className="text-lg text-gray-900">{ticketDetails.checkInDate || 'N/A'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-sm font-medium text-gray-500">Device</span>
                                        <p className="text-lg text-gray-900">
                                            {ticketDetails.deviceType} • {ticketDetails.deviceBrand} {ticketDetails.deviceModel}
                                        </p>
                                    </div>
                                    {ticketDetails.deviceColor && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Color</span>
                                            <p className="text-lg text-gray-900">{ticketDetails.deviceColor}</p>
                                        </div>
                                    )}
                                    {ticketDetails.deviceSerialNumber && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Serial Number</span>
                                            <p className="text-lg text-gray-900">{ticketDetails.deviceSerialNumber}</p>
                                        </div>
                                    )}
                                    {ticketDetails.technicianName && (
                                        <div className="sm:col-span-2">
                                            <span className="text-sm font-medium text-gray-500">Assigned Technician</span>
                                            <p className="text-lg text-gray-900">{ticketDetails.technicianName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Diagnostics & Observations Card */}
                        {ticketDetails && (ticketDetails.reportedIssue || ticketDetails.observations) && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
                                <div className="flex items-center gap-2 mb-4">
                                    <ClipboardCheck className="text-green-600" size={20} />
                                    <h2 className="text-xl font-semibold text-gray-900">Diagnostics</h2>
                                </div>
                                {ticketDetails.reportedIssue && (
                                    <div className="mb-4">
                                        <span className="text-sm font-medium text-gray-500">Reported Issue</span>
                                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ticketDetails.reportedIssue}</p>
                                    </div>
                                )}
                                {ticketDetails.observations && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Technician Observations</span>
                                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">{ticketDetails.observations}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Selected Parts & Quotation Card */}
                        {quotation && (selectedParts.length > 0 || quotation.status === 'PENDING' || quotation.status === 'APPROVED') && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md animate-scale-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <Package className="text-purple-600" size={20} />
                                    <h2 className="text-xl font-semibold text-gray-900">Selected Parts & Options</h2>
                                    {quotation.status && (
                                        <span className={`ml-auto px-2 py-1 text-xs font-semibold rounded ${
                                            quotation.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            quotation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            quotation.status === 'REJECTED' || quotation.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {quotation.status}
                                        </span>
                                    )}
                                </div>
                                
                                {selectedParts.length > 0 ? (
                                    <>
                                        <div className="space-y-3 mb-4">
                                            {selectedParts.map((part, idx) => (
                                                <div 
                                                    key={part.id} 
                                                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300 hover:bg-gray-100 hover:shadow-sm"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    <PartPhoto partId={part.id} photoUrl={part.partPhotoUrl} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-900">{part.name}</div>
                                                        <div className="text-xs text-gray-500">SKU: {part.partNumber}</div>
                                                        {part.description && (
                                                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">{part.description}</div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-900">{formatCurrency(part.unitCost || 0)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t pt-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Parts Subtotal:</span>
                                                <span className="font-semibold">{formatCurrency(selectedPartsTotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Labor Cost:</span>
                                                <span className="font-semibold">{formatCurrency(laborCost)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                                <span>Total:</span>
                                                <span className="text-green-600">{formatCurrency(selectedTotal)}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="mx-auto mb-2 text-gray-400" size={32} />
                                        <p className="mb-2">Quotation {quotation.status === 'PENDING' ? 'pending approval' : 'available'}</p>
                                        <Link to={`/quotationapproval/${ticketNumberParam}`} className="text-green-600 hover:underline mt-2 inline-block font-medium">
                                            View quotation options →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Technician Notes from History */}
                        {history.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="text-indigo-600" size={20} />
                                    <h2 className="text-xl font-semibold text-gray-900">Status History & Notes</h2>
                                </div>
                                <div className="space-y-4">
                                    {history.map((h, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${
                                                idx === 0 
                                                    ? 'bg-green-50 border-green-500 shadow-sm' 
                                                    : 'bg-gray-50 border-gray-300'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900 capitalize">
                                                        {h.repairStatus.replace(/_/g, ' ').toLowerCase()}
                                                    </p>
                                                    {h.notes && (
                                                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{h.notes}</p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4 flex-shrink-0">
                                                    {idx === 0 && <CheckCircle className="text-green-600 mb-1" size={18} />}
                                                    <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {h.updatedBy && (
                                                <p className="text-xs text-gray-500">Updated by: {h.updatedBy}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Current Status & Quick Info */}
                    <div className="space-y-6">
                        {/* Current Status Card */}
                        <div className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm border-2 border-green-200 p-6 transition-all duration-500 ${statusTransition ? 'scale-105 shadow-lg' : 'scale-100'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Wrench className="text-green-600" size={20} />
                                <h2 className="text-xl font-semibold text-gray-900">Current Stage</h2>
                            </div>
                            <div className="text-center py-4">
                                <div className={`text-4xl font-bold text-green-600 mb-2 capitalize transition-all duration-500 ${statusTransition ? 'animate-pulse' : ''}`}>
                                    {currentStatus ? currentStatus.replace(/_/g, ' ').toLowerCase() : 'Unknown'}
                                </div>
                                {currentStatus && (
                                    <div className="text-sm text-gray-600 mt-2">
                                        Step {statusOrder.indexOf(currentStatus) + 1} of {statusOrder.length}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Info Card */}
                        {ticketDetails && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Information</h3>
                                <div className="space-y-3">
                                    {ticketDetails.customerFirstName && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500">Customer</span>
                                            <p className="text-sm text-gray-900">
                                                {ticketDetails.customerFirstName} {ticketDetails.customerLastName}
                                            </p>
                                        </div>
                                    )}
                                    {ticketDetails.customerEmail && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500">Email</span>
                                            <p className="text-sm text-gray-900">{ticketDetails.customerEmail}</p>
                                        </div>
                                    )}
                                    {ticketDetails.customerPhoneNumber && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500">Phone</span>
                                            <p className="text-sm text-gray-900">{ticketDetails.customerPhoneNumber}</p>
                                        </div>
                                    )}
                                    {ticketDetails.accessories && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500">Accessories</span>
                                            <p className="text-sm text-gray-900">{ticketDetails.accessories}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Photo Evidence Section */}
                {(ticketDetails && ((ticketDetails.repairPhotosUrls && ticketDetails.repairPhotosUrls.length > 0) || (ticketDetails.afterRepairPhotosUrls && ticketDetails.afterRepairPhotosUrls.length > 0))) && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Photo Evidence</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Before Photos - repairPhotosUrls (photos taken when device was received) */}
                            {ticketDetails.repairPhotosUrls && ticketDetails.repairPhotosUrls.length > 0 && (
                                <div className="border-r-0 md:border-r border-gray-200 pr-0 md:pr-6">
                                    <div className="mb-4 pb-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-green-700 mb-1">Before Photos</h3>
                                        <p className="text-sm text-gray-600">Device condition when received</p>
                                    </div>
                                    <div className="max-w-full">
                                        <BeforePicturesGallery photos={ticketDetails.repairPhotosUrls} />
                                    </div>
                                </div>
                            )}
                            {/* After Photos - afterRepairPhotosUrls (photos taken after repair completion) */}
                            {ticketDetails.afterRepairPhotosUrls && ticketDetails.afterRepairPhotosUrls.length > 0 && (
                                <div className={ticketDetails.repairPhotosUrls && ticketDetails.repairPhotosUrls.length > 0 ? "pl-0 md:pl-6" : ""}>
                                    <div className="mb-4 pb-4 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-green-700 mb-1">After Photos</h3>
                                        <p className="text-sm text-gray-600">Device condition after repair</p>
                                    </div>
                                    <div className="max-w-full">
                                        <AfterPicturesGallery photos={ticketDetails.afterRepairPhotosUrls} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RealTimeStatus
