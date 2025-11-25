import React, { useEffect, useState } from "react";
import Spinner from "../../../components/Spinner/Spinner.jsx";

const StatusChangeConfirmModal = ({ isOpen, fromStatus, toStatus, onConfirm, onCancel, ticketNumber, loading }) => {
  if (!isOpen) return null;

  const requirePhotos = toStatus === "READY_FOR_PICKUP";
  const needsObservation = (fromStatus === "DIAGNOSING" || fromStatus === "RECEIVED") && toStatus === "AWAITING_PARTS";
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [observationText, setObservationText] = useState("");
  const [observationError, setObservationError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPhotos([]);
      setError(null);
      setObservationText("");
      setObservationError("");
    }
  }, [isOpen]);

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
    if (needsObservation && !observationText.trim()) {
      setObservationError("Please add a technician observation before moving this ticket.");
      return;
    }
    onConfirm({ photos, observation: observationText.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Confirm Status Change</h2>
          {ticketNumber && <span className="text-xs font-medium text-gray-500">Ticket #{ticketNumber}</span>}
        </div>

        <p className="text-sm text-gray-700 leading-relaxed">
          Confirm moving this ticket from <span className="font-semibold">{fromStatus?.replace(/_/g, " ")}</span> to{" "}
          <span className="font-semibold">{toStatus?.replace(/_/g, " ")}</span>. This action updates the customer&apos;s real-time view.
        </p>

        {needsObservation && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="technician-observation" className="text-sm font-semibold text-gray-900">
                Technician observation
                <span className="ml-1 text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">Visible to customer</span>
            </div>
            <textarea
              id="technician-observation"
              className={`mt-2 w-full rounded-lg border ${observationError ? "border-red-500" : "border-gray-200"} p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`}
              rows={5}
              value={observationText}
              onChange={(e) => {
                setObservationText(e.target.value);
                if (e.target.value.trim()) {
                  setObservationError("");
                }
              }}
              placeholder="Summarize the diagnosis and next steps so the customer knows why parts are needed."
            />
            {observationError && <p className="mt-2 text-xs text-red-600">{observationError}</p>}
          </div>
        )}

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

        {toStatus === "AWAITING_PARTS" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold text-amber-800">Quotation Prep Reminder</p>
            <p className="mt-1">
              Prepare quotations immediately after moving this ticket:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Option A – Recommended parts</li>
              <li>Option B – Alternative parts</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
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