import { useEffect, useState } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../config/ApiConfig.jsx';
import TicketDetailsModal from '../../../components/TicketDetailsModal/TicketDetailsModal';

const DocumentAccessCard = ({ customerEmail }) => {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Get email from prop, or fallback to sessionStorage, or localStorage
  const userEmail = customerEmail || (typeof window !== 'undefined' ? (() => {
    try {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.email;
      }
    } catch (e) {
      console.warn('Failed to parse userData from sessionStorage', e);
    }
    return localStorage.getItem('userEmail');
  })() : null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!userEmail) {
        setLoading(false);
        setTickets([]);
        return;
      }
      setLoading(true);
      try {
        const resp = await api.get('/repairTicket/getAllRepairTicketsByCustomerPaginated', {
          params: { email: userEmail, page },
          validateStatus: () => true // allow handling of 204
        });

        if (resp.status === 204 || !resp.data) {
          setTickets([]);
          setTotalPages(0);
          setError(null);
        } else {
          const data = resp.data;
          setTickets(Array.isArray(data.content) ? data.content : []);
          setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
          setError(null);
        }
      } catch (err) {
        console.warn('Failed to fetch documents', err);
        setError(err?.response?.data || err?.message || 'Failed to fetch documents');
        setTickets([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [userEmail, page]);

  const prevPage = () => setPage((p) => Math.max(0, p - 1));
  const nextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const formatDate = (d) => {
    if (!d) return '-';
    try {
      // DTO sends LocalDate like "2025-05-28"
      const dt = new Date(d);
      return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return d;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm relative">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Access</h3>

      {/* Pagination controls in the top-right corner */}
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

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading documents...</div>
        ) : error ? (
          <div className="text-center text-red-500">{typeof error === 'string' ? error : 'Failed to load documents'}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center text-gray-600">No documents available.</div>
        ) : (
          tickets.map((t) => (
            <div key={t.ticketNumber} className="flex items-center justify-between">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Repair Ticket - {t.ticketNumber}</div>
                  <div className="text-xs text-gray-500">{formatDate(t.checkInDate)}</div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>

      {/* Optional page indicator at bottom */}
      {!loading && totalPages > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">Page {page + 1} of {totalPages}</div>
      )}

      {/* Ticket details modal */}
      {selectedTicket && (
        <TicketDetailsModal 
          data={selectedTicket} 
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};

export default DocumentAccessCard;
