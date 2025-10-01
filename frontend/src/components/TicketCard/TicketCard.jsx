import React, { useState, useEffect } from 'react';
import api from '../../config/ApiConfig';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Fetch a pre-signed S3 URL for a repair photo
async function fetchPresignedPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    const res = await api.get(`/repairTicket/getRepairPhotos`, { params: { photoUrl } });
    return res.data;
}

function TicketImage({ path, alt }) {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(!!path);
    useEffect(() => {
        let url;
        if (path) {
            fetchPresignedPhotoUrl(path)
                .then(presignedUrl => {
                    url = presignedUrl;
                    setSrc(presignedUrl);
                })
                .catch(() => {
                    setSrc(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [path]);
    if (loading) {
        return <div className="w-full h-40 md:h-44 bg-gray-100 animate-pulse rounded-t-lg" />;
    }
    if (!src) {
        return (
            <div className="w-full h-40 md:h-44 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded-t-lg">
                No Image
            </div>
        );
    }
    return <img className="rounded-t-lg w-full h-40 md:h-44 object-cover" src={src} alt={alt || 'Repair photo'} loading="lazy" />;
}

// Status chip styling helper
const statusStyles = (statusRaw) => {
    const s = (statusRaw || '').toUpperCase();
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border';
    const map = {
        COMPLETED: `${base} bg-emerald-50 text-emerald-700 border-emerald-200`,
        COMPLETE: `${base} bg-emerald-50 text-emerald-700 border-emerald-200`,
        IN_PROGRESS: `${base} bg-amber-50 text-amber-700 border-amber-200`,
        PROCESSING: `${base} bg-amber-50 text-amber-700 border-amber-200`,
        PENDING: `${base} bg-gray-50 text-gray-600 border-gray-200`,
        AWAITING_PARTS: `${base} bg-gray-50 text-gray-600 border-gray-200`,
        CANCELLED: `${base} bg-red-50 text-red-600 border-red-200`,
        CANCELED: `${base} bg-red-50 text-red-600 border-red-200`,
        FAILED: `${base} bg-red-50 text-red-600 border-red-200`,
    };
    return map[s] || `${base} bg-gray-50 text-gray-600 border-gray-200`;
};

const TicketCard = ({ ticket, onClick }) => {
    // derive unified status (backend uses repairStatus)
    const displayStatus = ticket.status || ticket.repairStatus || 'N/A';

    const images = ticket.repairPhotosUrls && ticket.repairPhotosUrls.length > 0
        ? ticket.repairPhotosUrls
        : [null];
    const [current, setCurrent] = useState(0);

    const goLeft = (e) => {
        e.stopPropagation();
        setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };
    const goRight = (e) => {
        e.stopPropagation();
        setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const first = ticket.customerFirstName || '';
    const last = ticket.customerLastName || '';
    const displayFull = [first, last].filter(Boolean).join(' ') || '—';

    return (
        <div
            className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
            aria-label={`Open details for ticket ${ticket.ticketNumber}`}
        >
            <div className="relative">
                <TicketImage path={images[current]} alt={`Ticket ${ticket.ticketNumber} image ${current + 1}`} />
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goLeft}
                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm p-1.5 rounded-full border border-gray-200 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={goRight}
                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm p-1.5 rounded-full border border-gray-200 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Next image"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {images.map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-[#25D482] scale-110' : 'bg-gray-300 hover:bg-gray-400'}`}
                                    onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                                    aria-label={`Show image ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
                <div className="absolute top-2 left-2">
                    <span className={statusStyles(displayStatus)}>{displayStatus}</span>
                </div>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                        Ticket <span className="font-bold">#{ticket.ticketNumber}</span>
                    </h3>
                </div>
                <div className="space-y-1.5 text-[13px] text-gray-600">
                    <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800 truncate max-w-[55%] text-right">{displayFull || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Device</span><span className="font-medium text-gray-800 truncate max-w-[55%] text-right">{ticket.deviceBrand} {ticket.deviceModel}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Check-In</span><span className="font-medium text-gray-800 text-right">{ticket.checkInDate || '—'}</span></div>
                </div>
                <div className="pt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400/40 focus:outline-none rounded-lg transition-colors"
                    >
                        More Info
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
