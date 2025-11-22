import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import api from '../../config/ApiConfig';
import Spinner from "../../components/Spinner/Spinner.jsx";
import { Package, FileText, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

// Component to handle part photo display with presigned URL fetching
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

      // Check if it's an S3 URL that needs presigning
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
      <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center animate-pulse">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
        <Package size={32} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt="Part photo"
      className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
      onError={() => setError(true)}
    />
  );
};

const QuotationViewer = () => {
  const { ticketNumber } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const repairStatusContext = (searchParams.get("repairStatus") || "").toUpperCase();
  const [quotation, setQuotation] = useState(null);
  const [recommendedParts, setRecommendedParts] = useState([]);
  const [alternativeParts, setAlternativeParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketNumber}`);
        if (!data || data.length === 0) {
          setError("No quotation found for this ticket");
          setLoading(false);
          return;
        }
        const q = data[0];
        setQuotation(q);
        
        // Fetch recommended parts (Option A)
        const recommendedIds = Array.isArray(q.recommendedPart) 
          ? q.recommendedPart 
          : (q.recommendedPart ? [q.recommendedPart] : []);
        if (recommendedIds.length > 0) {
          const recommendedResponses = await Promise.all(
            recommendedIds.map(id => api.get(`/part/getPartById/${id}`))
          );
          setRecommendedParts(recommendedResponses.map(r => r.data));
        }
        
        // Fetch alternative parts (Option B)
        const alternativeIds = Array.isArray(q.alternativePart) 
          ? q.alternativePart 
          : (q.alternativePart ? [q.alternativePart] : []);
        if (alternativeIds.length > 0) {
          const alternativeResponses = await Promise.all(
            alternativeIds.map(id => api.get(`/part/getPartById/${id}`))
          );
          setAlternativeParts(alternativeResponses.map(r => r.data));
        }
      } catch (e) {
        setError("Failed to load quotation");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center"><Spinner size="large"/></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-red-600">{error}</div>
      </div>
    );
  }

  const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;
  
  // Determine which option was selected
  const selectionId = quotation?.customerSelection ? Number(quotation.customerSelection) : null;
  const isRecommendedSelected = selectionId !== null && recommendedParts.some(p => p.id === selectionId);
  const isAlternativeSelected = selectionId !== null && alternativeParts.some(p => p.id === selectionId);
  const selectedOption = isRecommendedSelected ? "A" : (isAlternativeSelected ? "B" : null);
  
  // Calculate totals
  const recommendedPartsTotal = recommendedParts.reduce((sum, p) => sum + (p.unitCost || 0), 0);
  const alternativePartsTotal = alternativeParts.reduce((sum, p) => sum + (p.unitCost || 0), 0);
  const laborCost = quotation?.laborCost || 0;
  
  const recommendedTotal = recommendedPartsTotal + laborCost;
  const alternativeTotal = alternativePartsTotal + laborCost;
  
  // Get selected parts for display
  const selectedParts = selectedOption === "A" ? recommendedParts : (selectedOption === "B" ? alternativeParts : []);
  const selectedPartsTotal = selectedParts.reduce((sum, p) => sum + (p.unitCost || 0), 0);
  const selectedTotal = selectedPartsTotal + laborCost;
  
  const showSelectionOnly = repairStatusContext === "REPAIRING" && selectedOption !== null;

  const getStatusIcon = () => {
    switch (quotation?.status?.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle size={18} className="text-blue-600" />;
      case "REJECTED":
      case "DECLINED":
        return <XCircle size={18} className="text-red-600" />;
      case "EXPIRED":
        return <Clock size={18} className="text-gray-600" />;
      default:
        return <Clock size={18} className="text-yellow-600" />;
    }
  };

  const renderPartCard = (part, isSelected = false) => (
    <div key={part.id} className={`border rounded-lg p-4 flex gap-4 ${isSelected ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'}`}>
      {/* Part Image */}
      <div className="flex-shrink-0">
        <PartPhoto partId={part.id} photoUrl={part.partPhotoUrl} />
      </div>
      
      {/* Part Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 mb-1">{part.name}</div>
            <div className="text-xs text-gray-500">SKU: {part.partNumber}</div>
            {part.serialNumber && (
              <div className="text-xs text-gray-500">Serial: {part.serialNumber}</div>
            )}
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <div className="font-bold text-gray-900">{formatCurrency(part.unitCost || 0)}</div>
          </div>
        </div>
        {part.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{part.description}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 font-['Poppins',sans-serif]">
      <Sidebar />
      <div className="flex-1 p-4 md:p-6 lg:p-8 ml-[250px] w-full max-w-full">
        {/* Quotation Header */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Repair Quotation</h1>
                <p className="text-sm text-gray-500">Ticket #{ticketNumber}</p>
              </div>
            </div>
            {quotation?.status && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100">
                {getStatusIcon()}
                <span className="font-medium text-gray-700">{quotation.status}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {quotation?.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'short', day: 'numeric' 
                }) : '-'}
              </span>
            </div>
            {quotation?.expiryAt && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-600">Expires:</span>
                <span className="font-medium text-gray-900">
                  {new Date(quotation.expiryAt).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })}
                </span>
              </div>
            )}
            {quotation?.quotationId && (
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <span className="text-gray-600">ID:</span>
                <span className="font-medium text-gray-900">#{quotation.quotationId}</span>
              </div>
            )}
          </div>
        </div>

        {showSelectionOnly && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-gray-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Approved Option</div>
                <div className="text-gray-600">Displaying approved selection only.</div>
              </div>
            </div>
          </div>
        )}

        {!showSelectionOnly ? (
          /* Show Both Options */
          <div className="space-y-4">
            {/* Option A - Recommended */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 px-4 md:px-6 py-3 bg-gray-50">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                  <Package size={18} className="text-gray-600" />
                  <span>Option A – Recommended</span>
                  {recommendedParts.length > 1 && (
                    <span className="text-sm font-normal text-gray-500">({recommendedParts.length} parts)</span>
                  )}
                  {selectedOption === "A" && (
                    <span className="ml-auto px-2 py-1 bg-gray-700 text-white text-xs rounded flex items-center gap-1">
                      <CheckCircle size={12} /> Selected
                    </span>
                  )}
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {recommendedParts.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {recommendedParts.map(part => renderPartCard(part, selectedOption === "A"))}
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-end">
                        <div className="text-right space-y-1 min-w-[200px]">
                          <div className="text-sm text-gray-600">
                            Parts: <span className="font-semibold text-gray-900">{formatCurrency(recommendedPartsTotal)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Labor: <span className="font-semibold text-gray-900">{formatCurrency(laborCost)}</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                            Total: {formatCurrency(recommendedTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">No recommended parts provided</div>
                )}
              </div>
            </div>

            {/* Option B - Alternative */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 px-4 md:px-6 py-3 bg-gray-50">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                  <Package size={18} className="text-gray-600" />
                  <span>Option B – Alternative</span>
                  {alternativeParts.length > 1 && (
                    <span className="text-sm font-normal text-gray-500">({alternativeParts.length} parts)</span>
                  )}
                  {selectedOption === "B" && (
                    <span className="ml-auto px-2 py-1 bg-gray-700 text-white text-xs rounded flex items-center gap-1">
                      <CheckCircle size={12} /> Selected
                    </span>
                  )}
                </h2>
              </div>
              <div className="p-4 md:p-6">
                {alternativeParts.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {alternativeParts.map(part => renderPartCard(part, selectedOption === "B"))}
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-end">
                        <div className="text-right space-y-1 min-w-[200px]">
                          <div className="text-sm text-gray-600">
                            Parts: <span className="font-semibold text-gray-900">{formatCurrency(alternativePartsTotal)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Labor: <span className="font-semibold text-gray-900">{formatCurrency(laborCost)}</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                            Total: {formatCurrency(alternativeTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">No alternative parts provided</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Show Selected Option Only */
          <div className="bg-white rounded-lg border-2 border-white-200">
            <div className="bg-blue-700 px-4 md:px-6 py-3 text-white">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                Approved Selection - Option {selectedOption} {selectedOption === "A" ? "– Recommended" : "– Alternative"}
              </h2>
            </div>
            <div className="p-4 md:p-6">
              <div className="space-y-3 mb-4">
                {selectedParts.map(part => renderPartCard(part, true))}
              </div>
              <div className="border-t-2 border-gray-200 pt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-end">
                  <div className="text-right space-y-1 min-w-[200px]">
                    <div className="text-sm text-gray-700">
                      Parts: <span className="font-semibold text-gray-900">{formatCurrency(selectedPartsTotal)}</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      Labor: <span className="font-semibold text-gray-900">{formatCurrency(laborCost)}</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                      Total: {formatCurrency(selectedTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        {quotation?.expiryAt && (
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 text-xs text-gray-600 text-center">
            <p>Valid until {new Date(quotation.expiryAt).toLocaleDateString()}. 
            {quotation?.status === "PENDING" && " Please review and approve your preferred option."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationViewer; 