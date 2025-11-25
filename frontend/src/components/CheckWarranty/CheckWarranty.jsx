import React, {useEffect, useState} from "react";
import RequestReturn from "../RequestReturn/RequestReturn.jsx";
import {X} from "lucide-react";
import api from '../../config/ApiConfig';

const CheckWarranty = ({ isOpen, onClose, onSuccess }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [openReturnRequest, setOpenReturnRequest] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResult(null);
            setResultModalOpen(false);
            setError(null);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Please enter a Serial Number or Ticket ID');
            return;
        }

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await api.get(`/warranty/check/${query}`);
            const warrantyData = response.data;
            console.log('Warranty Data:', warrantyData);
            setResult(warrantyData);
            setResultModalOpen(true);
        } catch (error) {
            console.error('Warranty check failed:', error);
            setResult({ withinWarranty: false, message: "Warranty check failed or serial number not found." });
            setResultModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Warranty Status Checker Modal */}
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md transform transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">Warranty Status Checker</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="warranty-query" className="block text-sm font-medium text-gray-700 mb-2">
                            Serial Number or Ticket ID
                        </label>
                        <input
                            id="warranty-query"
                            type="text"
                            placeholder="Enter Serial Number or Ticket ID"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    handleSearch();
                                }
                            }}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#10B981] ${
                                error ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-500">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-4 py-2 bg-[#10B981] hover:bg-[#0f9f6e] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Checking...' : 'Check Warranty'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            {resultModalOpen && result && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-full max-w-md transform scale-100 transition duration-300">
                        {result.withinWarranty ? (
                            <>
                                <h3 className="text-lg font-bold text-green-600 mb-2">Device: {result.deviceName} - {result.brand} {result.model}</h3>
                                <p>Serial Number: {result.serialNumber}</p>
                                <p>{result.daysLeft} days left.</p>
                                <button
                                    onClick={() => {
                                        setOpenReturnRequest(true);
                                        setResultModalOpen(false);
                                    }}
                                    className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 mr-5 mt-5"
                                >
                                    Make Return Request
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-red-600 mb-2">Sorry...</h3>
                                <p>{result.message}</p>
                            </>
                        )}
                        <button
                            onClick={() => {
                                setResultModalOpen(false);
                                onClose();
                            }}
                            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 mt-5"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <RequestReturn 
                isOpen={openReturnRequest} 
                onClose={() => setOpenReturnRequest(false)} 
                serialNumber={query} 
                onSuccess={onSuccess}
            />
        </>
    );
};

export default CheckWarranty;
