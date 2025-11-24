import React, {useEffect, useState} from "react";
import api from '../../config/ApiConfig.jsx';

const RequestReturn = ({ isOpen, onClose, serialNumber, onSuccess }) => {
    const [deviceType, setDeviceType] = useState("");
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const [isChecked, setIsChecked] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        customerFirstName: "",
        customerLastName: "",
        customerPhoneNumber: "",
        customerEmail: "",
        warrantyNumber: "",
        deviceName: "",
        purchasedDate: "",
        serialNumber: serialNumber,
        reportedIssue: "",
        returnReason: "",
    });

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setIsChecked(checked);
    }

    useEffect(() => {
        if (role === "customer" && isOpen) {
            setFormData(prev => ({
                ...prev,
                customerFirstName: userData.firstName || "",
                customerLastName: userData.lastName || "",
                customerPhoneNumber: userData.phoneNumber || "",
                customerEmail: userData.email || "",
            }));
        } else {
            setIsChecked(true);
        }
    }, [role, isOpen]);

    const generateWarrantyNumber = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }
            const response = await api.get('/warranty/generateWarrantyNumber');
            const data = response.data;
            return data;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !serialNumber) return;

        const getData = async () => {
            try {
                setLoading(true);
                let warrantyNumber = await generateWarrantyNumber();
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error("Not authenticated. Please log in.");
                const deviceRes = await api.get(`/part/getPartBySerialNumber/${serialNumber}`);
                const deviceData = deviceRes.data;
                setFormData(prev => ({
                    ...prev,
                    deviceName: deviceData.name,
                    purchasedDate: deviceData.datePurchasedByCustomer,
                    serialNumber: deviceData.serialNumber,
                    warrantyNumber: warrantyNumber,
                }));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getData()
    }, [isOpen, serialNumber]);

    const reasonsList = [
        "Defective/Not Working",
        "Wrong Item Received",
        "Performance Issues",
        "Physical Damage",
        "Upgrade Request",
        "Other",
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const onSubmit = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Not authenticated. Please log in.");
            if (
                !formData.customerFirstName ||
                !formData.customerLastName ||
                !formData.customerEmail ||
                !formData.customerPhoneNumber ||
                !formData.returnReason
            ) {
                setError("Please fill in all required fields.");
                setLoading(false);
                return;
            }
            if (!isChecked) {
                setError("Please check the terms and conditions box.");
                setLoading(false);
                return;
            }
            const payload = new FormData();
            payload.append("customerFirstName", formData.customerFirstName);
            payload.append("customerLastName", formData.customerLastName);
            payload.append("customerPhoneNumber", formData.customerPhoneNumber);
            payload.append("customerEmail", formData.customerEmail);
            payload.append("warrantyNumber", formData.warrantyNumber);
            payload.append("serialNumber", formData.serialNumber);
            payload.append("reportedIssue", formData.reportedIssue);
            payload.append("returnReason", formData.returnReason);
            console.log("subt:",payload)
            const response = await api.post('/warranty/checkInWarranty', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            const result = response.data;
            onSuccess();
            onClose(); // Close the modal after successful submission
        } catch (err) {
            setError(err.message);
        } finally {
            setFormData(null)
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

            <div
                className={`bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl max-h-[100vh] overflow-y-auto
                transform transition-all duration-700 scale-95 opacity-0 ${isOpen ? 'scale-100 opacity-100' : ''}`}
            ><div className="bg-gray-100 p-3 rounded-r-2xl  mb-8 border-l-8 border-[#33e407]">
                <h2 className="text-2xl font-semibold text-center ">Return Request (RMA)</h2>
                <p className="float-left text-red-700 p-5 pl-0 -ml-3">* {error}</p>
                <p className="float-right text-gray-500 p-5 pr-0">Warranty Number: {formData.warrantyNumber}</p>
            </div>
                {/* Customer Info */}
                {role !== "customer" && (
                    <div className="border p-6 mb-6 rounded-r-2xl bg-white border-l-8 border-l-[#33e407] ">
                        <h3 className="font-bold text-lg mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text"
                                       placeholder="Name"
                                       className="input w-full rounded-lg border-2 p-2"
                                       value={formData.customerFirstName}
                                       onChange={e => handleChange("customerFirstName", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text"
                                       placeholder="Name"
                                       className="input w-full rounded-lg border-2 p-2"
                                       value={formData.customerLastName}
                                       onChange={e => handleChange("customerLastName", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="text"
                                       placeholder="Phone"
                                       className="input w-full rounded-lg border-2 p-2"
                                       value={formData.customerPhoneNumber}
                                       onChange={e => handleChange("customerPhoneNumber", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email"
                                       placeholder="Email"
                                       className="input w-full rounded-lg border-2 p-2"
                                       value={formData.customerEmail}
                                       onChange={e => handleChange("customerEmail", e.target.value)}
                                />
                            </div>

                        </div>
                    </div>
                )}

                {/* Device Info */}
                <div className="border p-6 mb-6 rounded-r-2xl border-l-8 border-l-[#33e407] ">
                    <h3 className="font-bold text-lg mb-4">Device Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ">Device Name</label>
                            <input
                                type="text"
                                className="input w-full rounded-lg border-2 p-2"
                                disabled
                                value={formData.deviceName}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Purchased Date</label>
                            <input
                                type="text"
                                className="input w-full rounded-lg border-2 p-2"
                                disabled
                                value={new Date(formData.purchasedDate).toLocaleDateString()}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Serial Number</label>
                            <input
                                type="text"
                                className="input w-full rounded-lg border-2 p-2"
                                disabled
                                value={formData.serialNumber}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Issue Details</label>
                            <input
                                type="text"
                                className="input w-full rounded-lg border-2 p-2"
                                value={formData.reportedIssue}
                                onChange={e => handleChange("reportedIssue", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Return Reason */}
                <div className="border rounded-r-2xl p-4 mb-4 border-l-8 border-l-[#33e407]">
                    <h3 className="font-bold mb-3">Return Reason</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {reasonsList.map((label, i) => (
                            <label key={i} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="returnReason"
                                    value={label}
                                    checked={formData.returnReason === label}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        returnReason: e.target.value
                                    }))}
                                    className="accent-green-600"
                                />
                                <span>{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <p className=" italic text-green-600 mb-6">
                    * Note: Device must be brought to the office for diagnosis and repair processing.
                </p>

                {role === "customer" && (
                    <div className="mb-6">
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#33e407] focus:ring-[#33e407]"
                                required
                                checked={isChecked}
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600">
                                I have read and agree to the warranty <span>terms and conditions</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Close</button>
                    <button className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                            onClick={() => {
                                console.log("Submitting form:", formData);
                                onSubmit();
                            }} // or your submit logic
                    >
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestReturn