import React, { useState, useEffect } from 'react';
import api from '../../config/ApiConfig';

function parseTypeAndFilename(path) {
    if (!path) return { type: '', filename: '' };
    // Match images/repair_photos/filename.png or similar
    const match = path.replace(/\\/g, '/').match(/(images|documents)\/([^\/]+)\/([^\/]+)$/);
    if (!match) return { type: '', filename: '' };
    return { type: `${match[1]}/${match[2]}`, filename: match[3] };
}
// Fetch a pre-signed S3 URL for a repair photo
async function fetchPresignedPhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    const res = await api.get(`/repairTicket/getRepairPhotos`, { params: { photoUrl } });
    return res.data;
}

function TicketImage({ path, alt }) {
    const [src, setSrc] = useState(null);
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
                });
        }
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [path]);
    if (!src) {
        return <div className="w-full h-48 bg-gray-100 flex items-center justify-center">Loading...</div>;
    }
    return <img className="rounded-t-lg w-full h-48 object-cover" src={src} alt={alt} />;
}

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

    return (
        <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 mb-4">
            <div className="relative w-full h-48">
                <TicketImage path={images[current]} alt="Repair" />
                {/* Removed static S3 image, now only dynamic */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goLeft}
                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-transparent border-none p-2 cursor-pointer"
                            style={{ outline: 'none' }}
                            aria-label="Previous image"
                        >
                            <span style={{ fontSize: 24, color: 'rgba(0,0,0,0.3)' }}>&#8592;</span>
                        </button>
                        <button
                            onClick={goRight}
                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-transparent border-none p-2 cursor-pointer"
                            style={{ outline: 'none' }}
                            aria-label="Next image"
                        >
                            <span style={{ fontSize: 24, color: 'rgba(0,0,0,0.3)' }}>&#8594;</span>
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {images.map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`inline-block w-2 h-2 rounded-full ${idx === current ? 'bg-blue-600' : 'bg-gray-300'}`}
                                    style={{ transition: 'background 0.2s', cursor: 'pointer' }}
                                    onClick={e => { e.stopPropagation(); setCurrent(idx); }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
            <div className="p-5">
                <a href="#" onClick={e => { e.preventDefault(); onClick(); }}>
                    <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Ticket #{ticket.ticketNumber}
                    </h5>
                </a>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    <span className="block"><strong>Status:</strong> {displayStatus}</span>
                    <span className="block"><strong>Customer:</strong> {ticket.customerName}</span>
                    <span className="block"><strong>Date:</strong> {ticket.checkInDate}</span>
                    <span className="block"><strong>Device:</strong> {ticket.deviceBrand} {ticket.deviceModel}</span>
                </p>
                <button
                    onClick={onClick}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    More Info
                    <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default TicketCard;
