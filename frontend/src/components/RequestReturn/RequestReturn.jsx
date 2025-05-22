import React, {useEffect, useState} from "react";

const RequestReturn = ({ isOpen, onClose }) => {
    const [deviceType, setDeviceType] = useState("");
    const role = localStorage.getItem('userRole')?.toLowerCase();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        orderNumber: "",
        deviceType: "",
        purchaseDate: "",
        serialNumber: "",
        issueDescription: "",
        reasons: [],
    });

    const reasonsList = [
        "Defective/Not Working",
        "Wrong Item Received",
        "Performance Issues",
        "Physical Damage",
        "Upgrade Request",
        "Other",
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

            <div
                className={`bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh]
                transform transition-all duration-700 scale-95 opacity-0 ${isOpen ? 'scale-100 opacity-100' : ''}`}
            ><div className="bg-gray-100 p-3 rounded-r-2xl  mb-5 border-l-8 border-[#33e407]">
                <h2 className="text-2xl font-semibold text-center ">Return Request (RMA)</h2>
            </div>
                {/* Customer Info */}
                {role !== "customer" && (
                    <div className="border p-6 mb-6 rounded-r-2xl bg-white border-l-8 border-l-[#33e407] ">
                        <h3 className="font-bold text-lg mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" placeholder="Name" className="input w-full" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="text" placeholder="Phone" className="input w-full" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" placeholder="Email" className="input w-full" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                                <input type="text" placeholder="Order Number" className="input w-full" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Device Info */}
                <div className="border p-6 mb-6 rounded-r-2xl border-l-8 border-l-[#33e407] ">
                    <h3 className="font-bold text-lg mb-4">Device Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ">Device Type</label>
                            <select
                                value={deviceType}
                                onChange={(e) => setDeviceType(e.target.value)}
                                className={`input w-full rounded-lg border-2 p-2 ${
                                    deviceType === "" ? "text-gray-500" : "text-black"
                                }`}
                            >
                                <option value="" disabled hidden>
                                    Select Device Type
                                </option>
                                <option value="Laptop">Laptop</option>
                                <option value="Phone">Phone</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Purchased Date</label>
                            <input
                                type="date"
                                className="input w-full rounded-lg border-2 p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Serial Number</label>
                            <input
                                type="text"
                                className="input w-full rounded-lg border-2 p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Issue</label>
                            <input
                                type="text"
                                className="input w-full rounded-lg border-2 p-2"
                            />
                        </div>
                    </div>
                </div>

                {/* Return Reason */}
                <div className="border rounded-r-2xl  p-4 mb-4 border-l-8 border-l-[#33e407]">
                    <h3 className="font-bold mb-3">Return Reason</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {reasonsList.map((label, i) => (
                            <label key={i} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    className="accent-green-600"
                                />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <p className="text-sm italic text-green-500 mb-6">
                    * Note: Device must be brought to the office for diagnosis and repair processing.
                </p>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Close</button>
                        <button className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600">
                            Submit Request
                        </button>
                </div>
            </div>
        </div>
    );
};

export default RequestReturn;
