import { useRef, useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Smartphone, Laptop, Tablet, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../../config/ApiConfig";

const KanbanCard = ({ task, onReorder, activeTaskId, onDragStart, onDragEnd, index }) => {
  const ref = useRef(null);
  const [hasQuotation, setHasQuotation] = useState(false);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: () => {
      onDragStart?.(task.id);
      return { id: task.id, status: task.status, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => onDragEnd?.(),
  }), [task, index, onDragStart, onDragEnd]);

  const [, drop] = useDrop({
    accept: "task",
    hover: (item, monitor) => {
      if (!ref.current || item.id === task.id) return;
      if (item.status !== task.status) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (item.index < index && hoverClientY < hoverMiddleY) return;
      if (item.index > index && hoverClientY > hoverMiddleY) return;
      onReorder(item.id, task.id);
      item.index = index;
    },
  });

  drag(drop(ref));

  // Check if quotation exists for this ticket
  useEffect(() => {
    if (task.status === "AWAITING_PARTS" && task.ticketId) {
      const checkQuotation = async () => {
        try {
          const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${task.ticketId}`);
          setHasQuotation(data && data.length > 0);
        } catch (err) {
          // If error, assume no quotation exists
          setHasQuotation(false);
        }
      };
      checkQuotation();
    }
  }, [task.status, task.ticketId]);

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

  const isActive = activeTaskId === task.id;

  return (
    <div
      ref={ref}
      className={`group bg-white p-3 rounded-xl border border-gray-100 cursor-grab transition-all duration-300 ${isDragging ? "opacity-70 scale-[0.98]" : "hover:-translate-y-1"} ${isActive ? "ring-2 ring-[#2563eb]/30" : ""}`}
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#2563eb]/15 to-[#33e407]/15 flex items-center justify-center flex-shrink-0">
          {getDeviceIcon(task.deviceType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-800 truncate">{task.title}</div>
          <div className="text-xs text-gray-500 mt-1">{task.ticketId}</div>
          <div className="text-xs text-gray-600 mt-1 truncate">{task.customer}</div>
          {task.status === "AWAITING_PARTS" && (
            <Link
              to={`/quotation-builder/${encodeURIComponent(task.ticketId)}`}
              className="inline-flex mt-2 text-[11px] font-semibold text-[#33e407] hover:text-[#2ab306] transition-colors"
            >
              {hasQuotation ? "Edit Quotation" : "Build Quotation"}
            </Link>
          )}
          {task.status === "REPAIRING" && (
            <Link
              to={`/quotationviewer/${encodeURIComponent(task.ticketId)}?repairStatus=${task.status}`}
              className="inline-flex mt-2 text-[11px] font-semibold text-[#2563eb] hover:text-[#1d4dc6] transition-colors"
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