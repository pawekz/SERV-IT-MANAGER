import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ClipboardList, Laptop, Monitor, Printer } from 'lucide-react';
import api from '../../config/ApiConfig';
const progressMap = {
  RECEIVED: 10,
  DIAGNOSING: 30,
  AWAITING_PARTS: 40,
  REPAIRING: 60,
  READY_FOR_PICKUP: 90,
  COMPLETED: 100,
};

const ActiveRepairCard = ({ customerEmail, ticket: externalTicket, className = 'w-full md:w-1/2' }) => {
  const [ticket, setTicket] = useState(externalTicket || null);
  const [loading, setLoading] = useState(!externalTicket);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalTicket) return; // no need to fetch

    const fetchActiveTicket = async () => {
      if (!customerEmail) {
        setLoading(false);
        return;
      }
      try {
        // `api` automatically attaches Authorization header if token exists
        const { data } = await api.get('/repairTicket/getAllRepairTicketsByCustomer', {
          params: { email: customerEmail },
        });

        // pick first non-completed ticket as active
        const active = data.find((t) => t.repairStatus !== 'COMPLETED') || null;
        setTicket(active);
        setError(null);
      } catch (err) {
        setError(err?.message || 'Error fetching ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTicket();
  }, [customerEmail, externalTicket]);

  if (loading) return null; // or spinner
  if (error || !ticket) return null; // optionally show informative message

  const progress = progressMap[ticket.repairStatus] ?? 0;
  const statusColor = progress < 100 ? 'text-amber-500' : 'text-green-600';

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm mb-8 ${className}`}>
      <div className="flex flex-col md:flex-row">
        <div className="w-20 h-20 bg-gray-100 rounded md:mr-5 mb-4 md:mb-0 flex items-center justify-center">
          {(() => {
            const icons = {
              LAPTOP: Laptop,
              COMPUTER: Monitor,
              PRINTER: Printer,
            };
            const IconComp = icons[ticket.deviceType] || Monitor;
            return <IconComp className="w-12 h-12 text-gray-600" />;
          })()}
        </div>
        <div className="flex-1">
          <div className="text-gray-600 mb-3">Ticket #{ticket.ticketNumber}</div>

          <div className="flex items-center mb-2">
            <Clock className="h-4 w-4 text-gray-500 mr-2" />
            <div className="text-sm">Started: {ticket.checkInDate}</div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <div className="text-sm">
                Current Status: <strong className={statusColor}>{ticket.repairStatus.replaceAll('_', ' ')}</strong>
              </div>
              <div className="text-sm">{progress}% complete</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <Link to="/realtimestatus" state={{ ticketNumber: ticket.ticketNumber }}>
          <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium">
            <ClipboardList className="h-4 w-4 mr-2" />
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ActiveRepairCard; 