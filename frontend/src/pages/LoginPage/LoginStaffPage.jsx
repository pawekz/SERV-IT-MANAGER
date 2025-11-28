import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from '../../components/Toast/Toast.jsx';
import LoadingModal from "../../components/LoadingModal/LoadingModal.jsx";
import Spinner from "../../components/Spinner/Spinner.jsx";
import api, { parseJwt } from '../../config/ApiConfig.jsx';

// OTP Modal Component
const OTPModal = ({ visible, onClose, onVerify, onResend, loading, error, cooldown = 0 }) => {
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const inputsRef = useRef([]);

    // Auto-focus next/prev on input, support paste and improved backspace
    const handleChange = (e, idx) => {
        const value = e.target.value.replace(/\D/g, "");
        // If user pastes a full OTP code
        if (value.length === 6 && /^[0-9]{6}$/.test(value)) {
            setOtpDigits(value.split(""));
            inputsRef.current[5]?.focus();
            return;
        }
        if (value.length === 1) {
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = value;
                return arr;
            });
            if (idx < 5) {
                inputsRef.current[idx + 1].focus();
            }
        } else if (!value && idx > 0) {
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = "";
                return arr;
            });
            inputsRef.current[idx - 1].focus();
        }
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === "Backspace") {
            if (otpDigits[idx]) {
                // Clear current digit
                setOtpDigits((prev) => {
                    const arr = [...prev];
                    arr[idx] = "";
                    return arr;
                });
            } else if (idx > 0) {
                // Move focus backward and clear previous digit
                inputsRef.current[idx - 1].focus();
                setOtpDigits((prev) => {
                    const arr = [...prev];
                    arr[idx - 1] = "";
                    return arr;
                });
            }
        }
    };

    const handleVerify = () => {
        const otpValue = otpDigits.join("");
        onVerify(otpValue);
    };

    useEffect(() => {
        if (!visible) {
            setOtpDigits(["", "", "", "", "", ""]); // Reset OTP digits when modal is closed
        } else {
            // Focus the first input when modal becomes visible
            if(inputsRef.current[0]) {
                inputsRef.current[0].focus();
            }
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-xs relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                    onClick={onClose}
                    aria-label="Close OTP modal"
                >
                    &times;
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">Enter OTP</h2>
                <p className="text-gray-600 text-sm mb-4 text-center">
                    A 6-digit code has been sent to your email.
                </p>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}
                <div className="flex justify-center gap-2 mb-4">
                    {otpDigits.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={el => inputsRef.current[idx] = el}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e, idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className="w-10 h-10 text-center text-lg border border-gray-300 rounded-md focus:outline-none focus:border-[#2563eb]"
                            disabled={loading}
                        />
                    ))}
                </div>
                <button
                    onClick={handleVerify}
                    disabled={loading || otpDigits.some(d => d === "")}
                    className="w-full bg-[#2563eb] text-white rounded py-2 font-medium hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300 mb-2"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <Spinner size="small" />
                            <span className="ml-2">Verifying...</span>
                        </span>
                    ) : "Verify"}
                </button>
                <button
                    onClick={onResend}
                    disabled={loading || cooldown > 0}
                    className="w-full text-[#2563eb] text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                    {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
                </button>
            </div>
        </div>
    );
};

// Forgot Password Modal
const ForgotPasswordModal = ({
                                 visible,
                                 onClose,
                                 onSend,
                                 loading,
                                 error,
                                 email,
                                 setEmail
                             }) => {
    if (!visible) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-xs relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                    onClick={onClose}
                    aria-label="Close forgot password modal"
                >
                    &times;
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">Forgot Password</h2>
                <p className="text-gray-600 text-sm mb-4 text-center">
                    Enter your registered email. We will send you a reset OTP.
                </p>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={e => { e.preventDefault(); onSend(); }}>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#2563eb]"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#2563eb] text-white rounded py-2 font-medium hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300"
                        disabled={loading || !email}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <Spinner size="small" />
                                <span className="ml-2">Sending...</span>
                            </span>
                        ) : "Send OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// New Password Modal
