import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRepairPhoto } from '../../hooks/useRepairPhoto';

const statusChipClasses = (statusRaw) => {
    const status = (statusRaw || '').toString().trim().toUpperCase();
    const map = {
        RECEIVED: 'bg-gray-100 text-[#6B7280] border-gray-300',
        DIAGNOSING: 'bg-[#E0ECFF] text-[#3B82F6] border-[#BFD4FF]',
        AWAITING_PARTS: 'bg-[#FFF4D6] text-[#B45309] border-[#FCD34D]',
        REPAIRING: 'bg-[#FFE7D6] text-[#C2410C] border-[#FDBA74]',
        READY_FOR_PICKUP: 'bg-[#D9F3F0] text-[#0F766E] border-[#99E0D8]',
        COMPLETED: 'bg-[#E2F7E7] text-[#15803D] border-[#A7E3B9]',
    };
    return map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
};

function TicketImage({ path, alt }) {
    const { data: src, isLoading } = useRepairPhoto(path);

    if (isLoading) {
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

const TicketCard = ({ ticket, onClick, renderStatusControl, actionButtons, customerAction }) => {
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
            className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-visible"
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusChipClasses(displayStatus)}`}>{displayStatus}</span>
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
                    {/* Render a custom status control if provided by the parent page (eg. a gray button + dropdown). */}
                    {renderStatusControl && (
                        <div className="mb-2">
                            {renderStatusControl(ticket)}
                        </div>
                    )}

                    {/* Action buttons (Build Quotation, View Quotation, etc.) */}
                    {actionButtons && (
                        <div className="mb-2 flex flex-col gap-2">
                            {actionButtons}
                        </div>
                    )}

                    {/* Customer action button (Approve Quotation, etc.) */}
                    {customerAction && (
                        <div className="mb-2">
                            {customerAction}
                        </div>
                    )}

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
