import React, { useState, useEffect } from 'react';
import TicketCard from '../../components/TicketCard/TicketCard';
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Repair Ticket History</h1>
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by Ticket Number, Name, Email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800">Search</button>
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
      {/* Modal for ticket details */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedTicket(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Ticket {selectedTicket.ticketNumber} Details</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {selectedTicket.status}</p>
              <p><strong>Customer:</strong> {selectedTicket.customerName}</p>
              <p><strong>Date:</strong> {selectedTicket.checkInDate}</p>
              <p><strong>Device:</strong> {selectedTicket.deviceBrand} {selectedTicket.deviceModel}</p>
              <p><strong>Diagnostics:</strong> {selectedTicket.reportedIssue}</p>
              <p><strong>Technician:</strong> {selectedTicket.technicianName}</p>
              <p><strong>Accessories:</strong> {selectedTicket.accessories}</p>
              <p><strong>Observations:</strong> {selectedTicket.observations}</p>
              <div>
                <strong>Completion Photos:</strong>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedTicket.repairPhotosUrls && selectedTicket.repairPhotosUrls.map((url, idx) => (
                    <TicketImage key={idx} path={url} alt={`Photo ${idx + 1}`} className="w-24 h-16 object-cover rounded" />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <strong>Digital Signature:</strong><br />
                <TicketImage path={selectedTicket.digitalSignatureImageUrl} alt="Digital Signature" className="w-32 h-10 object-contain mt-2 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage; 