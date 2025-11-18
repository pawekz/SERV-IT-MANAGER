import React, { useEffect, useState } from 'react';
import api from '../../config/ApiConfig';
import { X, Download, Calendar, Monitor, User, Tag, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

// statusStyles helper placed before usage
const statusStyles = (statusRaw) => {
    const s = (statusRaw || '').toUpperCase();
    const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border';
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

function TicketImage({ path, alt, className }) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let url;
        if (path) {
            fetchPresignedPhotoUrl(path)
                .then(presignedUrl => {
                    url = presignedUrl;
                    setSrc(presignedUrl);
                })
                .catch(err => {
                    console.error('[TicketDetailsModal] Error loading presigned image:', err);
                });
        }
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [path]);
    if (!src) {
        return <div className={className + ' bg-gray-100 flex items-center justify-center'}>Loading...</div>;
    }
    return <img src={src} alt={alt} className={className} />;
}

async function fetchPresignedPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    const res = await api.get(`/repairTicket/getRepairPhotos`, { params: { photoUrl } });
    return res.data;
}

function TicketDetailsModal({ data: ticket, onClose, isOpen }) {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);
    const [downloading, setDownloading] = useState(false);
    // Description expansion state for the Ticket Information description block
    const [descExpanded, setDescExpanded] = useState(false);

    // Reset expanded state whenever a new ticket is shown or modal opens
    useEffect(() => {
        setDescExpanded(false);
    }, [ticket?.ticketNumber, isOpen]);

    if (!isOpen || !ticket) return null;

    const images = ticket.repairPhotosUrls || [];
    const statusVal = ticket.status || ticket.repairStatus || 'N/A';
    // Use only new first/last fields (legacy customerName removed)
    const first = ticket.customerFirstName || '';
    const last = ticket.customerLastName || '';
    // Technician name (fall back to a few common ticket properties)
    const techName = ticket.technicianName || ticket.assignedTechnician || ticket.technician || '';

    // Description: primary is reported_issue (or reportedIssue), then fallback to other common fields
    const description = (ticket.reported_issue || ticket.reportedIssue || ticket.description || ticket.problemDescription || ticket.repairNotes || ticket.issueDescription || '').trim();
    // If description is long we show truncated view by default and allow expansion
    const needsToggle = description && description.length > 240;

    const openImageModal = idx => { setCurrentImageIdx(idx); setImageModalOpen(true); };
    const closeImageModal = () => setImageModalOpen(false);
    const goLeft = e => { e.stopPropagation(); setCurrentImageIdx(prev => (prev === 0 ? images.length - 1 : prev - 1)); };
    const goRight = e => { e.stopPropagation(); setCurrentImageIdx(prev => (prev === images.length - 1 ? 0 : prev + 1)); };

    // Download PDF handler
    const handleDownloadPdf = async () => {
        setDownloading(true);
        try {
            const res = await api.get(`/repairTicket/getRepairTicketDocument/${ticket.ticketNumber}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${ticket.ticketNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (err) {
            window.dispatchEvent(new CustomEvent('showSnackbar', { detail: { message: 'Failed to download PDF.', severity: 'error' } }));
        } finally { setDownloading(false); }
    };

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-start justify-center px-4 py-10 sm:py-16 overflow-y-auto backdrop-blur-sm bg-black/40" role="dialog" aria-modal="true">
                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-[fadeIn_.25s_ease]">
                    {/* Header */}
                    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-semibold tracking-tight text-gray-900">Ticket #{ticket.ticketNumber}</h2>
                                <span className={statusStyles(statusVal)}>{statusVal}</span>
                            </div>
                            <p className="text-xs text-gray-500">Detailed repair ticket overview</p>
                        </div>
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={onClose}
                            aria-label="Close details"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6 pt-2 grid lg:grid-cols-3 gap-8">
                        {/* Left: Primary info */}
                        <div className="lg:col-span-2 space-y-6">
                            <section className="rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><Tag size={14} className="text-gray-400"/> Ticket Information</h3>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
                                    <div>
                                        <dt className="text-gray-500">First Name</dt>
                                        <dd className="font-medium text-gray-800">{first || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Last Name</dt>
                                        <dd className="font-medium text-gray-800">{last || '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Assigned Technician</dt>
                                        <dd className="font-medium text-gray-800">{techName || 'Unassigned'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500 flex items-center gap-1"><Calendar size={12}/> Check-In Date</dt>
                                        <dd className="font-medium text-gray-800">{ticket.checkInDate || '—'}</dd>
                                    </div>
                                    {/* Description field: truncated by default, expandable */}
                                    <div className="sm:col-span-2">
                                        <dt className="text-gray-500">Reported Issue</dt>
                                        <dd className="font-medium text-gray-800">
                                            {description ? (
                                                <div className="relative">
                                                    {/* clickable header/field that toggles expansion; keyboard accessible */}
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => needsToggle && setDescExpanded(prev => !prev)}
                                                        onKeyDown={(e) => { if (needsToggle && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setDescExpanded(prev => !prev); } }}
                                                        aria-expanded={descExpanded}
                                                        className={`flex items-start justify-between gap-3 ${needsToggle ? 'cursor-pointer' : ''}`}
                                                    >
                                                        <div
                                                            className="text-[13px] text-gray-800 flex-1"
                                                            style={{
                                                                maxHeight: descExpanded ? '480px' : '72px',
                                                                overflow: 'hidden',
                                                                transition: 'max-height 260ms ease',
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word'
                                                            }}
                                                            aria-live="polite"
                                                        >
                                                            {description}
                                                        </div>
                                                        {needsToggle && (
                                                            <ChevronDown size={16} className={`shrink-0 mt-1 text-gray-500 transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
                                                        )}
                                                    </div>
                                                    {/* gradient overlay when collapsed to hint there's more */}
                                                    {!descExpanded && needsToggle && (
                                                        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-white/90 to-transparent" />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-[13px]">—</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-gray-500 flex items-center gap-1"><Monitor size={12}/> Device</dt>
                                        <dd className="font-medium text-gray-800">{ticket.deviceBrand} {ticket.deviceModel}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><User size={14} className="text-gray-400"/> Repair Photos</h3>
                                    {images.length > 0 && (
                                        <span className="text-[11px] text-gray-500">{images.length} photo{images.length>1?'s':''}</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {images.length > 0 ? images.map((url, idx) => (
                                        <button key={idx} type="button" onClick={() => openImageModal(idx)} className="group relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D482]/40">
                                            <TicketImageThumb path={url} alt={`Repair Photo ${idx+1}`} />
                                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>
                                        </button>
                                    )) : (
                                        <span className="text-xs text-gray-400">No photos</span>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right: Summary / Quick actions */}
                        <aside className="space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Summary</h4>
                                <ul className="text-[13px] space-y-2 text-gray-600">
                                    <li className="flex justify-between"><span>Ticket #</span><span className="font-medium text-gray-900">{ticket.ticketNumber}</span></li>
                                    <li className="flex justify-between"><span>Status</span><span className="font-medium text-gray-900">{statusVal}</span></li>
                                    <li className="flex justify-between"><span>Photos</span><span className="font-medium text-gray-900">{images.length}</span></li>
                                </ul>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Actions</h4>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleDownloadPdf}
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60"
                                        disabled={downloading}
                                    >
                                        <Download size={14}/> {downloading ? 'Downloading...' : 'Download PDF'}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    >Close</button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Image Modal Overlay */}
            {imageModalOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={closeImageModal} role="dialog" aria-modal="true">
                    <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                            onClick={closeImageModal}
                            aria-label="Close image viewer"
                        >
                            <X size={20} />
                        </button>
                        <div className="relative flex items-center justify-center">
                            <TicketImage
                                path={images[currentImageIdx]}
                                alt={`Repair Photo ${currentImageIdx + 1}`}
                                className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={goLeft}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={goRight}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                                        {images.map((_, idx) => (
                                            <span
                                                key={idx}
                                                className={`inline-block w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${idx === currentImageIdx ? 'bg-white scale-125' : 'bg-gray-400/70 hover:bg-gray-300/80'}`}
                                                onClick={e => { e.stopPropagation(); setCurrentImageIdx(idx); }}
                                                aria-label={`Go to image ${idx + 1}`}
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
}

// Lightweight thumbnail component using existing fetch
const TicketImageThumb = ({ path, alt }) => {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(!!path);
    useEffect(() => {
        let urlRef;
        if (path) {
            fetchPresignedPhotoUrl(path)
                .then(presignedUrl => { urlRef = presignedUrl; setSrc(presignedUrl); })
                .catch(() => setSrc(null))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
        return () => { if (urlRef) URL.revokeObjectURL(urlRef); };
    }, [path]);

    if (loading) return <div className="w-full h-full bg-gray-100 animate-pulse" />;
    if (!src) return <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">No Image</div>;
    return <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />;
};

export default TicketDetailsModal
