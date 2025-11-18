import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner/Spinner.jsx';
import api from '../../config/ApiConfig';
import LoadingModal from '../../components/LoadingModal/LoadingModal.jsx';

const InitialSetupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [error, setError] = useState('');
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_+])[A-Za-z\d@$!%*?&#^_+]{8,}$/;
  const phoneNumberRegex = /^9\d{9}$/;

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'phoneNumber') {
      // Only allow numbers, max 10 digits, must start with 9
      let sanitized = value.replace(/\D/g, '');
      if (sanitized.length > 10) sanitized = sanitized.slice(0, 10);
      setFormData({ ...formData, [id]: sanitized });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (Object.values(formData).some((v) => !v)) {
      setError('All fields are required.');
      return;
    }
    if (!phoneNumberRegex.test(formData.phoneNumber)) {
      setError('Phone number must be 10 digits, start with 9, and contain only numbers.');
      return;
    }
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/user/register/onboard', formData);
      // Success – show a full-screen loading modal then redirect to staff login
      setLoading(false);
      setShowLoadingModal(true);
      // small delay so user sees the modal before redirect
      setTimeout(() => {
        navigate('/login/staff');
      }, 1200);
    } catch (err) {
      setError(err.response?.data || err.message || 'Onboarding failed.');
    } finally {
      // keep modal visible until redirect; stop form loading
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
      <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 w-1 h-full bg-[#25D482]"></div>

        {/* Brand */}
        <div className="text-center mb-2">
          <div className="text-2xl font-bold text-gray-800 tracking-wide">
            IO<span className="text-[#25D482]">CONNECT</span>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Initial Administrator Setup
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Names */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-600">First Name</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482] transition-colors"
                placeholder="First name"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block mb-2 text-sm font-medium text-gray-600">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482] transition-colors"
                placeholder="Last name"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div className="mb-5">
            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-600">Username</label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482] transition-colors"
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-5">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482] transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-600">Phone Number</label>
            <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#25D482] focus-within:ring-1 focus-within:ring-[#25D482] transition-colors overflow-hidden">
              <div className="flex items-center bg-gray-50 px-3 py-3 border-r border-gray-200">
                <img src="https://flagcdn.com/16x12/ph.png" alt="PH" className="mr-2 w-5 h-auto" loading="lazy" />
                <span className="text-sm text-gray-600">+63</span>
              </div>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="flex-1 px-4 py-3 text-sm border-none focus:outline-none"
                placeholder="905 123 4567"
                required
                pattern="9[0-9]{9}"
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482] transition-colors"
              placeholder="Create a password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#25D482] rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (<Spinner size="small" />) : 'Create Administrator Account'}
          </button>
        </form>
      </div>
      <LoadingModal show={showLoadingModal} title="Finishing setup" message="Finalizing initial setup, redirecting to staff login..." />
    </div>
  );
};

export default InitialSetupPage;
