// javascript
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar as CalendarIcon, Search, User, Phone, Mail, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const EditPartModal = ({
                           isOpen,
                           onClose,
                           editPart,
                           onInputChange,
                           onSubmit,
                           loading,
                           success,
                           error,
                           // new props for fetching/displaying customer
                           fetchCustomer, // function({ phone, email }) => void
                           fetchedCustomer, // object returned from fetch
                           fetchingCustomer // optional boolean
                       }) => {
    const [showPurchaseDateCalendar, setShowPurchaseDateCalendar] = useState(false);
    const [showWarrantyExpirationCalendar, setShowWarrantyExpirationCalendar] = useState(false);
    const [isCustomerPurchased, setIsCustomerPurchased] = useState(false);
    const [warrantyType, setWarrantyType] = useState('7_DAYS');
    const [customWarrantyDays, setCustomWarrantyDays] = useState(7);

    // Customer detail local state
    const [customerFirstName, setCustomerFirstName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerId, setCustomerId] = useState(null);
    const [lookupModalOpen, setLookupModalOpen] = useState(false);
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupError, setLookupError] = useState(null);
    const [isLookingUp, setIsLookingUp] = useState(false);

    // Initialize state when editPart changes
    useEffect(() => {
        if (editPart) {
            setIsCustomerPurchased(editPart.isCustomerPurchased || editPart.datePurchasedByCustomer ? true : false);
            // Only set initial warranty type if it hasn't been set yet
            if (!warrantyType) {
                setWarrantyType('7_DAYS');
                setCustomWarrantyDays(7);
            }

            // Initialize customer fields from editPart if present
            setCustomerFirstName(editPart.customerFirstName || (editPart.customer ? editPart.customer.firstName : '') || '');
            setCustomerLastName(editPart.customerLastName || (editPart.customer ? editPart.customer.lastName : '') || '');
            setCustomerPhone(editPart.customerPhone || (editPart.customer ? editPart.customer.phone : '') || '');
            setCustomerEmail(editPart.customerEmail || (editPart.customer ? editPart.customer.email : '') || '');
            setCustomerId(editPart.customerId || null);
        }
    }, [editPart]);

    // When fetchedCustomer updates, populate fields and notify parent
    useEffect(() => {
        if (fetchedCustomer) {
            const fn = fetchedCustomer.firstName || '';
            const ln = fetchedCustomer.lastName || '';
            const ph = fetchedCustomer.phone || '';
            const em = fetchedCustomer.email || '';

            setCustomerFirstName(fn);
            setCustomerLastName(ln);
            setCustomerPhone(ph);
            setCustomerEmail(em);

            onInputChange({ target: { name: 'customerFirstName', value: fn } });
            onInputChange({ target: { name: 'customerLastName', value: ln } });
            onInputChange({ target: { name: 'customerPhone', value: ph } });
            onInputChange({ target: { name: 'customerEmail', value: em } });
        }
    }, [fetchedCustomer]);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.react-calendar') && !event.target.closest('input[readonly]')) {
                setShowPurchaseDateCalendar(false);
                setShowWarrantyExpirationCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const calculateWarrantyExpiration = (purchaseDate, type, customDays = 7) => {
        if (!purchaseDate) return null;
        const date = new Date(purchaseDate);

        switch(type) {
            case '7_DAYS':
                date.setDate(date.getDate() + 7);
                break;
            case '3_MONTHS':
                date.setMonth(date.getMonth() + 3);
                break;
            case '6_MONTHS':
                date.setMonth(date.getMonth() + 6);
                break;
            case '1_YEAR':
                date.setFullYear(date.getFullYear() + 1);
                break;
            case 'CUSTOM':
                date.setDate(date.getDate() + customDays);
                break;
            default:
                date.setDate(date.getDate() + 7);
        }
        return date;
    };

    const handleWarrantyTypeChange = (e) => {
        const type = e.target.value;
        setWarrantyType(type);

        if (type === 'CUSTOM') {
            return;
        }

        if (editPart.datePurchasedByCustomer) {
            const expirationDate = calculateWarrantyExpiration(
                editPart.datePurchasedByCustomer,
                type,
                customWarrantyDays
            );
            onInputChange({ target: { name: 'warrantyExpiration', value: expirationDate } });
        }
    };

    const handleWarrantyExpirationDateChange = (date) => {
        const expirationDate = new Date(date);
        expirationDate.setHours(23, 59, 59, 999);

        onInputChange({ target: { name: 'warrantyExpiration', value: expirationDate } });
        setShowWarrantyExpirationCalendar(false);
    };

    const handlePurchaseDateChange = (date) => {
        onInputChange({ target: { name: 'datePurchasedByCustomer', value: date } });
        setShowPurchaseDateCalendar(false);

        const expirationDate = calculateWarrantyExpiration(date, warrantyType, customWarrantyDays);
        onInputChange({ target: { name: 'warrantyExpiration', value: expirationDate } });
    };

    const handleCustomerPurchaseToggle = (e) => {
        const isEnabled = e.target.checked;
        setIsCustomerPurchased(isEnabled);

        onInputChange({ target: { name: 'isCustomerPurchased', value: isEnabled } });

        if (!isEnabled) {
            onInputChange({ target: { name: 'datePurchasedByCustomer', value: null } });
            onInputChange({ target: { name: 'warrantyExpiration', value: null } });
            setWarrantyType('7_DAYS');
            setCustomWarrantyDays(7);
        }
    };

    const calculateDaysRemaining = () => {
        if (!editPart.warrantyExpiration) return null;
        const expiration = new Date(editPart.warrantyExpiration);
        const today = new Date();
        const diffTime = expiration - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Customer input handlers that update local state and parent editPart
    const handleCustomerFirstNameChange = (e) => {
        setCustomerFirstName(e.target.value);
        onInputChange({ target: { name: 'customerFirstName', value: e.target.value } });
    };
    const handleCustomerLastNameChange = (e) => {
        setCustomerLastName(e.target.value);
        onInputChange({ target: { name: 'customerLastName', value: e.target.value } });
    };
    const handleCustomerPhoneChange = (e) => {
        setCustomerPhone(e.target.value);
        onInputChange({ target: { name: 'customerPhone', value: e.target.value } });
    };
    const handleCustomerEmailChange = (e) => {
        setCustomerEmail(e.target.value);
        onInputChange({ target: { name: 'customerEmail', value: e.target.value } });
    };

    const handleLookupCustomer = () => {
        const emailToLookup = customerEmail && customerEmail.trim();
        if (!emailToLookup) {
            setLookupError('Please enter an email to lookup');
            setLookupModalOpen(true);
            setLookupResult(null);
            return;
        }
        setIsLookingUp(true);
        setLookupError(null);
        const token = localStorage.getItem('authToken');
        const base = window.__API_BASE__ || '';
        const url = `${base.replace(/\/$/, '')}/user/findByEmail?email=${encodeURIComponent(emailToLookup)}`;
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        })
            .then(async res => {
                setIsLookingUp(false);
                const contentType = res.headers.get('content-type') || '';
                if (res.ok) {
                    if (!contentType.includes('application/json')) {
                        setLookupResult(null);
                        setLookupError('Unexpected response format');
                        setLookupModalOpen(true);
                        return;
                    }
                    const data = await res.json();
                    setLookupResult(data);
                    setLookupModalOpen(true);
                } else if (res.status === 404) {
                    setLookupResult(null);
                    setLookupError('Customer Not Found');
                    setLookupModalOpen(true);
                } else {
                    let bodyText = '';
                    try {
                        bodyText = contentType.includes('application/json') ? JSON.stringify(await res.json()) : await res.text();
                    } catch (e) {
                        bodyText = 'Unable to read error body';
                    }
                    setLookupResult(null);
                    setLookupError(`Lookup failed (status ${res.status}): ${bodyText}`);
                    setLookupModalOpen(true);
                }
            })
            .catch(err => {
                setIsLookingUp(false);
                setLookupResult(null);
                setLookupError('Lookup failed: ' + err.message);
                setLookupModalOpen(true);
            });
    };

    const handleUseCustomerInfo = () => {
        if (!lookupResult) return;
        const fn = lookupResult.firstName || '';
        const ln = lookupResult.lastName || '';
        const ph = lookupResult.phoneNumber || lookupResult.phone || '';
        const em = lookupResult.email || '';
        const id = lookupResult.userId || null;

        setCustomerFirstName(fn);
        setCustomerLastName(ln);
        setCustomerPhone(ph);
        setCustomerEmail(em);
        setCustomerId(id);

        onInputChange({ target: { name: 'customerFirstName', value: fn } });
        onInputChange({ target: { name: 'customerLastName', value: ln } });
        onInputChange({ target: { name: 'customerPhone', value: ph } });
        onInputChange({ target: { name: 'customerEmail', value: em } });
        if (id !== null) {
            onInputChange({ target: { name: 'customerId', value: id } });
        }
        setLookupModalOpen(false);
    };

    const handleCloseLookupModal = () => {
        setLookupModalOpen(false);
        setLookupError(null);
        setLookupResult(null);
    };

    if (!isOpen || !editPart) return null;

    const daysRemaining = calculateDaysRemaining();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Part</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {success && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                        <CheckCircle size={20} className="mr-2" />
                        Part updated successfully!
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Part Number</label>
                            <input
                                type="text"
                                name="partNumber"
                                value={editPart.partNumber || ""}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={editPart.name || ""}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Brand</label>
                            <input
                                type="text"
                                name="brand"
                                value={editPart.brand || ''}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Brand"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Model</label>
                            <input
                                type="text"
                                name="model"
                                value={editPart.model || ''}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Model"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={editPart.description || ""}
                            onChange={onInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Unit Cost (₱)</label>
                            <input
                                type="number"
                                name="unitCost"
                                value={editPart.unitCost || 0}
                                onChange={onInputChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-medium mb-1">Serial Number</label>
                            <input
                                type="text"
                                name="serialNumber"
                                value={editPart.serialNumber || ""}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Customer Purchase Toggle */}
                    <div className="mb-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isCustomerPurchased}
                                    onChange={handleCustomerPurchaseToggle}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
                                    isCustomerPurchased ? 'bg-blue-600' : 'bg-gray-300'
                                }`}>
                                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
                                        isCustomerPurchased ? 'transform translate-x-6' : ''
                                    }`}></div>
                                </div>
                            </div>
                            <span className="text-gray-700 font-medium">Enable if this item is purchased by the customer</span>
                        </label>
                    </div>

                    {/* Purchase Date and Warranty Section */}
                    {isCustomerPurchased && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Warranty Information</h3>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Date Purchased by Customer</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={editPart.datePurchasedByCustomer ? new Date(editPart.datePurchasedByCustomer).toLocaleDateString() : ''}
                                        readOnly
                                        onClick={() => setShowPurchaseDateCalendar(true)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                        placeholder="Select purchase date"
                                    />
                                    <CalendarIcon className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                </div>
                                {showPurchaseDateCalendar && (
                                    <div className="absolute z-10 mt-1">
                                        <Calendar
                                            onChange={handlePurchaseDateChange}
                                            value={editPart.datePurchasedByCustomer ? new Date(editPart.datePurchasedByCustomer) : null}
                                            className="border border-gray-200 rounded-lg shadow-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-1">Warranty Period</label>
                                <select
                                    value={warrantyType}
                                    onChange={handleWarrantyTypeChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="7_DAYS">7 Days</option>
                                    <option value="3_MONTHS">3 Months</option>
                                    <option value="6_MONTHS">6 Months</option>
                                    <option value="1_YEAR">1 Year</option>
                                    <option value="CUSTOM">Custom Set Expiration Date</option>
                                </select>
                            </div>

                            {warrantyType === 'CUSTOM' && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-1">Custom Warranty Expiration Date</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editPart.warrantyExpiration ? new Date(editPart.warrantyExpiration).toLocaleDateString() : ''}
                                            readOnly
                                            onClick={() => setShowWarrantyExpirationCalendar(true)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                            placeholder="Select warranty expiration date"
                                        />
                                        <CalendarIcon className="absolute right-3 top-2.5 text-gray-400" size={20} />
                                    </div>
                                    {showWarrantyExpirationCalendar && (
                                        <div className="absolute z-10 mt-1">
                                            <Calendar
                                                onChange={handleWarrantyExpirationDateChange}
                                                value={editPart.warrantyExpiration ? new Date(editPart.warrantyExpiration) : null}
                                                className="border border-gray-200 rounded-lg shadow-lg"
                                                minDate={editPart.datePurchasedByCustomer ? new Date(editPart.datePurchasedByCustomer) : new Date()}
                                            />
                                        </div>
                                    )}
                                    <div className="mt-2 text-xs text-gray-500">
                                        Warranty will expire at 23:59:59 on the selected date
                                    </div>
                                </div>
                            )}

                            {editPart.warrantyExpiration && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">Warranty Expiration:</span>{' '}
                                        {warrantyType === 'CUSTOM'
                                            ? new Date(editPart.warrantyExpiration).toLocaleString()
                                            : new Date(editPart.warrantyExpiration).toLocaleDateString()
                                        }
                                    </div>
                                    {daysRemaining !== null && (
                                        <div className={`text-sm mt-1 ${
                                            daysRemaining > 30 ? 'text-green-600' :
                                                daysRemaining > 7 ? 'text-yellow-600' :
                                                    'text-red-600'
                                        }`}>
                                            {daysRemaining > 0
                                                ? `${daysRemaining} days remaining`
                                                : 'Warranty expired'}
                                        </div>
                                    )}
                                    {warrantyType === 'CUSTOM' && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Custom expiration time: 23:59:59
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Customer Details Table / Inputs */}
                            <div className="mt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h4>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">First Name</label>
                                        <input
                                            type="text"
                                            name="customerFirstName"
                                            value={customerFirstName}
                                            onChange={handleCustomerFirstNameChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="First name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            name="customerLastName"
                                            value={customerLastName}
                                            onChange={handleCustomerLastNameChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Last name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Phone</label>
                                        <input
                                            type="text"
                                            name="customerPhone"
                                            value={customerPhone}
                                            onChange={handleCustomerPhoneChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-700 text-xs font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="customerEmail"
                                            value={customerEmail}
                                            onChange={handleCustomerEmailChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Email"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={handleLookupCustomer}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-300 hover:bg-gray-200 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={isLookingUp}
                                    >
                                        {isLookingUp ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Looking up...
                                            </>
                                        ) : (
                                            <>
                                                <Search size={14} />
                                                Lookup Customer
                                            </>
                                        )}
                                    </button>
                                    <div className="text-xs text-gray-500">Use email to find existing customer records</div>
                                </div>

                                {lookupModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                        {/* Backdrop with blur effect */}
                                        <div
                                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                            onClick={handleCloseLookupModal}
                                        ></div>

                                        {/* Modal Content */}
                                        <div className="bg-white rounded-xl shadow-2xl z-10 w-full max-w-md transform transition-all animate-in fade-in zoom-in duration-200">
                                            {/* Header */}
                                            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Search className="text-blue-600" size={20} />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-800">Customer Lookup</h3>
                                                </div>
                                                <button
                                                    onClick={handleCloseLookupModal}
                                                    className="text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg p-2 transition-colors"
                                                    aria-label="Close modal"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            {/* Body */}
                                            <div className="p-6">
                                                {/* Error State */}
                                                {lookupError && (
                                                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                                                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-red-800 mb-1">
                                                                {lookupError.includes('Not Found') ? 'Customer Not Found' : 'Lookup Failed'}
                                                            </h4>
                                                            <p className="text-sm text-red-600">{lookupError}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Success State - Customer Found */}
                                                {lookupResult && (
                                                    <div className="space-y-4">
                                                        {/* Success Banner */}
                                                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                                            <UserCheck className="text-green-600 flex-shrink-0" size={24} />
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-green-800">Customer Found!</h4>
                                                                <p className="text-xs text-green-600">Review the details below</p>
                                                            </div>
                                                        </div>

                                                        {/* Customer Details Card */}
                                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                                                            {/* Name */}
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                    <User className="text-gray-600" size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Full Name</p>
                                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                                        {lookupResult.firstName || '-'} {lookupResult.lastName || '-'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Phone */}
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                    <Phone className="text-gray-600" size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Phone Number</p>
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {lookupResult.phoneNumber || lookupResult.phone || '-'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Email */}
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                    <Mail className="text-gray-600" size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Email Address</p>
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {lookupResult.email || '-'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {!lookupResult && !lookupError && (
                                                    <div className="text-center py-8">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <Search className="text-gray-400" size={32} />
                                                        </div>
                                                        <p className="text-sm text-gray-500">No data to display</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                                                <button
                                                    onClick={handleCloseLookupModal}
                                                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white hover:border-gray-400 transition-all duration-200"
                                                >
                                                    Cancel
                                                </button>
                                                {lookupResult && (
                                                    <button
                                                        onClick={handleUseCustomerInfo}
                                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle size={18} />
                                                        Use Customer Info
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Updating...' : 'Update Part'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPartModal;
