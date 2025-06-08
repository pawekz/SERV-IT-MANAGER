import React, { useEffect, useState } from "react";

const Toast = ({ show, message, type = "success", onClose, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true); // Fade in
            const hideTimer = setTimeout(() => setVisible(false), duration);
            const closeTimer = setTimeout(() => onClose && onClose(), duration + 300); // 300ms for fade-out
            return () => {
                clearTimeout(hideTimer);
                clearTimeout(closeTimer);
            };
        }
    }, [show, duration, onClose]);

    if (!show) return null;

    const color = type === "error" ? "bg-red-700" : "bg-green-700";
    const icon = type === "error" ? (
        <svg className="h-5 w-5 text-red-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4h2v2h-2v-2zm0-8h2v6h-2V6z" clipRule="evenodd" />
        </svg>
    ) : (
        <svg className="h-5 w-5 text-green-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );

    return (
        <div
            className={`fixed bottom-5 right-5 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg text-white ${color} 
                transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        >
            {icon}
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 focus:outline-none">&times;</button>
        </div>
    );
};

export default Toast;