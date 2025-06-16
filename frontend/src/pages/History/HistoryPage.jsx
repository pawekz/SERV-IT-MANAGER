import React, { useState, useEffect } from 'react';
import TicketCard from '../../components/TicketCard/TicketCard';
import TicketDetailsModal from '../../components/TicketDetailsModal/TicketDetailsModal';
import Sidebar from '../../components/SideBar/Sidebar';
import api from '../../services/api';

function parseTypeAndFilename(path) {
  if (!path) return { type: '', filename: '' };
  const match = path.replace(/\\/g, '/').match(/(images|documents)\/([^\/]+)\/([^\/]+)$/);
  if (!match) return { type: '', filename: '' };
  return { type: `${match[1]}/${match[2]}`, filename: match[3] };
}

async function fetchTicketFile(type, filename) {
  if (!type || !filename) return null;
  const res = await api.get(`/repairTicket/files/${type}/${filename}`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
}

function TicketImage({ path, alt, className }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let url;
    const { type, filename } = parseTypeAndFilename(path);
    if (type && filename) {
      fetchTicketFile(type, filename).then(objUrl => {
        url = objUrl;
        setSrc(objUrl);
      });
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [path]);
  if (!src) return <div className={className + ' bg-gray-100 flex items-center justify-center'}>Loading...</div>;
  return <img src={src} alt={alt} className={className} />;
}

const HistoryPage = () => {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/repairTicket/getAllRepairTickets');
        setTickets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Filter tickets by search (simple filter)
  const filteredTickets = tickets.filter(ticket =>
    ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    ticket.customerName.toLowerCase().includes(search.toLowerCase()) ||
    ticket.customerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen font-['Poppins',sans-serif]">
      <Sidebar activePage="history" />
      
      {/* Main Content */}
      <div className="flex-1 p-8 ml-[250px] bg-gray-50">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">Repair Ticket History</h1>
          <p className="text-gray-600 text-base max-w-3xl">
            View and manage all repair ticket records. Search through past repairs and access detailed information about each service request.
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Search by Ticket Number, Name, Email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgba(51,228,7,0.1)] focus:border-[#33e407]"
          />
          <button className="px-4 py-2 bg-[#33e407] text-white rounded-md hover:bg-[#2bc406] transition-colors">
            Search
          </button>
        </div>

        {loading && (
          <div className="text-center text-gray-500 py-16">Loading tickets...</div>
        )}
        {error && (
          <div className="text-center text-red-500 py-16">{error}</div>
        )}
        {!loading && !error && filteredTickets.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            No repair records found.<br />Suggestions: Check spelling, try fewer keywords.
          </div>
        )}
        {!loading && !error && filteredTickets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.ticketNumber} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
            ))}
          </div>
        )}
        {selectedTicket && (
          <TicketDetailsModal 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default HistoryPage; 