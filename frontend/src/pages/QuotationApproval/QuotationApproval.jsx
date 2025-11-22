import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import api from '../../config/ApiConfig';
import Spinner from "../../components/Spinner/Spinner.jsx";
import ActiveRepairCard from "../DashboardPage/CustomerDashboardComponents/ActiveRepairCard.jsx";
import Toast from "../../components/Toast/Toast.jsx";

const QuotationApproval = () => {
  const { ticketNumber } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [actionDone, setActionDone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    const fetchQuotationAndParts = async () => {
      try {
        // Fetch quotation for the ticket
        const { data } = await api.get(
          `/quotation/getQuotationByRepairTicketNumber/${ticketNumber}`
        );
        if (!data || data.length === 0) {
          setError("No quotation found for this ticket.");
          setLoading(false);
          return;
        }
        const q = data[0];
        setQuotation(q);

        // Fetch ticket details for card display
        try {
          const { data: ticketData } = await api.get(`/repairTicket/getRepairTicket/${ticketNumber}`);
          setTicket(ticketData);
        } catch (ticketErr) {
          console.error("Failed to fetch ticket details", ticketErr);
        }

        // Fetch details for each part ID in parallel
        const partResponses = await Promise.all(
          q.partIds.map((id) => api.get(`/part/getPartById/${id}`))
        );
        const fetchedParts = partResponses.map((res) => res.data);
        setParts(fetchedParts);
        // default select recommended (first)
        if (fetchedParts.length > 0) setSelectedPartId(fetchedParts[0].id);
      } catch (e) {
        console.error("Failed to fetch quotation or parts", e);
        setError("Failed to load quotation. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationAndParts();
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-red-600 font-medium">
          {error}
        </div>
      </div>
    );
  }

  // Helpers for UI
  let recommendedParts = [];
  let alternativeParts = [];
  if (parts.length > 0) {
    const recommendedIds = Array.isArray(quotation?.recommendedPart) 
      ? quotation.recommendedPart.map(id => parseInt(id))
      : (quotation?.recommendedPart ? [parseInt(quotation.recommendedPart)] : []);
    const alternativeIds = Array.isArray(quotation?.alternativePart) 
      ? quotation.alternativePart.map(id => parseInt(id))
      : (quotation?.alternativePart ? [parseInt(quotation.alternativePart)] : []);
    recommendedParts = parts.filter(p => recommendedIds.includes(p.id));
    alternativeParts = parts.filter(p => alternativeIds.includes(p.id));
    // Fallback to first part if no recommended parts specified
    if (recommendedParts.length === 0 && parts.length > 0) {
      recommendedParts = [parts[0]];
      alternativeParts = parts.slice(1);
    }
  }
  const selectedPart = parts.find((p) => p.id === selectedPartId) || null;
  const laborValue = quotation?.laborCost || 0;
  const totalPrice = (selectedPart?.unitCost || 0) + laborValue;
  const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;

  // Handle approve/reject click
  const handleActionClick = (type) => {
    setActionType(type);
    setShowConfirm(true);
  };

  // Confirm modal action
  const confirmAction = async () => {
    if (!quotation) return;
    setProcessing(true);
    try {
      if (actionType === "approve") {
        if (!selectedPartId) {
          setToast({ show: true, message: "Please select a part before approving.", type: "error" });
          return;
        }
        await api.patch(`/quotation/approveQuotation/${quotation.quotationId}`, null, { params: { customerSelection: selectedPartId } });
        setToast({ show: true, message: "Quotation approved successfully. Ticket status updated to REPAIRING.", type: "success" });
        setQuotation(prev => ({ ...prev, status: "APPROVED", customerSelection: selectedPartId }));
      } else if (actionType === "reject") {
        await api.patch(`/quotation/denyQuotation/${quotation.quotationId}`);
        setToast({ show: true, message: "Quotation rejected", type: "success" });
        setQuotation(prev => ({ ...prev, status: "REJECTED" }));
      }
      setActionDone(true);
    } catch (err) {
      console.error(`Failed to ${actionType} quotation`, err);
      setToast({ show: true, message: `Failed to ${actionType} quotation.`, type: "error" });
    } finally {
      setShowConfirm(false);
      setProcessing(false);
    }
  };

  const renderPartRow = (part) => {
    const selected = selectedPartId === part.id;
    return (
      <button
        key={part.id}
        type="button"
        onClick={() => setSelectedPartId(part.id)}
        className={`w-full flex items-center justify-between p-3 rounded mb-2 last:mb-0 text-left transition shadow-sm border ${
          selected ? "border-green-600 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
      >
        <div>
          <div className="text-sm font-medium text-gray-900">{part.name}</div>
          <div className="text-xs text-gray-500">SKU: {part.partNumber}</div>
          <div className="text-xs text-gray-500 mt-1">
            Part: {formatCurrency(part.unitCost)} • Labor: {formatCurrency(laborValue)}
          </div>
          <div className="text-xs font-semibold text-gray-800">
            Total: {formatCurrency((part.unitCost || 0) + laborValue)}
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-800">₱{part.unitCost?.toFixed(2)}</span>
      </button>
    );
  };

  const isFinal = quotation?.status === "APPROVED" || quotation?.status === "REJECTED" || actionDone;

  return (
    <div className="flex min-h-screen font-['Poppins',sans-serif] bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 ml-[250px] bg-gray-50">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800 flex-1">Quotation for Ticket {ticketNumber}</h1>
          <div className="relative group">
            <button className="text-gray-500 hover:text-gray-700" aria-label="info">
              <HelpCircle size={20} />
            </button>
            <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-max max-w-xs right-0 top-full mt-1">
              Recommended by Tech: default part suggested by technician.<br />Alternative Option: other parts you may choose instead.
            </div>
          </div>
        </div>

        {quotation?.technicianOverride && (
          <div className="mb-4 p-3 rounded-md bg-purple-50 border border-purple-200 text-sm text-purple-700">
            Technician override documented on{" "}
            {quotation.overrideTimestamp ? new Date(quotation.overrideTimestamp).toLocaleString() : "-"}.
            {quotation.overrideNotes && <> Notes: {quotation.overrideNotes}</>}
          </div>
        )}

        {/* Ticket summary card */}
        {ticket && (
          <div className="mb-8">
            <ActiveRepairCard ticket={ticket} className="w-full" />
          </div>
        )}

        {/* Selected Parts Card Style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 p-5">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recommended Component */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                Recommended by Tech {recommendedParts.length > 1 && `(${recommendedParts.length} parts)`}
              </h3>
              {recommendedParts.length > 0 ? (
                recommendedParts.map(part => renderPartRow(part))
              ) : (
                <div className="text-sm text-gray-500">No recommended parts.</div>
              )}
            </div>

            {/* Alternative Components */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                Alternative Option{alternativeParts.length !== 1 ? "s" : ""} {alternativeParts.length > 1 && `(${alternativeParts.length} parts)`}
              </h3>
              {alternativeParts.length > 0 ? (
                alternativeParts.map(part => renderPartRow(part))
              ) : (
                <div className="text-sm text-gray-500">No alternative parts.</div>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="flex justify-end mt-6 text-sm">
            <div>
              <div>
                Labor Cost: <span className="font-medium">{formatCurrency(quotation.laborCost)}</span>
              </div>
              <div className="font-semibold text-lg">
                Total: {formatCurrency(totalPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons or status message */}
        {isFinal ? (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-700 font-medium">
            {quotation?.status === "APPROVED" ? "You have approved this quotation." : "You have rejected this quotation."}
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow disabled:opacity-50"
              disabled={!selectedPartId}
              onClick={() => handleActionClick("approve")}
            >
              Approve Quotation
            </button>
            <button
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow"
              onClick={() => handleActionClick("reject")}
            >
              Reject Quotation
            </button>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm {actionType === "approve" ? "Approval" : "Rejection"}</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to {actionType === "approve" ? "approve" : "reject"} this quotation?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`px-4 py-2 text-white rounded-md flex items-center justify-center gap-2 ${actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} disabled:opacity-50`}
                  disabled={processing}
                >
                  {processing && <Spinner size="small" />}
                  {processing ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      </div>
    </div>
  );
};

export default QuotationApproval; 