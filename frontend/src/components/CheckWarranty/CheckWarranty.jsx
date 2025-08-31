import React, {useEffect, useState} from "react";
import RequestReturn from "../RequestReturn/RequestReturn.jsx";
import WarrantyRequest from "../WarrantyRequest/WarrantyRequest.jsx";
import {Archive, Computer, Headphones, TabletSmartphone} from "lucide-react";
import axios from "axios";

const CheckWarranty = ({ onSuccess }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [openReturnRequest, setOpenReturnRequest] = useState(false);
    const [error, setError] = useState(null);

    const generateWarrantyNumber = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Not authenticated. Please log in.");

            const response = await fetch(`${window.__API_BASE__}/warranty/generateWarrantyNumber`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Failed to generate warranty number: ${response.status}`);

            return await response.text();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Not authenticated. Please log in.");
            console.log(token)

            const response = await fetch(`${window.__API_BASE__}/warranty/check/${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Warranty check failed.');
            }

            const warrantyData = await response.json();
            console.log('Warranty Data:', warrantyData);
            setResult(warrantyData);
            setModalOpen(true);

        } catch (error) {
            console.error('Warranty check failed:', error);
            setResult({ withinWarranty: false, message: "Warranty check failed or serial number not found." });
            setModalOpen(true);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="max-w-md mx-2 p-4  rounded-xl ">
            <h2 className="text-xl font-semibold mb-5 ">Warranty Status Checker</h2>
            <input
                type="text"
                placeholder="Enter Serial Number or Ticket ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 mt-2 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            />
            <button
                onClick={handleSearch}
                className="w-full bg-[#10B981] text-white px-4 py-2 rounded-md hover:bg-[#0f9f6e] transition-all duration-200"
                disabled={loading}
            >
                {loading ? 'Checking...' : 'Check Warranty'}
            </button>

            {modalOpen && result && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 transition">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-full max-w-md transform scale-100 transition duration-300">
                        {result.withinWarranty  ? (
                            <>
                                <h3 className="text-lg font-bold text-green-600 mb-2">Device: {result.deviceName} - {result.brand} {result.model}</h3>
                                <p>Serial Number: {result.serialNumber}</p>
                                <p>{result.daysLeft} days left.</p>
                                <button
                                    onClick={() => {setOpenReturnRequest(true); setModalOpen(false);}}
                                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 mr-5 mt-5"
                            >
                                Make Return Request
                            </button>
                                </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-green-600 mb-2">Sorry...</h3>
                                <p>{result.message}</p>
                            </>
                        )}
                        <button
                            onClick={() => setModalOpen(false)}
                            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 mt-5"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            <RequestReturn isOpen={openReturnRequest} onClose={() => setOpenReturnRequest(false) } serialNumber={query} onSuccess={onSuccess}/>
        </div>
    );
};

export default CheckWarranty;
