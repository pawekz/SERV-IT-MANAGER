import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ActiveRepairCard from './ActiveRepairCard.jsx';
import api from '../../../config/ApiConfig.jsx';

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
        const { data } = await api.get('/repairTicket/getAllRepairTicketsByCustomer', {
          params: { email: customerEmail },
        });
        const active = data.filter((t) => t.repairStatus !== 'COMPLETED');
        setTickets(active);
        setError(null);
      } catch (err) {
        console.warn('Failed to fetch tickets', err);
        setError(err?.message || 'Failed to fetch tickets');
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [customerEmail]);

  // If still loading, show a loading placeholder
  if (loading) {
    return (
      <div className="w-full mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-600">
          Loading active tickets...
        </div>
      </div>
    );
  }

  // Show empty-state card when there are no active tickets or an error occurred
  if (tickets.length === 0) {
    return (
      <div className="w-full mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-600">
          {error ? 'There are no active tickets.' : 'There are no active tickets.'}
        </div>
      </div>
    );
  }

  const prev = () => {
    if (tickets.length <= 2) return;
    setCurrent((prev) => (prev - 2 + tickets.length) % tickets.length);
  };

  const next = () => {
    if (tickets.length <= 2) return;
    setCurrent((prev) => (prev + 2) % tickets.length);
  };

  // Calculate translateX based on current index
  // Each slide shows 2 items, so we move by 50% per slide
  const translateX = -(current * 50);

  return (
    <div className="relative w-full mb-8 overflow-hidden">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(${translateX}%)` }}
      >
        {tickets.map((t) => (
          <div key={t.ticketNumber} className="w-1/2 flex-shrink-0 px-2">
            <ActiveRepairCard ticket={t} className="w-full" />
          </div>
        ))}
      </div>

      {tickets.length > 2 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-1 hover:bg-gray-100 z-10 transition-opacity"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full shadow p-1 hover:bg-gray-100 z-10 transition-opacity"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default ActiveRepairsCarousel;
