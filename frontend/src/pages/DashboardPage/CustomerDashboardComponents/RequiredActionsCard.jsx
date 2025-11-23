import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import api from '../../../config/ApiConfig';
import Toast from '../../../components/Toast/Toast.jsx';
import Spinner from '../../../components/Spinner/Spinner.jsx';

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
        // Use URL directly if it's not S3
        setSrc(photoUrl);
      }
      setLoading(false);
    };

    fetchPhoto();
  }, [partId, photoUrl]);

  if (loading) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !src) {
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
      onError={() => setError(true)}
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

  const handleApprove = async () => {
    if (!activeAction || !selectedPartId) return;
    try {
      setModalLoading(true);
      await api.patch(`/quotation/approveQuotation/${activeAction.quotation.quotationId}`, null, {
        params: { customerSelection: String(selectedPartId) },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setToast({ show: true, message: 'Quotation approved successfully. Ticket status updated to REPAIRING.', type: 'success' });
      setModalOpen(false);
      onDecisionComplete();
    } catch (err) {
      console.error('Failed to approve quotation', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to approve the quotation. Please try again.';
      setToast({ show: true, message: errorMessage, type: 'error' });
    } finally {
      setModalLoading(false);
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
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Required Actions</h3>
        {loading && <Spinner size="small" />}
      </div>
      {pendingQuotations.length === 0 && !loading ? (
        <p className="text-sm text-gray-500">You’re all caught up. No actions required.</p>
      ) : (
        <div className="space-y-4">
          {pendingQuotations.map((action) => (
            <div key={action.quotation.quotationId} className="flex items-start justify-between border border-gray-100 rounded-lg p-3">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mr-3">
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
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                onClick={() => openModal(action)}
              >
                Compare & Decide
              </button>
            </div>
          ))}
        </div>
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
                    className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-60"
                    onClick={handleApprove}
                    disabled={!selectedPartId || modalLoading}
                  >
                    Approve Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
    </div>
  );
};

export default RequiredActionsCard;