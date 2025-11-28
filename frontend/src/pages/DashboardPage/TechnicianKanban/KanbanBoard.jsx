"use client"

import { useState, useEffect } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import KanbanColumn from "./KanbanColumn.jsx"
import api from "../../../config/ApiConfig.jsx"
import StatusChangeConfirmModal from "./StatusChangeConfirmModal.jsx"
import Toast from "../../../components/Toast/Toast.jsx"

const KanbanBoard = () => {
    // All tasks fetched from the backend
    const [tasks, setTasks] = useState([])
    const [activeTaskId, setActiveTaskId] = useState(null)

    // Pending change info for modal confirmation
    const [pendingChange, setPendingChange] = useState(null) // { taskId, prevStatus, newStatus }
    const [isUpdating, setIsUpdating] = useState(false)
    const [toast, setToast] = useState({ show: false, message: "", type: "success" })

    // Kanban columns mapped to backend statuses (RepairStatusEnum)
    const columns = [
        { title: "Received", status: "RECEIVED" },
        { title: "Diagnosing", status: "DIAGNOSING" },
        { title: "Awaiting Parts", status: "AWAITING_PARTS" },
        { title: "Repairing", status: "REPAIRING" },
        { title: "Ready for Pickup", status: "READY_FOR_PICKUP" },
        { title: "Completed", status: "COMPLETED" },
    ]

    // Fetch tasks for every status on mount
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const promises = columns.map((col) =>
                    api
                        .get("/repairTicket/getRepairTicketsByStatusPageableAssignedToTech", {
                            params: { status: col.status },
                            validateStatus: (s) => s >= 200 && s < 300 || s === 204, // accept 204
                        })
                        .then((res) => ({ res, status: col.status }))
                        .catch((err) => {
                            console.warn(`Failed to fetch tickets for ${col.status}:`, err)
                            return null
                        })
                )

                const settled = await Promise.all(promises)

                const fetchedTasks = []

                settled.forEach((entry) => {
                    if (!entry || !entry.res) return

                    const { res, status } = entry

                    if (res.status === 204 || !res.data) return // nothing to add

                    const data = res.data

                    const tickets = Array.isArray(data) ? data : data.content ?? []

                    tickets.forEach((ticket) => {
                        const first = ticket.customerFirstName || ''
                        const last = ticket.customerLastName || ''
                        const full = [first, last].filter(Boolean).join(' ') || '—'
                        fetchedTasks.push({
                            id: ticket.ticketNumber,
                            title: ticket.reportedIssue || ticket.deviceModel || ticket.deviceBrand || "Repair Ticket",
                            ticketId: ticket.ticketNumber,
                            customerFirstName: first,
                            customerLastName: last,
                            customerFullName: full,
                            customer: full,
                            status: ticket.repairStatus || status,
                            deviceType: (ticket.deviceType || "").toLowerCase(),
                        })
                    })
                })

                setTasks(fetchedTasks)
            } catch (error) {
                console.error("Failed to fetch repair tickets for Kanban board", error)
            }
        }

        fetchTickets()
    }, [])

    const moveTask = (draggedId, targetId) => {
        if (draggedId === targetId) return
        setTasks((prev) => {
            const dragIndex = prev.findIndex((t) => t.id === draggedId)
            const hoverIndex = prev.findIndex((t) => t.id === targetId)
            if (dragIndex === -1 || hoverIndex === -1) return prev
            if (prev[dragIndex].status !== prev[hoverIndex].status) return prev
            const updated = [...prev]
            const [removed] = updated.splice(dragIndex, 1)
            updated.splice(hoverIndex, 0, removed)
            return updated
        })
    }

    const updateTaskStatus = (taskId, newStatus) => {
        let change = null
        setTasks((prev) => {
            const task = prev.find((t) => t.id === taskId)
            if (!task || task.status === newStatus) return prev
            change = { taskId, prevStatus: task.status, newStatus }
            const filtered = prev.filter((t) => t.id !== taskId)
            return [...filtered, { ...task, status: newStatus }]
        })
        if (change) {
            setPendingChange(change)
        }
    }

    const handleDragStart = (taskId) => setActiveTaskId(taskId)
    const handleDragEnd = () => setActiveTaskId(null)

    const showToast = (message, type = "success") => setToast({ show: true, message, type })
    const closeToast = () => setToast({ ...toast, show: false })

    const handleConfirmChange = async ({ photos = [], observation } = {}) => {
        if (!pendingChange) return
        const task = tasks.find((t) => t.id === pendingChange.taskId)
        try {
            setIsUpdating(true)

            if (pendingChange.newStatus === "READY_FOR_PICKUP") {
                // Validate photos length in modal already, but double-check
                if (photos.length === 0) {
                    alert("Please upload at least one after-repair photo.")
                    return
                }
                const formData = new FormData()
                formData.append("ticketNumber", task.ticketId)
                formData.append("repairStatus", pendingChange.newStatus)
                photos.forEach((file) => formData.append("afterRepairPhotos", file))

                const { data } = await api.patch("/repairTicket/updateRepairStatusWithPhotos", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })

                // Ensure UI reflects backend-confirmed status
                if (data && data.newStatus) {
                    setTasks((prev) =>
                        prev.map((t) => (t.id === pendingChange.taskId ? { ...t, status: data.newStatus } : t))
                    )
                }

                showToast(data?.message || "Status updated successfully")
            } else {
                const payload = {
                    ticketNumber: task.ticketId, // ticketId stores ticketNumber
                    repairStatus: pendingChange.newStatus,
                }
                if (observation && observation.trim()) {
                    payload.observations = observation.trim()
                }
                const { data } = await api.patch("/repairTicket/updateRepairStatus", payload)

                // Ensure UI reflects backend-confirmed status
                if (data && data.newStatus) {
                    setTasks((prev) =>
                        prev.map((t) => (t.id === pendingChange.taskId ? { ...t, status: data.newStatus } : t))
                    )
                }

                if (data?.newStatus === "AWAITING_PARTS") {
                    showToast("Ticket moved to Awaiting Parts", "success")
                } else {
                    showToast(data?.message || "Status updated successfully")
                }
            }
        } catch (error) {
            console.error("Failed to update repair status", error)
            // Revert UI on failure
            setTasks((prev) => prev.map((t) => (t.id === pendingChange.taskId ? { ...t, status: pendingChange.prevStatus } : t)))
            const apiMessage = error?.response?.data?.message || error?.message || "Failed to update status. Please try again."
            if (apiMessage.toLowerCase().includes("quotation") || apiMessage.toLowerCase().includes("approved")) {
                if (pendingChange.newStatus === "AWAITING_PARTS") {
                    showToast("Please create a quotation with Option A (Recommended) and Option B (Alternative) parts before moving to Awaiting Parts.", "error")
                } else if (pendingChange.newStatus === "REPAIRING") {
                    showToast("Cannot move to Repairing. The quotation must be approved by the customer or overridden by a technician with notes.", "error")
                } else {
                    showToast(apiMessage, "error")
                }
            } else {
                showToast(apiMessage, "error")
            }
        } finally {
            setIsUpdating(false)
            setPendingChange(null)
        }
    }

    const handleCancelChange = () => {
        if (pendingChange) {
            // Revert UI
            setTasks((prev) => prev.map((t) => (t.id === pendingChange.taskId ? { ...t, status: pendingChange.prevStatus } : t)))
            setPendingChange(null)
        }
    }

    const getTasksByStatus = (status) => tasks.filter((task) => task.status === status)

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-gradient-to-b from-white to-gray-50 p-4 md:p-6 rounded-2xl shadow-lg mb-6 md:mb-8 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Repair Queue</h3>
                    <span className="text-sm text-gray-500">{tasks.length} tickets</span>
                </div>
                <div className="overflow-x-auto pt-2">
                    <div className="flex gap-3 md:gap-4 transition-all duration-300" style={{ minWidth: "800px" }}>
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.status}
                                title={column.title}
                                status={column.status}
                                tasks={getTasksByStatus(column.status)}
                                onTaskDrop={updateTaskStatus}
                                onReorder={moveTask}
                                activeTaskId={activeTaskId}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                        <StatusChangeConfirmModal
                            isOpen={!!pendingChange}
                            fromStatus={pendingChange?.prevStatus}
                            toStatus={pendingChange?.newStatus}
                            ticketNumber={tasks.find((t) => t.id === pendingChange?.taskId)?.ticketId}
                            onConfirm={handleConfirmChange}
                            onCancel={handleCancelChange}
                            loading={isUpdating}
                        />
                        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
                    </div>
                </div>
            </div>
        </DndProvider>
    )
}

export default KanbanBoard
