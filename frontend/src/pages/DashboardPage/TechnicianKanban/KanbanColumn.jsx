import { useDrop } from "react-dnd"
import KanbanCard from "./KanbanCard.jsx";
const KanbanColumn = ({ title, status, tasks, onTaskDrop, onReorder, activeTaskId, onDragStart, onDragEnd }) => {
    const [{ isOver }, drop] = useDrop({
        accept: "task",
        drop: (item) => onTaskDrop(item.id, status),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    })

    return (
        <div
            ref={drop}
            className={`flex-1 min-w-60 rounded-2xl border bg-white/80 backdrop-blur transition-all duration-300 p-4 flex flex-col ${isOver ? "border-[#2563eb] shadow-lg translate-y-[-2px]" : "border-transparent shadow-sm hover:shadow-md"}`}
        >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="font-semibold text-gray-700 tracking-tight">{title}</div>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-[#2563eb]/10 text-[#2563eb]">
                    {tasks.length}
                </div>
            </div>
            <div className="space-y-3 pb-1 overflow-y-auto overflow-x-hidden scroll-smooth flex-1" style={{ maxHeight: '560px' }}>
                {tasks.map((task, index) => (
                    <KanbanCard
                        key={task.id}
                        task={task}
                        onReorder={onReorder}
                        activeTaskId={activeTaskId}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        index={index}
                    />
                ))}
            </div>
        </div>
    )
}

export default KanbanColumn
