import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../config/ApiConfig';
import Toast from '../../../components/Toast/Toast.jsx';
import Spinner from '../../../components/Spinner/Spinner.jsx';
import { usePartPhoto } from '../../../hooks/usePartPhoto.js';

const PartPhoto = ({ partId, photoUrl }) => {
  const { data: src, isLoading, isError } = usePartPhoto(partId, photoUrl);

  if (isLoading) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (isError || !src) {
    return (
      <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Package size={24} className="text-gray-400" />
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

const RequiredActionsCard = ({ pendingQuotations = [], loading = false, onDecisionComplete = () => {} }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [parts, setParts] = useState([]);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(0);
  
  const itemsPerPage = 3;
  const totalPages = Math.ceil(pendingQuotations.length / itemsPerPage);
  const startIndex = page * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuotations = pendingQuotations.slice(startIndex, endIndex);
  
  const prevPage = () => setPage((p) => Math.max(0, p - 1));
  const nextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  
  // Reset to first page when pendingQuotations changes
  useEffect(() => {
    setPage(0);
  }, [pendingQuotations.length]);

  const closeToast = () => setToast((prev) => ({ ...prev, show: false }));

  const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;

  const openModal = async (action) => {
    setActiveAction(action);
    setModalOpen(true);
    // Handle both array and single value for initial selection
    const recommended = action.quotation.recommendedPart;
    const initialPartId = Array.isArray(recommended) ? (recommended[0] || null) : (recommended || null);
    setSelectedPartId(initialPartId);
    try {
      setModalLoading(true);
      const ids = Array.from(new Set(action.quotation.partIds || []));
      if (ids.length === 0) {
        setParts([]);
      } else {
        const responses = await Promise.all(ids.map((id) => api.get(`/part/getPartById/${id}`)));
        setParts(responses.map((res) => res.data));
      }
    } catch (err) {
      console.error('Failed to load quotation parts', err);
      setToast({ show: true, message: 'Failed to load part details. Please try again.', type: 'error' });
    } finally {
      setModalLoading(false);
    }
  };

  const getPart = (id) => parts.find((p) => p.id === id);

  const handleActionClick = (type) => {
    if (type === 'approve' && !selectedPartId) {
      setToast({ show: true, message: 'Please select a part before approving.', type: 'error' });
      return;
    }
    setActionType(type);
    setShowConfirm(true);
  };

  const confirmAction = async () => {
    if (!activeAction) return;
    setProcessing(true);
    try {
      if (actionType === 'approve') {
        if (!selectedPartId) {
          setToast({ show: true, message: 'Please select a part before approving.', type: 'error' });
          setProcessing(false);
          return;
        }
        await api.patch(`/quotation/approveQuotation/${activeAction.quotation.quotationId}`, null, {
          params: { customerSelection: String(selectedPartId) },
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setToast({ show: true, message: 'Quotation approved successfully. Ticket status updated to REPAIRING.', type: 'success' });
        setModalOpen(false);
        onDecisionComplete();
      } else if (actionType === 'reject') {
        await api.patch(`/quotation/denyQuotation/${activeAction.quotation.quotationId}`);
        setToast({ show: true, message: 'Quotation rejected', type: 'success' });
        setModalOpen(false);
        onDecisionComplete();
      }
    } catch (err) {
      console.error(`Failed to ${actionType} quotation`, err);
      const errorMessage = err?.response?.data?.message || err?.message || `Failed to ${actionType} the quotation. Please try again.`;
      setToast({ show: true, message: errorMessage, type: 'error' });
    } finally {
      setShowConfirm(false);
      setProcessing(false);
    }
  };

  const renderOption = (label, partIds) => {
    const ids = Array.isArray(partIds) ? partIds : (partIds ? [partIds] : []);
    if (ids.length === 0) {
      return (
        <div className="border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-500">
          {label}: Not provided.
        </div>
      );
    }
    const labor = activeAction?.quotation?.laborCost || 0;
    
    const totalPartsCost = ids.reduce((sum, partId) => {
      const part = getPart(partId);
      return sum + (Number(part?.unitCost) || 0);
    }, 0);
    
    const grandTotal = totalPartsCost + labor;
    
    const isOptionSelected = ids.some(id => selectedPartId === id);
    
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-green-700 mb-2">{label} {ids.length > 1 && `(${ids.length} parts)`}</div>
        <div className={`border rounded-lg p-3 ${isOptionSelected ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
          {ids.map((partId) => {
            const part = getPart(partId);
            return (
              <button
                key={partId}
                type="button"
                onClick={() => setSelectedPartId(partId)}
                className={`w-full text-left transition mb-3 last:mb-0 ${
                  selectedPartId === partId ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <PartPhoto partId={part?.id || partId} photoUrl={part?.partPhotoUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{part?.name || `Part #${partId}`}</div>
                    <div className="text-xs text-gray-500">SKU: {part?.partNumber || '—'}</div>
                    <div className="text-xs text-gray-600 mt-1">Part(s): {formatCurrency(part?.unitCost)}</div>
                  </div>
                </div>
              </button>
            );
          })}
          <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Part(s) Total:</span>
              <span>{formatCurrency(totalPartsCost)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Labor:</span>
              <span>{formatCurrency(labor)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Required Actions</h3>
        {loading && <Spinner size="small" />}
      </div>

      {/* Pagination controls in the top-right corner */}
      {pendingQuotations.length > itemsPerPage && (
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          <button
            onClick={prevPage}
            disabled={page <= 0 || loading}
            aria-label="Previous page"
            className={`p-1 rounded border bg-white hover:bg-gray-100 text-gray-700 ${page <= 0 || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextPage}
            disabled={loading || (totalPages > 0 && page >= totalPages - 1)}
            aria-label="Next page"
            className={`p-1 rounded border bg-white hover:bg-gray-100 text-gray-700 ${loading || (totalPages > 0 && page >= totalPages - 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4 min-h-[180px]">
        {pendingQuotations.length === 0 && !loading ? (
          <div className="text-center text-gray-500 py-8">You're all caught up. No actions required.</div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-8">Loading actions...</div>
        ) : (
          <>
            {paginatedQuotations.map((action) => (
              <div key={action.quotation.quotationId} className="flex items-start justify-between border border-gray-100 rounded-lg p-3 min-h-[60px]">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      Approve quotation for ticket {action.ticket.ticketNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires {action.quotation.expiryAt ? new Date(action.quotation.expiryAt).toLocaleDateString() : 'in 7 days'}
                    </div>
                  </div>
                </div>
                <button
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex-shrink-0"
                  onClick={() => openModal(action)}
                >
                  Compare & Decide
                </button>
              </div>
            ))}
            {/* Fill remaining space to maintain consistent height */}
            {paginatedQuotations.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedQuotations.length }).map((_, idx) => (
              <div key={`placeholder-${idx}`} className="min-h-[60px] opacity-0 pointer-events-none" aria-hidden="true">
                <div className="flex items-start justify-between border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium">&nbsp;</div>
                      <div className="text-xs">&nbsp;</div>
                    </div>
                  </div>
                  <div className="px-3 py-1"></div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Page indicator at bottom */}
      {!loading && totalPages > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">Page {page + 1} of {totalPages}</div>
      )}

      {modalOpen && activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Choose an option for ticket {activeAction.ticket.ticketNumber}</h4>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            {modalLoading ? (
              <div className="py-10 flex justify-center">
                <Spinner size="large" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {renderOption('Option A – Recommended', activeAction.quotation.recommendedPart || [])}
                  {renderOption('Option B – Alternative', activeAction.quotation.alternativePart || [])}
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Need help deciding? Call us at <strong>(02) 8700 1234</strong> and mention ticket{' '}
                  <strong>{activeAction.ticket.ticketNumber}</strong>.
                </p>
                                    <div className="flex justify-end gap-3">
                                      <button className="px-4 py-2 rounded-md border text-gray-700" onClick={() => setModalOpen(false)}>
                                        Cancel
                                      </button>
                                      <button
                                        className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => handleActionClick('reject')}
                                        disabled={modalLoading || processing}
                                      >
                                        Reject Quotation
                                      </button>
                                      <button
                                        className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60 flex items-center gap-2"
                                        onClick={() => handleActionClick('approve')}
                                        disabled={!selectedPartId || modalLoading || processing}
                                      >
                                        {processing && actionType === 'approve' && <Spinner size="small" />}
                                        Approve Selection
                                      </button>
                                    </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
    </div>
  );
};

export default RequiredActionsCard;