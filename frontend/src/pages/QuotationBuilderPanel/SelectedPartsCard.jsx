import React, { useState, useEffect } from "react";
import { X, Package, Plus } from "lucide-react";
import Spinner from "../../components/Spinner/Spinner.jsx";
import api from '../../config/ApiConfig';

// PartPhoto component for displaying part images
const PartPhoto = ({ partId, photoUrl }) => {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPhoto = async () => {
      if (!photoUrl || photoUrl === '0' || photoUrl.trim() === '') {
        setLoading(false);
        setError(true);
        return;
      }

      if (photoUrl.includes('amazonaws.com/') && partId) {
        try {
          const response = await api.get(`/part/getPartPhoto/${partId}`);
          if (response.data) {
            setSrc(response.data);
          } else {
            setError(true);
          }
        } catch (err) {
          console.error('Error fetching presigned photo URL:', err);
          setError(true);
        }
      } else {
        setSrc(photoUrl);
      }
      setLoading(false);
    };

    fetchPhoto();
  }, [partId, photoUrl]);

  if (loading) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse flex-shrink-0">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !src) {
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
      onError={() => setError(true)}
    />
  );
};

const SelectedPartsCard = ({ optionA = [], optionB = [], removePartFromSlot, openInventoryModal, laborCost, setLaborCost, expiryDate, setExpiryDate, reminderHours, setReminderHours, editing, onCancelEditing, processing=false }) => {
  const laborValue = parseFloat(laborCost || 0);
  const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;
  const totalParts = optionA.length + optionB.length;
  
  // Calculate subtotal (sum of all parts)
  const subtotal = [...optionA, ...optionB].reduce((sum, part) => sum + (part.price || 0), 0);
  const grandTotal = subtotal + laborValue;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Selected Parts</h2>
          </div>
          <div className="text-sm text-gray-500">{totalParts} item{totalParts !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option A – Recommended */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">
                Option A – Recommended {optionA.length > 0 && `(${optionA.length})`}
              </h3>
              <button onClick={() => openInventoryModal("A")} className="text-gray-500 hover:text-green-600">
                <Plus size={18} />
              </button>
            </div>
            {optionA.length > 0 ? (
              <div className="space-y-2">
                {optionA.map((part) => (
                  <div key={part.id} className="flex items-center gap-3 bg-white p-2 rounded">
                    <PartPhoto partId={part.id} photoUrl={part.partPhotoUrl || part.image} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{part.name}</div>
                      <div className="text-xs text-gray-500">SKU: {part.sku}</div>
                      <div className="text-xs text-gray-600 mt-1">₱{(part.price || 0).toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => removePartFromSlot(part, "A")}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No recommended parts selected.</div>
            )}
          </div>

          {/* Option B – Alternative */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">
                Option B – Alternative {optionB.length > 0 && `(${optionB.length})`}
              </h3>
              <button onClick={() => openInventoryModal("B")} className="text-gray-500 hover:text-green-600">
                <Plus size={18} />
              </button>
            </div>
            {optionB.length > 0 ? (
              <div className="space-y-2">
                {optionB.map((part) => (
                  <div key={part.id} className="flex items-center gap-3 mb-2 last:mb-0 bg-white p-2 rounded">
                    <PartPhoto partId={part.id} photoUrl={part.partPhotoUrl || part.image} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{part.name}</div>
                      <div className="text-xs text-gray-500">SKU: {part.sku}</div>
                      <div className="text-xs text-gray-600 mt-1">₱{(part.price || 0).toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => removePartFromSlot(part, "B")}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No alternative parts selected.</div>
            )}
          </div>
        </div>

        {/* Labor Cost Input */}
        {totalParts > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Labor Cost (₱)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              className="w-full md:w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        {/* Expiry & Reminder Settings */}
        {totalParts > 0 && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              {/* Use native date input for simplicity; can swap with react-calendar */}
              <input type="date" value={expiryDate?.toISOString().substring(0,10)} onChange={e=>setExpiryDate(new Date(e.target.value))}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reminder (hrs)</label>
              <input type="number" min="1" value={reminderHours} onChange={e=>setReminderHours(e.target.value)}
                className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
              <p className="text-xs text-gray-500 mt-1">Customers will receive automated follow-ups every {reminderHours} hour(s).</p>
            </div>
          </div>
        )}

        {/* Action */}
        {totalParts > 0 && (
          <div className="flex justify-end mt-6 space-x-2">
            {editing && (
              <button
                onClick={onCancelEditing}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                disabled={processing}
              >
                Cancel Editing
              </button>
            )}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("send-quotation"))}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={processing}
            >
              {processing && <Spinner size="small" />}
              {processing ? (editing ? "Updating..." : "Sending...") : (editing ? "Update Quotation" : "Send Quotation")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedPartsCard; 