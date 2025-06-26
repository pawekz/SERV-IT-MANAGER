import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ActiveRepairCard from './ActiveRepairCard.jsx';
import api from '../../../services/api.jsx';

const ActiveRepairsCarousel = ({ customerEmail }) => {
  const [tickets, setTickets] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!customerEmail) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/repairTicket/getRepairTicketsByCustomerEmail', {
          params: { email: customerEmail },
        });
        const active = data.filter((t) => t.repairStatus !== 'COMPLETED');
        setTickets(active);
        setError(null);
      } catch (err) {
        setError(err?.message || 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [customerEmail]);

  if (loading) return null;
  if (error || tickets.length === 0) return null;

  const prev = () => setCurrent((prev) => (prev - 2 + tickets.length) % tickets.length);
  const next = () => setCurrent((prev) => (prev + 2) % tickets.length);

  const visibleTickets = tickets.length === 1
    ? [tickets[0]]
    : [tickets[current], tickets[(current + 1) % tickets.length]].filter((t, idx, arr) => arr.indexOf(t) === idx);

  return (
    <div className="relative w-full mb-8">
      <div className="flex flex-wrap -mx-2">
        {visibleTickets.map((t) => (
          <div key={t.ticketNumber} className="px-2 flex-1 min-w-[50%]">
            <ActiveRepairCard ticket={t} className="w-full" />
          </div>
        ))}
      </div>

      {tickets.length > 2 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-1 hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-1 hover:bg-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default ActiveRepairsCarousel; 