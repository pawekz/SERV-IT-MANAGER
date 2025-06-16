import React, { useEffect, useState } from 'react';
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
    console.log('[TicketDetailsModal] TicketImage path:', path, 'type:', type, 'filename:', filename);
    if (type && filename) {
      fetchTicketFile(type, filename)
        .then(objUrl => {
          url = objUrl;
          setSrc(objUrl);
          console.log('[TicketDetailsModal] Image loaded:', objUrl);
        })
        .catch(err => {
          console.error('[TicketDetailsModal] Error loading image:', err);
        });
    } else {
      console.warn('[TicketDetailsModal] Invalid type or filename for path:', path);
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [path]);
  if (!src) {
    console.warn('[TicketDetailsModal] Image not rendered for path:', path);
    return <div className={className + ' bg-gray-100 flex items-center justify-center'}>Loading...</div>;
  }
  return <img src={src} alt={alt} className={className} />;
}

function TicketDocumentLink({ path, children }) {
  const [href, setHref] = useState(null);
  useEffect(() => {
    let url;
    const { type, filename } = parseTypeAndFilename(path);
    if (type && filename) {
      fetchTicketFile(type, filename).then(objUrl => {
        url = objUrl;
        setHref(objUrl);
      });
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [path]);
  if (!href) return <span>Loading...</span>;
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

const TicketDetailsModal = ({ ticket, onClose }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  if (!ticket) return null;

  const images = ticket.repairPhotosUrls || [];

  const openImageModal = idx => {
    setCurrentImageIdx(idx);
    setImageModalOpen(true);
  };
  const closeImageModal = () => setImageModalOpen(false);
  const goLeft = e => {
    e.stopPropagation();
    setCurrentImageIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const goRight = e => {
    e.stopPropagation();
    setCurrentImageIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4">Ticket #{ticket.ticketNumber} Details</h2>
          <div className="mb-4">
            <strong>Status:</strong> {ticket.status}<br />
            <strong>Customer:</strong> {ticket.customerName}<br />
            <strong>Date:</strong> {ticket.checkInDate}<br />
            <strong>Device:</strong> {ticket.deviceBrand} {ticket.deviceModel}<br />
          </div>
          <div className="mb-4">
            <strong>Repair Photos:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {images.length > 0 ? images.map((url, idx) => (
                <div key={idx} className="cursor-pointer" onClick={() => openImageModal(idx)}>
                  <TicketImage
                    path={url}
                    alt={`Repair Photo ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded border"
                  />
                </div>
              )) : (
                <span className="text-gray-400">No photos</span>
              )}
            </div>
          </div>
          <div className="mb-4">
            <strong>Documents:</strong>
            <ul className="list-disc ml-6 mt-2">
              {(ticket.documentUrls || []).map((url, idx) => (
                <li key={idx}>
                  <TicketDocumentLink path={url}>
                    {url.split(/[\\/]/).pop()}
                  </TicketDocumentLink>
                </li>
              ))}
              {(!ticket.documentUrls || ticket.documentUrls.length === 0) && (
                <li className="text-gray-400">No documents</li>
              )}
            </ul>
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      {/* Image Modal - increased z-index to be above the ticket details modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-[90vw] max-h-[90vh] bg-black rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-2xl text-white hover:text-gray-300 z-10"
              onClick={closeImageModal}
            >
              &times;
            </button>
            <div className="relative flex items-center justify-center">
              <TicketImage
                path={images[currentImageIdx]}
                alt={`Repair Photo ${currentImageIdx + 1}`}
                className="max-w-[90vw] max-h-[85vh] object-contain"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={goLeft}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                    style={{ outline: 'none' }}
                    aria-label="Previous image"
                  >
                    <span style={{ fontSize: 24 }}>&#8592;</span>
                  </button>
                  <button
                    onClick={goRight}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                    style={{ outline: 'none' }}
                    aria-label="Next image"
                  >
                    <span style={{ fontSize: 24 }}>&#8594;</span>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-full">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`inline-block w-3 h-3 rounded-full cursor-pointer transition-all ${
                          idx === currentImageIdx 
                            ? 'bg-white scale-125' 
                            : 'bg-gray-400 hover:bg-gray-300'
                        }`}
                        onClick={e => {
                          e.stopPropagation();
                          setCurrentImageIdx(idx);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketDetailsModal; 