"use client"

import { useState } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import KanbanColumn from "./KanbanColumn"

const KanbanBoard = () => {
    const [tasks, setTasks] = useState([
        {
            id: 1,
            title: "iPhone 13 Screen",
            ticketId: "Ticket #RT-2023-0042",
            customer: "John Smith",
            status: "New",
            deviceType: "smartphone",
        },
        {
            id: 2,
            title: "MacBook Battery",
            ticketId: "Ticket #RT-2023-0043",
            customer: "Sarah Davis",
            status: "New",
            deviceType: "laptop",
        },
        {
            id: 3,
            title: "Dell XPS Keyboard",
            ticketId: "Ticket #RT-2023-0039",
            customer: "Emma Johnson",
            status: "Diagnosing",
            deviceType: "laptop",
        },
        {
            id: 4,
            title: "iPad Not Charging",
            ticketId: "Ticket #RT-2023-0040",
            customer: "Michael Brown",
            status: "Diagnosing",
            deviceType: "tablet",
        },
        {
            id: 5,
            title: "HP Laptop Fan",
            ticketId: "Ticket #RT-2023-0041",
            customer: "David Wilson",
            status: "Diagnosing",
            deviceType: "laptop",
        },
        {
            id: 6,
            title: "Surface Pro Screen",
            ticketId: "Ticket #RT-2023-0037",
            customer: "Lisa Rodriguez",
            status: "Awaiting Parts",
            deviceType: "tablet",
        },
        {
            id: 7,
            title: "iMac Graphics Card",
            ticketId: "Ticket #RT-2023-0038",
            customer: "Robert Taylor",
            status: "Awaiting Parts",
            deviceType: "monitor",
        },
        {
            id: 8,
            title: "iPhone 12 Battery",
            ticketId: "Ticket #RT-2023-0035",
            customer: "Jennifer White",
            status: "Repairing",
            deviceType: "smartphone",
        },
        {
            id: 9,
            title: "Samsung S21 Screen",
            ticketId: "Ticket #RT-2023-0036",
            customer: "Thomas Martin",
            status: "Repairing",
            deviceType: "smartphone",
        },
        {
            id: 10,
            title: "Lenovo Hinge Repair",
            ticketId: "Ticket #RT-2023-0037",
            customer: "Patricia Garcia",
            status: "Repairing",
            deviceType: "laptop",
        },
        {
            id: 11,
            title: "MacBook Pro SSD",
            ticketId: "Ticket #RT-2023-0033",
            customer: "Richard Moore",
            status: "Done",
            deviceType: "laptop",
        },
        {
            id: 12,
            title: "iPad Screen",
            ticketId: "Ticket #RT-2023-0034",
            customer: "Elizabeth Lee",
            status: "Done",
            deviceType: "tablet",
        },
        {
            id: 13,
            title: "Pixel 6 Camera",
            ticketId: "Ticket #RT-2023-0035",
            customer: "James Anderson",
            status: "Done",
            deviceType: "smartphone",
        },
        {
            id: 14,
            title: "Asus Keyboard",
            ticketId: "Ticket #RT-2023-0036",
            customer: "Susan Thompson",
            status: "Done",
            deviceType: "laptop",
        },
    ])

    const columns = ["New", "Diagnosing", "Awaiting Parts", "Repairing", "Done"]

    const updateTaskStatus = (taskId, newStatus) => {
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    }

    const getTasksByStatus = (status) => {
        return tasks.filter((task) => task.status === status)
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm mb-6 md:mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Repair Queue</h3>
                <div className="overflow-x-auto">
                    <div className="flex gap-3 md:gap-4" style={{ minWidth: "800px" }}>
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column}
                                title={column}
                                tasks={getTasksByStatus(column)}
                                onTaskDrop={updateTaskStatus}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </DndProvider>
    )
}

export default KanbanBoard
