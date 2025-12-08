import React, { useState, useEffect } from "react";
import { FileText, Trash, Pencil, Eye, Shield, Package } from "lucide-react";
import api from '../../config/ApiConfig';
import { usePartPhoto } from '../../hooks/usePartPhoto.js';

const PartPhoto = ({ partId, photoUrl }) => {
  const { data: src, isLoading, isError } = usePartPhoto(partId, photoUrl);

  if (isLoading) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse flex-shrink-0">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (isError || !src) {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Package size={20} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt="Part photo"
      className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
      onError={() => {}}
    />
  );
};

const ExistingQuotationCard = ({ quotation, onEdit, onDelete, onOverride = () => {} }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [optionParts, setOptionParts] = useState({});

  // Determine which option the customer selected
  useEffect(() => {
    if (!quotation?.customerSelection) {
      setSelectedOption(null);
      return;
    }
    const idStr = quotation.customerSelection.toString();
    if (!/^\d+$/.test(idStr)) {
      // Not a numeric ID, maybe free-text
      setSelectedOption(null);
      return;
    }
    const selectedPartId = parseInt(idStr, 10);
    
    // Check if the selected part ID is in recommendedPart (Option A)
    const recommendedIds = Array.isArray(quotation?.recommendedPart) 
      ? quotation.recommendedPart 
      : (quotation?.recommendedPart ? [quotation.recommendedPart] : []);
    
    // Check if the selected part ID is in alternativePart (Option B)
    const alternativeIds = Array.isArray(quotation?.alternativePart) 
      ? quotation.alternativePart 
      : (quotation?.alternativePart ? [quotation.alternativePart] : []);
    
    if (recommendedIds.includes(selectedPartId)) {
      setSelectedOption("Option A – Recommended");
    } else if (alternativeIds.includes(selectedPartId)) {
      setSelectedOption("Option B – Alternative");
    } else {
      setSelectedOption(null);
    }
  }, [quotation?.customerSelection, quotation?.recommendedPart, quotation?.alternativePart]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const recommendedIds = Array.isArray(quotation?.recommendedPart) 
          ? quotation.recommendedPart 
          : (quotation?.recommendedPart ? [quotation.recommendedPart] : []);
        const alternativeIds = Array.isArray(quotation?.alternativePart) 
          ? quotation.alternativePart 
          : (quotation?.alternativePart ? [quotation.alternativePart] : []);
        const allIds = [...recommendedIds, ...alternativeIds].filter(Boolean);
        if (allIds.length === 0) {
          setOptionParts({});
          return;
        }
        const responses = await Promise.all(allIds.map((id) => api.get(`/part/getPartById/${id}`)));
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
  }, [quotation?.recommendedPart, quotation?.alternativePart]);

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

            <div className="text-gray-500">Customer Selection:</div>
            <div className="font-medium">
              {selectedOption ? (
                <span className="text-green-700 font-semibold">{selectedOption}</span>
              ) : (
                quotation.customerSelection || "-"
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(() => {
              const recommendedIds = Array.isArray(quotation.recommendedPart) 
                ? quotation.recommendedPart 
                : (quotation.recommendedPart ? [quotation.recommendedPart] : []);
              return recommendedIds.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold text-green-700 mb-2">Option A – Recommended ({recommendedIds.length} part{recommendedIds.length !== 1 ? 's' : ''})</div>
                  {recommendedIds.map((partId) => renderOptionCard("", partId, optionParts))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                  Option A – Recommended: Not provided
                </div>
              );
            })()}
            {(() => {
              const alternativeIds = Array.isArray(quotation.alternativePart) 
                ? quotation.alternativePart 
                : (quotation.alternativePart ? [quotation.alternativePart] : []);
              return alternativeIds.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold text-green-700 mb-2">Option B – Alternative ({alternativeIds.length} part{alternativeIds.length !== 1 ? 's' : ''})</div>
                  {alternativeIds.map((partId) => renderOptionCard("", partId, optionParts))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                  Option B – Alternative: Not provided
                </div>
              );
            })()}
          </div>

          {/* Cost Summary - Bottom Left (only show when approved/overridden) */}
          {quotation.status === "APPROVED" && (quotation.customerSelection || quotation.technicianOverride) && (() => {
            const recommendedIds = Array.isArray(quotation.recommendedPart) 
              ? quotation.recommendedPart 
              : (quotation.recommendedPart ? [quotation.recommendedPart] : []);
            const alternativeIds = Array.isArray(quotation.alternativePart) 
              ? quotation.alternativePart 
              : (quotation.alternativePart ? [quotation.alternativePart] : []);
            const allPartIds = [...recommendedIds, ...alternativeIds];
            const subtotal = allPartIds.reduce((sum, partId) => {
              const part = optionParts[partId];
              return sum + (part?.unitCost || 0);
            }, 0);
            const laborCost = quotation.laborCost || 0;
            const grandTotal = subtotal + laborCost;
            const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;

            return (
              <div className="mt-6 text-sm">
                <div className="text-gray-600">
                  Parts Subtotal: <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="text-gray-600">
                  Labor Cost: <span className="font-medium text-gray-900">{formatCurrency(laborCost)}</span>
                </div>
                <div className="font-semibold text-lg text-gray-900 mt-1">
                  Grand Total: {formatCurrency(grandTotal)}
                </div>
              </div>
            );
          })()}

          {quotation.technicianOverride && (
            <div className="mt-4 text-xs text-gray-600">
              Override logged on {quotation.overrideTimestamp ? new Date(quotation.overrideTimestamp).toLocaleString() : "-"}
                {quotation.overrideNotes && <span className="block">Note: <span className="italic mt-1">“{quotation.overrideNotes}”</span></span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const renderOptionCard = (label, partId, optionParts) => {
  if (!partId) {
    return null;
  }
  const part = optionParts[partId];
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white mb-2 flex items-center gap-3">
      <PartPhoto partId={part?.photoSourcePartId || partId} photoUrl={part?.partPhotoUrl} />
      <div className="flex-1 min-w-0">
        {label && <div className="text-xs font-semibold text-green-700 mb-1">{label}</div>}
        <div className="text-sm font-semibold text-gray-900">{part?.name || "Part #" + partId}</div>
        <div className="text-xs text-gray-500 mb-1">SKU: {part?.partNumber || "—"}</div>
        <div className="text-xs text-gray-600">₱{(part?.unitCost || 0).toFixed(2)}</div>
      </div>
    </div>
  );
};

export default ExistingQuotationCard; 