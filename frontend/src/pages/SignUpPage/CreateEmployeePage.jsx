import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner.jsx';

const CreateEmployeePage = () => {
  const navigate = useNavigate();
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
      const res = await fetch('http://localhost:8080/user/createEmployee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, phoneNumber: phoneNumber.replace(/\s/g, '') })
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt || 'Failed to create employee');
      showToast('Employee created successfully!');
      setFormData({ firstName: '', lastName: '', username: '', phoneNumber: '', email: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md relative">
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">Create Employee Account</h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label htmlFor="firstName" className="block mb-2 text-sm text-gray-600">First Name</label>
              <input id="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
            </div>
            <div>
              <label htmlFor="lastName" className="block mb-2 text-sm text-gray-600">Last Name</label>
              <input id="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="username" className="block mb-2 text-sm text-gray-600">Username</label>
            <input id="username" value={formData.username} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
          </div>
          <div className="mb-5">
            <label htmlFor="email" className="block mb-2 text-sm text-gray-600">Email</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded" required/>
          </div>
          <div className="mb-5">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm text-gray-600">Phone Number (10 digits)</label>
            <input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneInput}
              maxLength={13}
              type="tel"
              className="w-full px-4 py-3 text-sm border rounded focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407]"
              placeholder="927 650 4625"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-[#33e407] text-white rounded hover:bg-[#2bc906] disabled:bg-gray-300">
            {loading ? <span className="flex items-center justify-center"><Spinner size="small" /><span className="ml-2">Saving...</span></span> : 'Create'}
          </button>
        </form>
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast}/>
      </div>
    </div>
  );
};

export default CreateEmployeePage;
