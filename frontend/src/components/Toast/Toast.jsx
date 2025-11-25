import React, { useEffect, useState } from "react";

const Toast = ({ show, message, type = "success", onClose, duration = 3000 }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true); // Fade in
            // Don't auto-hide loading toasts (duration = 0)
            if (duration > 0) {
                const hideTimer = setTimeout(() => setVisible(false), duration);
                const closeTimer = setTimeout(() => {
                    if (onClose) onClose();
                }, duration + 300); // 300ms for fade-out
                return () => {
                    clearTimeout(hideTimer);
                    clearTimeout(closeTimer);
                };
            }
        } else {
            setVisible(false);
        }
    }, [show, duration]); // Removed onClose from dependencies to prevent infinite loops

    if (!show) return null;

    const getColorAndIcon = () => {
        switch (type) {
            case "error":
                return {
                    color: "bg-red-700",
                    icon: (
                        <svg className="h-5 w-5 text-red-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4h2v2h-2v-2zm0-8h2v6h-2V6z" clipRule="evenodd" />
                        </svg>
                    )
                };
            case "loading":
                return {
                    color: "bg-blue-700",
                    icon: (
                        <svg className="h-5 w-5 text-blue-300 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )
                };
            default:
                return {
                    color: "bg-green-700",
                    icon: (
                        <svg className="h-5 w-5 text-green-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )
                };
        }
    };

    const { color, icon } = getColorAndIcon();

    return (
        <div
            className={`fixed bottom-5 right-5 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg text-white ${color} 
                transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        >
            {icon}
            <span>{message}</span>
            {type !== "loading" && (
                <button onClick={onClose} className="ml-4 text-white hover:text-gray-200 focus:outline-none">&times;</button>
            )}
        </div>
    );
};

export default Toast;