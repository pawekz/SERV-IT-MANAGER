import React, {useEffect, useState} from "react";
import RequestReturn from "../RequestReturn/RequestReturn.jsx";
import WarrantyRequest from "../WarrantyRequest/WarrantyRequest.jsx";
import {Archive, Computer, Headphones, TabletSmartphone} from "lucide-react";

const CheckWarranty = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [openReturnRequest, setOpenReturnRequest] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setResult(null);

        // Simulate delay
        setTimeout(() => {
            const mockData =
                query === '123456'
                    ? { inWarranty: true, daysLeft: 42 }
                    : { inWarranty: false, daysLeft: 0 };

            setResult(mockData);
            setModalOpen(true);
            setLoading(false);
        }, 800); // simulate loading time
    };

    const getProductIcon = (deviceType) => {
        if (!deviceType || typeof deviceType !== "string") return <Archive className="text-gray-500 w-8 h-8" />;

        const name = deviceType.toLowerCase();

        if (name.includes("laptop") || name.includes("computer") || name.includes("pc")) {
            return <Computer className="text-[#10B981] size-10" />;
        } else if (name.includes("phone") || name.includes("smartphone") || name.includes("tablet")) {
            return <TabletSmartphone className="text-[#10B981] size-10" />;
        } else if (name.includes("headset") || name.includes("earphone") || name.includes("headphone")) {
            return <Headphones className="text-[#10B981] size-10" />;
        } else {
            return <Archive className="text-[#10B981] size-10" />;
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
                        {result.inWarranty ? (
                            <>
                                <h3 className="text-lg font-bold text-green-600 mb-2">Device: Headphone</h3>
                                <p>Serial Number: #123456</p>
                                <p>{result.daysLeft} days left.</p>
                                <button
                                    onClick={() => setOpenReturnRequest(true)}
                                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 mr-5 mt-5"
                            >
                                Make Return Request
                            </button>
                                </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-red-600 mb-2">Not in Warranty</h3>
                                <p>Sorry, You are no longer eligible for a return.</p>
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
            < RequestReturn isOpen={openReturnRequest} onClose={() => setOpenReturnRequest(false) } />
        </div>
    );
};

export default CheckWarranty;
