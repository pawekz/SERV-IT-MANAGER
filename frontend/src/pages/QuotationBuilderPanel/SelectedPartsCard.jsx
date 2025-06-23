import React from "react";
import { X, Package, Plus } from "lucide-react";

const SelectedPartsCard = ({ selectedParts, togglePartSelection, openInventoryModal }) => {
  const preferredPart = selectedParts[0] || null;
  const alternativeParts = selectedParts.slice(1);
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
              <h3 className="font-medium text-gray-700">Preferred Component</h3>
              <button onClick={openInventoryModal} className="text-gray-500 hover:text-green-600">
                <Plus size={18} />
              </button>
            </div>
            {preferredPart ? (
              <div className="flex items-center justify-between bg-white p-2 rounded">
                <div>
                  <div className="text-sm font-medium text-gray-900">{preferredPart.name}</div>
                  <div className="text-xs text-gray-500">SKU: {preferredPart.sku}</div>
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
              <h3 className="font-medium text-gray-700">Alternative Components</h3>
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

        {/* Action */}
        {selectedParts.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("send-quotation"))}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Send Quotation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedPartsCard; 