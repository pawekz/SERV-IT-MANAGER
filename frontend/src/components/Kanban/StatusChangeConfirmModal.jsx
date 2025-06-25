import React, { useState } from "react";
import Spinner from "../Spinner/Spinner";

const StatusChangeConfirmModal = ({ isOpen, fromStatus, toStatus, onConfirm, onCancel, ticketNumber, loading }) => {
  if (!isOpen) return null;

  const requirePhotos = toStatus === "READY_FOR_PICKUP";
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Allow max 3
    if (files.length > 3) {
      setError("You can upload a maximum of 3 photos.");
      return;
    }
    setError(null);
    setPhotos(files);
  };

  const handleConfirm = () => {
    if (requirePhotos && photos.length === 0) {
      setError("Please upload at least 1 photo.");
      return;
    }
    onConfirm(photos);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Confirm Status Change</h2>
        <p className="mb-4 text-sm text-gray-700">
          Are you sure you want to move ticket <span className="font-medium">{ticketNumber}</span> from
          <span className="font-semibold mx-1">{fromStatus}</span> to
          <span className="font-semibold mx-1">{toStatus}</span>?
        </p>

        {requirePhotos && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload After-Repair Photos (max 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="mb-3"
            />
            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          </>
        )}

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
            onClick={handleConfirm}
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