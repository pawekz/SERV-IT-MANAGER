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
                        fetchedTasks.push({
                            id: ticket.ticketNumber,
                            title: ticket.reportedIssue || ticket.deviceModel || ticket.deviceBrand || "Repair Ticket",
                            ticketId: ticket.ticketNumber,
                            customer: ticket.customerName,
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

    const updateTaskStatus = (taskId, newStatus) => {
        setTasks((prev) => {
            const task = prev.find((t) => t.id === taskId)
            if (!task || task.status === newStatus) return prev

            // Optimistically update UI
            const updated = prev.map((t) =>
                t.id === taskId ? { ...t, status: newStatus } : t
            )

            setPendingChange({ taskId, prevStatus: task.status, newStatus })
            return updated
        })
    }

    const showToast = (message, type = "success") => setToast({ show: true, message, type })
    const closeToast = () => setToast({ ...toast, show: false })

    const handleConfirmChange = async (photos = []) => {
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
                const { data } = await api.patch("/repairTicket/updateRepairStatus", {
                    ticketNumber: task.ticketId, // ticketId stores ticketNumber
                    repairStatus: pendingChange.newStatus,
                })

                // Ensure UI reflects backend-confirmed status
                if (data && data.newStatus) {
                    setTasks((prev) =>
                        prev.map((t) => (t.id === pendingChange.taskId ? { ...t, status: data.newStatus } : t))
                    )
                }

                // If ticket moved to AWAITING_PARTS, create a draft quotation (if not exists)
                if (data?.newStatus === "AWAITING_PARTS") {
                    try {
                        await api.post("/quotation/addQuotation", {
                            repairTicketNumber: task.ticketId,
                            partIds: [],
                            laborCost: 0,
                            totalCost: 0,
                        })
                    } catch (qErr) {
                        // Silently ignore if quotation already exists or fails
                        console.warn("Failed to create quotation draft", qErr)
                    }
                }

                showToast(data?.message || "Status updated successfully")
            }
        } catch (error) {
            console.error("Failed to update repair status", error)
            // Revert UI on failure
            setTasks((prev) => prev.map((t) => (t.id === pendingChange.taskId ? { ...t, status: pendingChange.prevStatus } : t)))
            alert("Failed to update status. Please try again.")
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
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm mb-6 md:mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Repair Queue</h3>
                <div className="overflow-x-auto">
                    <div className="flex gap-3 md:gap-4" style={{ minWidth: "800px" }}>
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.status}
                                title={column.title}
                                status={column.status}
                                tasks={getTasksByStatus(column.status)}
                                onTaskDrop={updateTaskStatus}
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

                        {/* Toast */}
                        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
                    </div>
                </div>
            </div>
        </DndProvider>
    )
}

export default KanbanBoard
