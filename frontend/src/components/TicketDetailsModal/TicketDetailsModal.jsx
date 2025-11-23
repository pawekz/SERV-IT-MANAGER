import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { parseJwt } from '../../config/ApiConfig';
import { X, Download, Calendar, Monitor, User, Tag, ChevronLeft, ChevronRight, MessageSquare, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRepairPhoto, prefetchRepairPhoto } from '../../hooks/useRepairPhoto';

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

function TicketImage({ path, alt, className }) {
    const { data: src, isLoading } = useRepairPhoto(path);
    if (isLoading) {
        return <div className={className + ' bg-gray-100 flex items-center justify-center'}>Loading...</div>;
    }
    if (!src) {
        return (
            <div className={className + ' bg-gray-100 flex items-center justify-center'} aria-hidden>
                <Camera size={48} className="text-gray-300" />
            </div>
        );
    }
    return <img src={src} alt={alt} className={className} />;
}

function TicketDetailsModal({ data: ticket, onClose, isOpen }) {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [hasFeedback, setHasFeedback] = useState(false);
    const [checkingFeedback, setCheckingFeedback] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [issueExpanded, setIssueExpanded] = useState(false);
    // Remove char-count style truncation constant; we will measure lines instead
    // const ISSUE_PREVIEW_CHARS = 180; // number of characters to show before truncating
    const navigate = useNavigate();

    // new refs and state for measuring and transitions
    const issueRef = useRef(null);
    const [twoLineHeight, setTwoLineHeight] = useState(0);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const statusVal = ticket?.status || ticket?.repairStatus || 'N/A';
    const ticketId = ticket?.repairTicketId || ticket?.id;
    const images = useMemo(() => ticket?.repairPhotosUrls || [], [ticket?.repairPhotosUrls]);
    const queryClient = useQueryClient();

    // Reset issue expansion when the ticket changes
    useEffect(() => {
        setIssueExpanded(false);
    }, [ticket?.repairTicketId || ticket?.id || ticket?.ticketNumber]);

    // Measure two-line height and detect overflow whenever the reportedIssue changes or when modal opens
    useEffect(() => {
        if (!issueRef.current) return;
        const el = issueRef.current;
        // Compute line height from computed styles
        const computed = window.getComputedStyle(el);
        let lineHeight = parseFloat(computed.lineHeight);
        if (Number.isNaN(lineHeight) || lineHeight === 0) {
            // fallback to font-size * 1.2 if line-height is 'normal'
            const fontSize = parseFloat(computed.fontSize) || 13;
            lineHeight = Math.round(fontSize * 1.2);
        }
        const twoH = lineHeight * 2;
        setTwoLineHeight(twoH);
        // scrollHeight reports full content height regardless of maxHeight, so good for detecting overflow
        setIsOverflowing(el.scrollHeight > twoH + 1);
    }, [ticket?.reportedIssue, isOpen]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const payload = parseJwt(token);
            if (payload && payload.role) {
                setUserRole(payload.role);
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && ticket && (statusVal === 'COMPLETED' || statusVal === 'COMPLETE')) {
            setCheckingFeedback(true);
            // Check if feedback exists
            api.get(`/feedback/check/${ticketId}`)
                .then(res => {
                    // Explicitly convert to boolean - if res.data is truthy, feedback exists
                    setHasFeedback(Boolean(res.data));
                })
                .catch(err => {
                    console.error('Error checking feedback:', err);
                    // On error, assume no feedback exists so button can show
                    setHasFeedback(false);
                })
                .finally(() => {
                    setCheckingFeedback(false);
                });
        } else {
            // For non-completed tickets, reset feedback state
            setHasFeedback(false);
            setCheckingFeedback(false);
        }
    }, [isOpen, ticket, statusVal, ticketId]);

    useEffect(() => {
        if (!isOpen || !images.length) return;
        images.forEach((url) => {
            prefetchRepairPhoto(queryClient, url);
        });
    }, [images, isOpen, queryClient]);

    if (!isOpen || !ticket) return null;

    // Use only new first/last fields (legacy customerName removed)
    const first = ticket.customerFirstName || '';
    const last = ticket.customerLastName || '';
    // Technician name (fall back to a few common ticket properties)
    const techName = ticket.technicianName || ticket.assignedTechnician || ticket.technician || '';

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
                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-xl font-semibold tracking-tight text-gray-900">Ticket #{ticket.ticketNumber}</h2>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusChipClasses(statusVal)}`}>{statusVal}</span>
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
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><Tag size={14} className="text-gray-400" /> Ticket Information</h3>
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
                                        <dt className="text-gray-500 flex items-center gap-1"><Calendar size={12} /> Check-In Date</dt>
                                        <dd className="font-medium text-gray-800">{ticket.checkInDate || '—'}</dd>
                                    </div>
                                    {/* Reported Issue: truncated by default with expand/collapse */}
                                    <div className="sm:col-span-2 relative">
                                        <dt className="text-gray-500">Reported Issue</dt>
                                        <dd className="font-medium text-gray-800 relative">
                                            {ticket.reportedIssue ? (
                                                <div className="relative">
                                                    {/* The content wrapper - animate max-height for smooth expand/collapse */}
                                                    <div
                                                        ref={issueRef}
                                                        className="text-[13px] text-gray-800 break-words whitespace-pre-wrap overflow-hidden pr-8"
                                                        style={{ maxHeight: issueExpanded ? undefined : `${twoLineHeight}px` }}
                                                        aria-expanded={issueExpanded}
                                                    >
                                                        {ticket.reportedIssue}
                                                    </div>

                                                    {/* Fade overlay shown when collapsed and overflowing */}
                                                    {isOverflowing && !issueExpanded && (
                                                        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-white/95 to-transparent" />
                                                    )}

                                                    {/* Toggle button aligned to right of the text */}
                                                    {isOverflowing && (
                                                        <button
                                                            type="button"
                                                            aria-label={issueExpanded ? 'Collapse reported issue' : 'Expand reported issue'}
                                                            onClick={() => setIssueExpanded(prev => !prev)}
                                                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
                                                        >
                                                            {issueExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-gray-500 flex items-center gap-1"><Monitor size={12} /> Device</dt>
                                        <dd className="font-medium text-gray-800">{ticket.deviceBrand} {ticket.deviceModel}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section className="rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><User size={14} className="text-gray-400" /> Repair Photos</h3>
                                    {images.length > 0 && (
                                        <span className="text-[11px] text-gray-500">{images.length} photo{images.length > 1 ? 's' : ''}</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {images.length > 0 ? images.map((url, idx) => (
                                        <button key={idx} type="button" onClick={() => openImageModal(idx)} className="group relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#25D482]/40">
                                            <TicketImageThumb path={url} alt={`Repair Photo ${idx + 1}`} />
                                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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
                                    {/* Show Give Feedback button only for customers when ticket is completed and no feedback exists */}
                                    {(statusVal === 'COMPLETED' || statusVal === 'COMPLETE') && 
                                     hasFeedback === false && 
                                     checkingFeedback === false && 
                                     userRole && 
                                     userRole.toUpperCase() === 'CUSTOMER' && (
                                        <button
                                            onClick={() => navigate(`/feedbackform/${ticket.repairTicketId || ticket.id}`)}
                                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                        >
                                            <MessageSquare size={14} /> Give Feedback
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDownloadPdf}
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60"
                                        disabled={downloading}
                                    >
                                        <Download size={14} /> {downloading ? 'Downloading...' : 'Download PDF'}
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
    const { data: src, isLoading } = useRepairPhoto(path);

    if (isLoading) return <div className="w-full h-full bg-gray-100 animate-pulse" />;
    if (!src) return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center" aria-hidden>
            <Camera size={20} className="text-gray-300" />
        </div>
    );
    return <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />;
}

export default TicketDetailsModal;
