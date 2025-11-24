import { useEffect, useState } from 'react';
import { Clock, FileText, CheckCircle, Package, Wrench, Truck, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../config/ApiConfig.jsx';
import { connectWebSocket, disconnectWebSocket, subscribeToTopic, unsubscribeFromTopic } from '../../../config/WebSocketConfig.jsx';

const RecentUpdatesCard = ({ customerEmail }) => {
  const [updates, setUpdates] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get email from prop, or fallback to sessionStorage
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
    return null;
  })() : null);

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return '—';
    }
  };

  // Get icon and color for event type
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'TICKET_CREATED':
        return { icon: FileText, color: 'bg-blue-50 text-blue-600' };
      case 'STATUS_CHANGED':
        return { icon: CheckCircle, color: 'bg-green-50 text-green-600' };
      case 'QUOTATION_CREATED':
      case 'QUOTATION_UPDATED':
        return { icon: AlertCircle, color: 'bg-amber-50 text-amber-600' };
      case 'QUOTATION_APPROVED':
        return { icon: CheckCircle, color: 'bg-green-50 text-green-600' };
      case 'QUOTATION_DENIED':
        return { icon: AlertCircle, color: 'bg-red-50 text-red-600' };
      case 'PARTS_ORDERED':
        return { icon: Package, color: 'bg-purple-50 text-purple-600' };
      default:
        return { icon: Clock, color: 'bg-gray-50 text-gray-600' };
    }
  };

  const fetchUpdates = async () => {
    if (!userEmail) {
      setLoading(false);
      setUpdates([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await api.get('/repairTicket/getRecentUpdates', {
        params: { email: userEmail, page, size: 3 },
        validateStatus: () => true
      });

      if (resp.status === 204 || !resp.data) {
        setUpdates([]);
        setTotalPages(0);
        setError(null);
      } else {
        const data = resp.data;
        setUpdates(Array.isArray(data.content) ? data.content : []);
        setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 0);
        setError(null);
      }
    } catch (err) {
      console.warn('Failed to fetch recent updates', err);
      setError(err?.response?.data || err?.message || 'Failed to fetch updates');
      setUpdates([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [userEmail, page]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!userEmail) return;
    let repairSubscription = null;
    
    connectWebSocket({
      onConnect: () => {
        // Subscribe to repair ticket updates
        repairSubscription = subscribeToTopic('/topic/repair-tickets', (message) => {
          try {
            if (message && message.body) {
              const update = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
              // Only refresh if it's for this customer
              if (update && update.customerEmail === userEmail) {
                fetchUpdates();
              }
            } else {
              // If no body, refresh anyway (some messages might not have body)
              fetchUpdates();
            }
          } catch (e) {
            console.warn('Failed to parse WebSocket message', e);
            // Refresh on error to be safe
            fetchUpdates();
          }
        });
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      }
    });

    return () => {
      unsubscribeFromTopic(repairSubscription);
      // Don't disconnect WebSocket here as other components might be using it
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const prevPage = () => setPage((p) => Math.max(0, p - 1));
  const nextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm relative">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Updates</h3>

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

      <div className="h-[252px] relative overflow-hidden">
        <div 
          key={`${page}-${loading}`} 
          className="space-y-4 absolute inset-0 animate-fade-in"
        >
          {loading ? (
            <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">Loading updates...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8 h-full flex items-center justify-center">{typeof error === 'string' ? error : 'Failed to load updates'}</div>
          ) : updates.length === 0 ? (
            <div className="text-center text-gray-600 py-8 h-full flex items-center justify-center">No updates available.</div>
          ) : (
            <>
              {updates.map((update, idx) => {
                const { icon: Icon, color } = getEventIcon(update.eventType);
                return (
                  <div key={`${update.ticketNumber}-${update.timestamp}-${idx}`} className="flex items-start min-h-[60px]">
                    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">{update.message}</div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(update.timestamp)} • #{update.ticketNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Fill remaining space to maintain consistent height */}
              {updates.length < 3 && Array.from({ length: 3 - updates.length }).map((_, idx) => (
                <div key={`placeholder-${idx}`} className="min-h-[60px] opacity-0 pointer-events-none" aria-hidden="true">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="font-medium">&nbsp;</div>
                      <div className="text-xs">&nbsp;</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Page indicator at bottom */}
      {!loading && totalPages > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">Page {page + 1} of {totalPages}</div>
      )}
    </div>
  );
};

export default RecentUpdatesCard; 