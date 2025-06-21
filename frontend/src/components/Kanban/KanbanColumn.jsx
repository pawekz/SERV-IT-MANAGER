import { useDrop } from "react-dnd"
// import KanbanTask from "./KanbanTask"
import KanbanCard from "./KanbanCard.jsx";
const KanbanColumn = ({ title, tasks, onTaskDrop }) => {
    const [{ isOver }, drop] = useDrop({
        accept: "task",
        drop: (item) => onTaskDrop(item.id, title),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    })

    return (
        <div
            ref={drop}
            className={`flex-1 min-w-48 bg-gray-50 rounded-lg p-4 transition-colors ${
                isOver ? "bg-teal-50 border-2 border-[#33e407] border-dashed" : ""
            }`}
        >
            <div className="font-semibold text-center py-2 border-b border-gray-200 mb-4">
                {title} ({tasks.length})
            </div>
            <div className="space-y-3">
                {tasks.map((task) => (
                    <KanbanCard key={task.id} task={task} />
                ))}
            </div>
        </div>
    )
}

export default KanbanColumn
