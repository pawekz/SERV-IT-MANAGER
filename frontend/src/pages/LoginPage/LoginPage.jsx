import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Toast Notification Component
const Toast = ({ message, visible, onClose }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs animate-fade-in-up flex items-center z-50">
            <div className="bg-green-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            </div>
            <p className="text-gray-700">{message}</p>
        </div>
    );
};

// Inline OTP Modal Component with 6 boxes
const OTPModal = ({ visible, onClose, onVerify, onResend, loading, error }) => {
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const inputsRef = useRef([]);

    // Auto-focus next/prev on input
    const handleChange = (e, idx) => {
        const value = e.target.value.replace(/\D/, ""); // Only digits
        if (!value && idx > 0) {
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = "";
                return arr;
            });
            inputsRef.current[idx - 1].focus();
            return;
        }
        if (value) {
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = value;
                return arr;
            });
            if (idx < 5) {
                inputsRef.current[idx + 1].focus();
            }
        } else {
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = "";
                return arr;
            });
        }
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
            inputsRef.current[idx - 1].focus();
        }
    };

    const handleVerify = () => {
        const otpValue = otpDigits.join("");
        onVerify(otpValue);
    };

    // Reset on close
    React.useEffect(() => {
        if (!visible) {
            setOtpDigits(["", "", "", "", "", ""]);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-xs relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">Enter OTP</h2>
                <p className="text-gray-600 text-sm mb-4 text-center">
                    A 6-digit code has been sent to your email.
                </p>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-center gap-2 mb-4">
                    {otpDigits.map((digit, idx) => (
                        <input
                            key={idx}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            ref={el => inputsRef.current[idx] = el}
                            onChange={e => handleChange(e, idx)}
                            onKeyDown={e => handleKeyDown(e, idx)}
                            className="w-10 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:border-[#33e407] transition-colors"
                        />
                    ))}
                </div>
                <button
                    onClick={handleVerify}
                    disabled={loading || otpDigits.some(d => d === "")}
                    className="w-full bg-[#33e407] text-white rounded py-2 font-medium hover:bg-[#2bc906] transition-colors disabled:bg-gray-300 mb-2"
                >
                    {loading ? "Verifying..." : "Verify"}
                </button>
                <button
                    onClick={onResend}
                    disabled={loading}
                    className="w-full text-[#33e407] text-sm hover:underline"
                >
                    Resend OTP
                </button>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // OTP modal states
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [otpError, setOtpError] = useState('');

    // Toast notification state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Handle input changes
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Show toast notification
    const showToast = (message) => {
        setToastMessage(message);
        setToastVisible(true);
    };

    // Extract user info from JWT token
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return {};
        }
    };

    // Request OTP for verification
    const requestOTP = async (email) => {
        try {
            const authToken = localStorage.getItem('authToken');

            const response = await fetch('http://localhost:8080/user/resendOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${authToken}`  // Add auth token
                },
                body: JSON.stringify({
                    email: email,
                    type: 1  // Type 1 for login/register
                })
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = 'Failed to send OTP';
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    if (responseText) errorMessage = responseText;
                }
                showToast('Failed to send verification code. Please try again.');
                return false;
            }

            return true;

        } catch (err) {
            showToast('Failed to send verification code. Please try again.');
            return false;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: formData.username,
                    password: formData.password,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(JSON.parse(errorText).message || 'Invalid username or password');
            }

            const data = await response.json();

            if (!data || !data.token) {
                throw new Error('No response from server or token missing');
            }

            // Store the authentication token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);

            // Get user info from token
            const tokenData = parseJwt(data.token);

            // Store email from response or token
            const resolvedUserEmail = data.email || tokenData.email || tokenData.sub;
            setUserEmail(resolvedUserEmail);
            localStorage.setItem('userEmail', resolvedUserEmail);

            // Check if account is verified
            if (tokenData.isVerified === true) {
                // If verified, redirect directly based on user role
                if (data.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/accountinformation');
                }
            } else {
                // If not verified, request an OTP first, then show OTP modal
                const otpRequested = await requestOTP(resolvedUserEmail);
                if (otpRequested) {
                    setShowOTPModal(true);
                } else {
                    setError("Failed to initiate OTP process. Please try logging in again.");
                }
            }

        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // OTP verification for login/register (type 1)
    const handleVerifyOTP = async (otp) => {
        setOtpLoading(true);
        setOtpError('');
        try {
            const email = localStorage.getItem('userEmail');
            if (!email) {
                throw new Error('No email found for OTP verification');
            }
            const requestBody = {
                email: email,
                otp: otp,
                type: 1  // Type 1 for login/register
            };
            // Send verification request without auth token
            const response = await fetch('http://localhost:8080/user/verifyOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
            });
            const responseText = await response.text();
            if (!response.ok) {
                let errorMessage = 'OTP verification failed';
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    if (responseText) errorMessage = responseText;
                }
                throw new Error(errorMessage);
            }
            // Process successful response and update token if available
            try {
                if (responseText) {
                    const responseData = JSON.parse(responseText);
                    if (responseData.token) {
                        localStorage.setItem('authToken', responseData.token);
                    }
                }
            } catch (e) {
                // Continue even if parsing fails, backend might just send success message
            }
            // OTP verified successfully
            setShowOTPModal(false);
            showToast('Account verified successfully.');
            // Redirect based on user role
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/accountinformation');
            }
        } catch (err) {
            setOtpError(err.message || 'OTP verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP for login/register (type 1)
    const handleResendOTP = async () => {
        setOtpLoading(true);
        setOtpError('');
        try {
            const email = localStorage.getItem('userEmail');
            const authToken = localStorage.getItem('authToken');
            if (!email) {
                throw new Error('No email found for OTP resend');
            }
            const requestBody = {
                email: email,
                type: 1  // Type 1 for login/register
            };
            const response = await fetch('http://localhost:8080/user/resendOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            const responseText = await response.text();
            if (!response.ok) {
                let errorMessage = 'Failed to resend OTP';
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    if (responseText) errorMessage = responseText;
                }
                throw new Error(errorMessage);
            }
            showToast('OTP has been resent to your email.');
        } catch (err) {
            setOtpError(err.message || 'Failed to resend OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md relative overflow-hidden">
                {/* Green accent border */}
                <div className="absolute left-0 top-0 w-1 h-full bg-[#33e407]"></div>

                <div className="p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="text-2xl font-bold text-gray-800">
                            IO<span className="text-[#33e407]">CONNECT</span>
                        </div>
                    </div>

                    {/* Form Title */}
                    <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                        Login to your account
                    </h1>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin}>
                        <div className="mb-5">
                            <label
                                htmlFor="username"
                                className="block mb-2 text-sm font-medium text-gray-600"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div className="mb-5">
                            <label
                                htmlFor="password"
                                className="block mb-2 text-sm font-medium text-gray-600"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    onClick={togglePasswordVisibility}
                                    tabIndex="-1"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#33e407] rounded-md hover:bg-[#2bc906] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <a
                            href="#"
                            className="block text-center mt-4 text-sm font-medium text-[#33e407] hover:underline"
                        >
                            Forgot password?
                        </a>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-6 text-gray-400 text-sm">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="px-4">OR</div>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Sign Up Link */}
                    <div className="text-center mt-4 text-sm text-gray-600">
                        Don't have an account? <a href="/signup" className="text-[#33e407] font-medium hover:underline">Sign Up</a>
                    </div>
                </div>
            </div>

            {/* OTP Modal */}
            <OTPModal
                visible={showOTPModal}
                onClose={() => {
                    setShowOTPModal(false);
                }}
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={otpLoading}
                error={otpError}
            />

            {/* Toast notification */}
            <Toast
                message={toastMessage}
                visible={toastVisible}
                onClose={() => setToastVisible(false)}
            />
        </div>
    );
};

export default LoginPage;

