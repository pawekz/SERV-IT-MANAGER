import React, { useState, useEffect } from "react";
import { FileText, Trash, Pencil, Eye } from "lucide-react";
import api from '../../config/ApiConfig';

const ExistingQuotationCard = ({ quotation, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectionName, setSelectionName] = useState(null);

  // Fetch part name for customer selection, if numeric
  useEffect(() => {
    const loadPartName = async () => {
      if (!quotation?.customerSelection) {
        setSelectionName(null);
        return;
      }
      const idStr = quotation.customerSelection.toString();
      if (!/^\d+$/.test(idStr)) {
        // Not a numeric ID, maybe free-text
        setSelectionName(idStr);
        return;
      }
      try {
        const { data } = await api.get(`/part/getPartById/${idStr}`);
        setSelectionName(data?.name || data?.partNumber || idStr);
      } catch (err) {
        console.warn("Unable to fetch part name", err);
        setSelectionName(idStr);
      }
    };
    loadPartName();
  }, [quotation?.customerSelection]);

  const statusColor = () => {
    switch ((quotation.status || "").toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-600";
      case "REJECTED":
      case "DECLINED":
        return "bg-red-100 text-red-600";
      case "EXPIRED":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-yellow-100 text-yellow-600"; // PENDING or others
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Existing Quotation</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor()}`}>
            {quotation.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center gap-1"
          >
            <Eye size={14} /> {showDetails ? "Hide" : "View"} Quotation
          </button>
          {/* Allow editing only when quotation is still pending */}
          {quotation.status === "PENDING" && (
            <button
              onClick={onEdit}
              className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center gap-1"
            >
              <Pencil size={14} /> Edit
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-600 hover:bg-red-200 flex items-center gap-1"
          >
            <Trash size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Details section (toggle) */}
      {showDetails && (
        <div className="p-5 border-t border-gray-100 text-sm">
          <div className="grid md:grid-cols-2 gap-y-2">
            <div className="text-gray-500">Quotation ID:</div>
            <div className="font-medium">{quotation.quotationId}</div>

            <div className="text-gray-500">Created At:</div>
            <div className="font-medium">
              {quotation.createdAt ? new Date(quotation.createdAt).toLocaleString() : "-"}
            </div>

            {quotation.respondedAt && (
              <>
                <div className="text-gray-500">Responded At:</div>
                <div className="font-medium">
                  {new Date(quotation.respondedAt).toLocaleString()}
                </div>
              </>
            )}

            <div className="text-gray-500">Labor Cost:</div>
            <div className="font-medium">₱{(quotation.laborCost || 0).toFixed(2)}</div>

            <div className="text-gray-500">Total Cost:</div>
            <div className="font-medium">₱{(quotation.totalCost || 0).toFixed(2)}</div>

            <div className="text-gray-500">Customer Selection:</div>
            <div className="font-medium">{selectionName || quotation.customerSelection || "-"}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingQuotationCard; 