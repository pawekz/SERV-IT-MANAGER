import React from "react";
import { X, Package, Plus } from "lucide-react";
import Spinner from "../../components/Spinner/Spinner.jsx";

const SelectedPartsCard = ({ selectedParts, togglePartSelection, openInventoryModal, laborCost, setLaborCost, expiryDate, setExpiryDate, reminderHours, setReminderHours, editing, onCancelEditing, processing=false }) => {
  const preferredPart = selectedParts[0] || null;
  const alternativeParts = selectedParts.slice(1);
  const laborValue = parseFloat(laborCost || 0);
  const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;
  const renderPartSummary = (part) => {
    if (!part) return null;
    return (
      <div className="text-xs text-gray-600 mt-1">
        <div>Part Cost: {formatCurrency(part.price)}</div>
        <div>Labor: {formatCurrency(laborValue)}</div>
        <div className="font-semibold text-gray-800">Total: {formatCurrency(part.price + laborValue)}</div>
      </div>
    );
  };
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Selected Parts</h2>
          </div>
          <div className="text-sm text-gray-500">{selectedParts.length} items</div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Preferred Component */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Option A – Recommended</h3>
              <button onClick={openInventoryModal} className="text-gray-500 hover:text-green-600">
                <Plus size={18} />
              </button>
            </div>
            {preferredPart ? (
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <div>
                  <div className="text-sm font-medium text-gray-900">{preferredPart.name}</div>
                  <div className="text-xs text-gray-500">SKU: {preferredPart.sku}</div>
                  {renderPartSummary(preferredPart)}
                </div>
                <button
                  onClick={() => togglePartSelection(preferredPart)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No preferred component selected.</div>
            )}
          </div>

          {/* Alternative Components */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Option B – Alternative</h3>
              <button onClick={openInventoryModal} className="text-gray-500 hover:text-green-600">
                <Plus size={18} />
              </button>
            </div>
            {alternativeParts.length > 0 ? (
              alternativeParts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between mb-2 last:mb-0 bg-white p-2 rounded"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{part.name}</div>
                    <div className="text-xs text-gray-500">SKU: {part.sku}</div>
                    {renderPartSummary(part)}
                  </div>
                  <button
                    onClick={() => togglePartSelection(part)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No alternative components selected.</div>
            )}
          </div>
        </div>

        {/* Labor Cost Input */}
        {selectedParts.length > 0 && (
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
        {selectedParts.length > 0 && (
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
        {selectedParts.length > 0 && (
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