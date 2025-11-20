import React, { useState, useEffect } from "react";
import { FileText, Trash, Pencil, Eye, Shield } from "lucide-react";
import api from '../../config/ApiConfig';

const ExistingQuotationCard = ({ quotation, onEdit, onDelete, onOverride = () => {} }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectionName, setSelectionName] = useState(null);
  const [optionParts, setOptionParts] = useState({});

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

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const ids = [quotation?.technicianRecommendedPartId, quotation?.technicianAlternativePartId].filter(Boolean);
        if (ids.length === 0) {
          setOptionParts({});
          return;
        }
        const responses = await Promise.all(ids.map((id) => api.get(`/part/getPartById/${id}`)));
        const mapped = {};
        responses.forEach((res) => {
          if (res?.data?.id) mapped[res.data.id] = res.data;
        });
        setOptionParts(mapped);
      } catch (err) {
        console.warn("Unable to load option parts", err);
        setOptionParts({});
      }
    };
    loadOptions();
  }, [quotation?.technicianRecommendedPartId, quotation?.technicianAlternativePartId]);

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
          {quotation.technicianOverride && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600 flex items-center gap-1">
              <Shield size={12} /> Override Logged
            </span>
          )}
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
          {quotation.status === "PENDING" && (
            <button
              onClick={onOverride}
              className="px-2 py-1 text-xs rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1"
            >
              <Shield size={14} /> Override
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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {renderOptionCard("Option A – Recommended", quotation.technicianRecommendedPartId, optionParts, quotation.laborCost)}
            {renderOptionCard("Option B – Alternative", quotation.technicianAlternativePartId, optionParts, quotation.laborCost)}
          </div>

          {quotation.technicianOverride && (
            <div className="mt-4 text-xs text-gray-600">
              Overridden by {quotation.overrideTechnicianName || "Technician"} on{" "}
              {quotation.overrideTimestamp ? new Date(quotation.overrideTimestamp).toLocaleString() : "-"}
              {quotation.overrideNotes && <span className="block italic mt-1">“{quotation.overrideNotes}”</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const renderOptionCard = (label, partId, optionParts, laborCost = 0) => {
  if (!partId) {
    return (
      <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
        {label}: Not provided
      </div>
    );
  }
  const part = optionParts[partId];
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="text-xs font-semibold text-green-700 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{part?.name || "Part #" + partId}</div>
      <div className="text-xs text-gray-500 mb-2">SKU: {part?.partNumber || "—"}</div>
      <div className="text-xs text-gray-600">Part Cost: ₱{(part?.unitCost || 0).toFixed(2)}</div>
      <div className="text-xs text-gray-600">Labor: ₱{(laborCost || 0).toFixed(2)}</div>
      <div className="text-sm font-semibold text-gray-800 mt-1">
        Total: ₱{((part?.unitCost || 0) + (laborCost || 0)).toFixed(2)}
      </div>
    </div>
  );
};

export default ExistingQuotationCard; 