const NewPasswordModal = ({
                              visible,
                              onClose,
                              onSubmit,
                              loading,
                              error,
                              password,
                              setPassword,
                              confirmPassword,
                              setConfirmPassword
                          }) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-xs relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
                    onClick={onClose}
                    aria-label="Close new password modal"
                >
                    &times;
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">Set New Password</h2>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}
                <form onSubmit={e => { e.preventDefault(); onSubmit(); }}>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-2 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#2563eb]"
                        placeholder="New password"
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#2563eb]"
                        placeholder="Confirm new password"
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#2563eb] text-white rounded py-2 font-medium hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300"
                        disabled={loading || !password || !confirmPassword}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <Spinner size="small" />
                                <span className="ml-2">Saving...</span>
                            </span>
                        ) : "Save Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isStaffLogin = location.pathname.includes('/login/staff');
    const [activeTab, setActiveTab] = useState(isStaffLogin ? 'staff' : 'customer');
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginProcessing, setLoginProcessing] = useState(false); // New state for loading overlay
    const [showPassword, setShowPassword] = useState(false);

    // OTP modal states (for login/initial verification)
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [userEmail, setUserEmail] = useState(''); // Stores email for OTP verification after login if needed
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const closeToast = () => setToast({ ...toast, show: false });

    // Forgot Password flow states
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState(''); // Email used in forgot password flow
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [showForgotOTPModal, setShowForgotOTPModal] = useState(false);
    const [forgotOTPError, setForgotOTPError] = useState('');
    const [forgotOTPLoading, setForgotOTPLoading] = useState(false);
    const [forgotResendCooldown, setForgotResendCooldown] = useState(0);
    const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPasswordLoading, setNewPasswordLoading] = useState(false);
    const [newPasswordError, setNewPasswordError] = useState('');

    // Prevent global 401 handler from reloading page in case of failed login attempts
    useEffect(() => {
        const suppressGlobalTokenRedirect = (event) => {
            event.stopImmediatePropagation();
            if (typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
        };
        window.addEventListener('tokenExpired', suppressGlobalTokenRedirect, true);
        return () => window.removeEventListener('tokenExpired', suppressGlobalTokenRedirect, true);
    }, []);

    // Cooldown effects for account verification OTP resend
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Cooldown effects for forgot password OTP resend
    useEffect(() => {
        let timer;
        if (forgotResendCooldown > 0) {
            timer = setTimeout(() => {
                setForgotResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [forgotResendCooldown]);

    // Handle input changes for login form
    const handleLoginChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleGoBack = () => {
        navigate('/');
    };

    // Handle tab switching
    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setError(''); // Clear any existing errors when switching tabs
        
        // Navigate to the appropriate URL based on the selected tab
        if (tab === 'staff') {
            navigate('/login/staff');
        } else {
            navigate('/login');
        }
    };

    // Request OTP for account verification (after login if not verified)
    const requestAccountVerificationOTP = async (emailForOTP) => {
        setOtpLoading(true);
        try {
            await api.post(`/user/resendOtp`, {
                email: emailForOTP,
                type: 1
            });
            showToast('Verification code sent to your email.');
            setResendCooldown(60);
            setOtpLoading(false);
            return true;
        } catch (err) {
            let errorMessage = 'Failed to send verification code.';
            if (err.response && err.response.data) {
                errorMessage = err.response.data.message || err.response.data.error || errorMessage;
            } else if (err.message) {
                errorMessage = err.message;
            }
            showToast(errorMessage);
            setOtpLoading(false);
            return false;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setLoginProcessing(true);
        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            setLoading(false);
            setLoginProcessing(false);
            return;
        }
        try {
            const response = await api.post('/auth/login/staff', {
                identifier: formData.username,
                password: formData.password,
            });
            const data = response.data;
            if (!data || !data.token) {
                setError('Login failed. Please try again.');
                setLoading(false);
                return;
            }
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            const tokenData = parseJwt(data.token);
            const resolvedUserEmail = data.email || tokenData.email || tokenData.sub;
            setUserEmail(resolvedUserEmail);
            localStorage.setItem('userEmail', resolvedUserEmail);
            if (data.isVerified === false) {
                // Do NOT request OTP here; just show modal
                setShowOTPModal(true);
                setLoginProcessing(false);
            } else if (data.status === "Inactive") {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                setError('Your account is inactive. Please contact support.');
                setLoginProcessing(false);
            } else {
                navigate('/dashboard');
                setLoginProcessing(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
            setLoginProcessing(false);
        } finally {
            setLoading(false);
        }
    };

    // OTP verification for account (login/registration)
    const handleVerifyOTP = async (otpValue) => {
        setOtpLoading(true);
        setOtpError('');
        try {
            const emailForVerification = userEmail || localStorage.getItem('userEmail');
            if (!emailForVerification) {
                setOtpError('No email found for OTP verification. Please login again.');
                setOtpLoading(false);
                return;
            }
            const response = await api.post('/user/verifyOtp', {
                email: emailForVerification,
                otp: otpValue,
                type: 1
            });
            setShowOTPModal(false);
            showToast('Account verified successfully. Please login to continue.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            navigate('/login/staff');
        } catch (err) {
            setOtpError(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP for account verification with cooldown
    const handleResendAccountOTP = async () => {
        if (resendCooldown > 0) return; // Prevent resend if cooldown is active

        setOtpLoading(true);
        setOtpError('');
        try {
            const emailForResend = userEmail || localStorage.getItem('userEmail');
            if (!emailForResend) {
                setOtpError('No email found for OTP resend. Please login again.');
                setOtpLoading(false);
                return;
            }

            await api.post(`/user/resendOtp`, {
                email: emailForResend,
                type: 1  // Type 1 for account verification
            });

            showToast('A new verification code has been sent to your email.');
            setResendCooldown(60); // Set 60 seconds cooldown
        } catch (err) {
            let errorMessage = err.message || 'Failed to resend OTP';
            if (err.response && err.response.data) {
                errorMessage = err.response.data.message || err.response.data.error || errorMessage;
            }
            setOtpError(errorMessage);
        } finally {
            setOtpLoading(false);
        }
    };

    // FORGOT PASSWORD FLOW
    const handleForgotPasswordRequest = async () => {
        setForgotError('');
        setForgotLoading(true);
        try {
            await api.post(`/user/forgotPassword`, { email: forgotEmail });
            setShowForgotModal(false);
            setShowForgotOTPModal(true); // Show OTP modal for forgot password
            showToast('OTP sent to your email for password reset.');
            setForgotResendCooldown(60); // Set cooldown for forgot password flow
        } catch (err) {
            let msg;
            if (err.response) {
                if (err.response.status === 404) {
                    msg = 'Email not found. Please check and try again.';
                } else if (err.response.data) {
                    msg = err.response.data.message || err.response.data.error;
                }
            }
            if (!msg) msg = err.message || 'Failed to send OTP.';
            setForgotError(msg);
            showToast(msg, 'error');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyForgotOTP = async (otpValue) => {
        setForgotOTPLoading(true);
        setForgotOTPError('');
        try {
            await api.post(`/user/verifyOtp`, { email: forgotEmail, otp: otpValue, type: 2 }); // Type 2 for password reset OTP verification
            setShowForgotOTPModal(false);
            setShowNewPasswordModal(true); // Proceed to set new password
        } catch (err) {
            let msg = err.message || 'OTP verification failed. Please try again.';
            if (err.response && err.response.data) {
                msg = err.response.data.message || err.response.data.error || msg;
            }
            setForgotOTPError(msg);
        } finally {
            setForgotOTPLoading(false);
        }
    };

    // Resend forgot password OTP with cooldown
    const handleResendForgotOTP = async () => {
        if (forgotResendCooldown > 0) return; // Prevent resend if cooldown is active

        setForgotOTPLoading(true);
        setForgotOTPError('');
        try {
            if (!forgotEmail) {
                setForgotOTPError('Email is required to resend OTP.');
                showToast('Email is required to resend OTP.', 'error');
                setForgotOTPLoading(false);
                return;
            }

            await api.post(`/user/resendOtp`, {
                email: forgotEmail,
                type: 2 // Type 2 for password reset OTP resend
            });
            showToast('A new OTP has been sent to your email.');
            setForgotResendCooldown(60); // Set 60 seconds cooldown
        } catch (err) {
            let errorMessage;
            if (err.response) {
                if (err.response.status === 404) {
                    errorMessage = 'Email not found. Please check and try again.';
                } else if (err.response.data) {
                    errorMessage = err.response.data.message || err.response.data.error;
                }
            }
            if (!errorMessage) errorMessage = err.message || 'Failed to resend OTP. Please try again.';
            setForgotOTPError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setForgotOTPLoading(false);
        }
    };

    const handleSaveNewPassword = async () => {
        setNewPasswordError('');
        if (!newPassword || !confirmPassword) {
            setNewPasswordError("Please enter and confirm your new password.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setNewPasswordError("Passwords do not match.");
            return;
        }
        setNewPasswordLoading(true);
        try {
            await api.post(`/user/resetPassword`, { email: forgotEmail, newPassword: newPassword });
            setShowNewPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setForgotEmail(''); // Clear forgotEmail after successful password reset
            showToast('Password has been reset successfully. You may now log in.');
        } catch (err) {
            let msg;
            if (err.response) {
                if (err.response.status === 404) {
                    msg = 'Email not found or reset link expired.';
                } else if (err.response.data) {
                    msg = err.response.data.message || err.response.data.error;
                }
            }
            if (!msg) msg = err.message || 'Failed to reset password. Please try again.';
            setNewPasswordError(msg);
            showToast(msg, 'error');
        } finally {
            setNewPasswordLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md flex flex-col gap-4">
                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        ← Go Back
                    </button>
                </div>
                <div className="w-full bg-white rounded-xl shadow-2xl relative overflow-hidden">
                {/* Tab Buttons */}
                <div className="flex">
                    <button
                        onClick={() => handleTabSwitch('customer')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeTab === 'customer'
                                ? 'bg-white text-gray-800 border-b-2 border-[#2563eb]'
                                : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Customer Login
                    </button>
                    <button
                        onClick={() => handleTabSwitch('staff')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeTab === 'staff'
                                ? 'bg-white text-gray-800 border-b-2 border-[#2563eb]'
                                : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Staff Login
                    </button>
                </div>
                <div className="absolute left-0 top-0 w-1.5 h-full bg-[#2563eb]"></div> {/* Accent line */}
                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="text-3xl font-bold text-gray-800">
                            IO<span className="text-[#33e407]">CONNECT</span>
                        </div>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-700 mb-6 text-center">
                        Login to your account
                    </h1>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin}>
                        <div className="mb-5">
                            <label
                                htmlFor="username"
                                className="block mb-2 text-sm font-medium text-gray-600"
                            >
                                Username or Email
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={formData.username}
                                onChange={handleLoginChange}
                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                                placeholder="Enter your username or email"
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
                                    onChange={handleLoginChange}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-[#2563eb]"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <Spinner size="small" />
                                    <span className="ml-2">Logging in...</span>
                                </span>
                            ) : 'Login'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setForgotError('');
                                setForgotEmail('');
                                setShowForgotModal(true);
                                setShowForgotOTPModal(false);
                                setShowNewPasswordModal(false);
                            }}
                            className="block w-full text-center mt-4 text-sm font-medium text-[#2563eb] hover:underline bg-transparent border-none p-0"
                        >
                            Forgot password?
                        </button>
                    </form>
                    <div className="flex items-center my-6 text-gray-400 text-sm">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="px-4">OR</div>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <div className="text-center mt-4 text-sm text-gray-600">
                        Don't have an account? <a href="/signup" className="text-[#2563eb] font-medium hover:underline">Sign Up</a>
                    </div>
                </div>
                </div>
            </div>

            {/* OTP Modal for account verification (after login) */}
            <OTPModal
                visible={showOTPModal}
                onClose={() => setShowOTPModal(false)}
                onVerify={handleVerifyOTP}
                onResend={() => requestAccountVerificationOTP(userEmail)}
                loading={otpLoading}
                error={otpError}
                cooldown={resendCooldown}
            />

            {/* Forgot Password: Enter Email Modal */}
            <ForgotPasswordModal
                visible={showForgotModal}
                onClose={() => {
                    setShowForgotModal(false);
                    setForgotError('');
                }}
                onSend={handleForgotPasswordRequest}
                loading={forgotLoading}
                error={forgotError}
                email={forgotEmail}
                setEmail={setForgotEmail}
            />

            {/* Forgot Password: Enter OTP Modal (uses generic OTPModal) */}
            <OTPModal
                visible={showForgotOTPModal}
                onClose={() => {
                    setShowForgotOTPModal(false);
                    setForgotOTPError('');
                }}
                onVerify={handleVerifyForgotOTP}
                onResend={handleResendForgotOTP}
                loading={forgotOTPLoading}
                error={forgotOTPError}
                cooldown={forgotResendCooldown}
            />

            {/* Forgot Password: New Password Modal */}
            <NewPasswordModal
                visible={showNewPasswordModal}
                onClose={() => {
                    setShowNewPasswordModal(false);
                    setNewPasswordError('');
                }}
                onSubmit={handleSaveNewPassword}
                loading={newPasswordLoading}
                error={newPasswordError}
                password={newPassword}
                setPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
            />

            {/* Toast notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* Full-screen Loading Overlay */}
            {loginProcessing && (
                <LoadingModal
                    show={loading}
                    title="Logging In"
                    message="Please wait while we log you in..."
                />
            )}
        </div>
    );
};
//
export default LoginPage;

