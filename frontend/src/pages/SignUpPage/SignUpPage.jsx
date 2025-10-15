import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner.jsx';
import LoadingModal from "../../components/LoadingModal/LoadingModal.jsx";

const SignUpPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        phoneNumber: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [signupProcessing, setSignupProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const closeToast = () => setToast(prev => ({ ...prev, show: false }));

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Password regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_+])[A-Za-z\d@$!%*?&#^_+]{8,}$/;

    // Toast auto-hide effect
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    // Handle input changes
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
        if (id === 'password') {
            setIsPasswordValid(passwordRegex.test(value));
        }
    };

    // Phone number input
    const handlePhoneInput = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/\D/g, '');
        let formattedValue = '';
        if (numericValue.length > 0) {
            formattedValue = numericValue.slice(0, 3);
            if (numericValue.length > 3) {
                formattedValue += ' ' + numericValue.slice(3, 6);
            }
            if (numericValue.length > 6) {
                formattedValue += ' ' + numericValue.slice(6, 10);
            }
        }
        setFormData({ ...formData, phoneNumber: formattedValue });
    };

    // Name input - letters only
    const handleNameInput = (e) => {
        const { id, value } = e.target;
        if (/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']*$/.test(value) || value === '') {
            setFormData({ ...formData, [id]: value });
        }
    };

    // Password strength for bar
    const getPasswordProgress = () => {
        if (!formData.password) return 0;
        return Math.min(formData.password.length / 8 * 100, 100);
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Submit registration
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setSignupProcessing(true); // Start the full-screen loading

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phoneNumber || !formData.username) {
            setError('All fields are required');
            setLoading(false);
            setSignupProcessing(false); // Stop loading if validation fails
            return;
        }
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
            setLoading(false);
            setSignupProcessing(false); // Stop loading if validation fails
            return;
        }

        const formattedPhoneNumber = formData.phoneNumber.replace(/\s/g, '');
        const requestData = { ...formData, phoneNumber: formattedPhoneNumber };

        try {
            const response = await fetch(`${window.__API_BASE__}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                let errorMessage = 'Registration failed. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {}
                setError(errorMessage);
                setLoading(false);
                setSignupProcessing(false);
                return;
            }
            // Registration success
            setSuccess(true);
            setShowSuccessModal(true);
            showToast('Registration successful! Please check your email for verification.', 'success');
            setLoading(false);
            setSignupProcessing(false);
            // Redirect to login page after 3 seconds
            setTimeout(() => {
                if (typeof navigate === 'function') {
                    navigate('/login');
                } else if (window.location) {
                    window.location.href = '/login';
                }
            }, 3000);
        } catch (err) {
            setError('Network error. Please try again later.');
            setLoading(false);
            setSignupProcessing(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
            <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-[#25D482]"></div>
                <div className="text-center mb-2">
                    <div className="text-2xl font-bold text-gray-800 tracking-wide">
                        IO<span className="text-[#33e407]">CONNECT</span>
                    </div>
                </div>

                <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    Create your account
                </h1>
                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded">
                        Please check your email to verify your account.
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label htmlFor="firstName" className="block mb-2 text-sm font-medium text-gray-600">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleNameInput}
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
                                onChange={handleNameInput}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482] transition-colors"
                                placeholder="Last name"
                                required
                            />
                        </div>
                    </div>
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
                    <div className="mb-5">
                        <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-600">Phone Number</label>
                        <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#25D482] focus-within:ring-1 focus-within:ring-[#25D482] transition-colors overflow-hidden">
                            <div className="flex items-center bg-gray-50 px-3 py-3 border-r border-gray-200">
                                <img
                                    src="https://flagcdn.com/16x12/ph.png"
                                    alt="Philippine flag"
                                    className="mr-2 w-5 h-auto"
                                    loading="lazy"
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
                    <div className="mb-5">
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-600">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 text-sm border rounded-md focus:outline-none transition-colors ${
                                    formData.password ?
                                        (isPasswordValid ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500' : 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500')
                                        : 'border-gray-200 focus:border-[#25D482] focus:ring-1 focus:ring-[#25D482]'
                                }`}
                                placeholder="Create a password"
                                required
                            />
                            {formData.password && (
                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                    {isPasswordValid ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            )}
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={togglePasswordVisibility}
                                tabIndex="-1"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ease-out ${
                                        getPasswordProgress() < 40 ? 'bg-red-500' :
                                            getPasswordProgress() < 80 ? 'bg-yellow-500' :
                                                'bg-green-500'
                                    }`}
                                    style={{ width: `${getPasswordProgress()}%` }}
                                ></div>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            {!formData.password && (
                                <div className="text-xs mt-1.5 text-gray-400">
                                    Password must be at least 8 characters and include uppercase, lowercase, number, and special character
                                </div>
                            )}
                            {formData.password && !isPasswordValid && (
                                <div className="mt-2 space-y-1 text-xs">
                                    <div className={`${formData.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                                        • At least 8 characters
                                    </div>
                                    <div className={`${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        • At least one uppercase letter
                                    </div>
                                    <div className={`${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        • At least one lowercase letter
                                    </div>
                                    <div className={`${/\d/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        • At least one number
                                    </div>
                                    <div className={`${/[@$!%*?&#^_+]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        • At least one special character (@$!%*?&#^_+)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#25D482] rounded-md hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <Spinner size="small" />
                                <span className="ml-2">Signing Up...</span>
                            </span>
                        ) : 'Sign Up'}
                    </button>
                </form>
                <div className="flex items-center my-6 text-gray-400 text-sm">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="px-4">OR</div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="text-center mt-4 text-sm text-gray-600">
                    Already have an account? <a href="/login" className="text-[#25D482] font-medium hover:underline">Login</a>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-sm relative text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Registration Successful!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Your account has been created successfully. Redirecting to login page...
                        </p>

                        <div className="flex justify-center">
                            <Spinner size="normal" />
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* Full-screen Loading Overlay */}
            {signupProcessing && (
                <LoadingModal
                    show={loading}
                    title="Setting Up Your Account"
                    message="Please wait while we process your registration......"
                />
            )}
        </div>
    );
};

export default SignUpPage;
