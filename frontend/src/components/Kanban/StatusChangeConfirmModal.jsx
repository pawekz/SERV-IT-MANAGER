import React from "react";
import Spinner from "../Spinner/Spinner";

const StatusChangeConfirmModal = ({ isOpen, fromStatus, toStatus, onConfirm, onCancel, ticketNumber, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Confirm Status Change</h2>
        <p className="mb-6 text-sm text-gray-700">
          Are you sure you want to move ticket <span className="font-medium">{ticketNumber}</span> from
          <span className="font-semibold mx-1">{fromStatus}</span> to
          <span className="font-semibold mx-1">{toStatus}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 flex items-center justify-center bg-teal-600 text-white rounded hover:bg-teal-700 text-sm ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size="small" /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeConfirmModal; 