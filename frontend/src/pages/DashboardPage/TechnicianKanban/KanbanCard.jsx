import { useDrag } from "react-dnd";
import { Smartphone, Laptop, Tablet, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

// Reusable Kanban card representing a single repair ticket or task.
// Extracted from the previous inline implementation for better reuse and readability.
const KanbanCard = ({ task }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getDeviceIcon = (deviceType) => {
    const type = (deviceType || "").toLowerCase();
    switch (type) {
      case "smartphone":
        return <Smartphone className="h-6 w-6 text-gray-600" />;
      case "laptop":
        return <Laptop className="h-6 w-6 text-gray-600" />;
      case "tablet":
        return <Tablet className="h-6 w-6 text-gray-600" />;
      case "monitor":
        return <Monitor className="h-6 w-6 text-gray-600" />;
      default:
        return <Smartphone className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div
      ref={drag}
      className="bg-white p-3 rounded-lg border-l-4 border-[#33e407] shadow-sm cursor-move"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex">
        <div className="w-12 h-12 bg-gray-200 rounded mr-3 flex items-center justify-center">
          {getDeviceIcon(task.deviceType)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{task.title}</div>
          <div className="text-xs text-gray-500">{task.ticketId}</div>
          <div className="text-xs mt-1">{task.customer}</div>
          {task.status === "AWAITING_PARTS" && (
            <Link
              to={`/quotation-builder/${encodeURIComponent(task.ticketId)}`}
              className="inline-block mt-1 text-xs text-green-600 hover:underline"
            >
              Build Quotation
            </Link>
          )}
          {task.status === "REPAIRING" && (
            <Link
              to={`/quotationviewer/${encodeURIComponent(task.ticketId)}`}
              className="inline-block mt-1 text-xs text-blue-600 hover:underline"
            >
              View Quotation
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard; 