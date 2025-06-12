import React from "react";
import Spinner from "../Spinner/Spinner.jsx";

const LoadingModal = ({
                          show = false,
                          title = "Processing",
                          message = "Please wait while we process your request...",
                      }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-xl text-center">
                <div className="flex flex-col items-center">
                    <Spinner size="large" />
                    <h3 className="text-lg font-medium text-gray-800 mt-4">{title}</h3>
                    <p className="text-sm text-gray-600 mt-2">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default LoadingModal;