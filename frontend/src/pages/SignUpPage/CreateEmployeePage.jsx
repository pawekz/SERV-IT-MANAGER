import React, { useState } from 'react';
import Toast from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner.jsx';

const CreateEmployeePage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const closeToast = () => setToast({ ...toast, show: false });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePhoneInput = (e) => {
    const numeric = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (numeric.length > 0) {
      formatted = numeric.slice(0, 3);
      if (numeric.length > 3) formatted += ' ' + numeric.slice(3, 6);
      if (numeric.length > 6) formatted += ' ' + numeric.slice(6, 10);
    }
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { firstName, lastName, username, phoneNumber, email } = formData;
    if (!firstName || !lastName || !username || !phoneNumber || !email) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${window.__API_BASE__}/user/createEmployee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, phoneNumber: phoneNumber.replace(/\s/g, '') })
      });
      if (!res.ok) {
        let errorMessage = 'Failed to create employee';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        setError(errorMessage);
        setLoading(false);
        return;
      }
      showToast('Employee created successfully!');
      setFormData({ firstName: '', lastName: '', username: '', phoneNumber: '', email: '' });
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
        <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1 h-full bg-[#2563eb]"></div>
          <div className="text-center mb-2">
          <div className="text-2xl font-bold text-gray-800 tracking-wide">
            IO<span className="text-[#33e407]">CONNECT</span>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">Create Employee Account</h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label htmlFor="firstName"  className="block mb-2 text-sm text-gray-600">First Name</label>
              <input id="firstName" placeholder={"First name"} value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
            </div>
            <div>
              <label htmlFor="lastName" className="block mb-2 text-sm text-gray-600">Last Name</label>
              <input id="lastName" placeholder={"Last name"} value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="username" className="block mb-2 text-sm text-gray-600">Username</label>
            <input id="username" placeholder={"Enter your username"} value={formData.username} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
          </div>
          <div className="mb-5">
            <label htmlFor="email" className="block mb-2 text-sm text-gray-600">Email</label>
            <input type="email" id="email" placeholder={"Enter your email"} value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
          </div>
          <div className="mb-5">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-600">Phone Number</label>
            <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb] transition-colors overflow-hidden">
              <div className="flex items-center bg-gray-50 px-3 py-3 border-r border-gray-200">
                <img
                    src="https://flagcdn.com/16x12/ph.png"
                    alt="Philippine flag"
                    className="mr-2 w-5 h-auto"
                />
                <span className="text-sm text-gray-600">+63</span>
              </div>
              <input
                  maxLength={13}
                  type="tel"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handlePhoneInput}
                  className="flex-1 px-4 py-3 text-sm border-none focus:outline-none"
                  placeholder="905 123 4567"
                  required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#2563eb] text-white rounded transition hover:bg-[#1d4ed8] disabled:bg-gray-300">
            {loading ? <span className="flex items-center justify-center"><Spinner size="small" /><span className="ml-2">Saving...</span></span> : 'Create'}
          </button>
        </form>
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast}/>
      </div>
    </div>
  );
};

export default CreateEmployeePage;
