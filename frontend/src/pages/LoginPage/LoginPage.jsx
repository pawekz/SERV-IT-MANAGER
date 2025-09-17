import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Toast from '../../components/Toast/Toast.jsx';
import LoadingModal from "../../components/LoadingModal/LoadingModal.jsx";
import Spinner from "../../components/Spinner/Spinner.jsx";
import api, { parseJwt } from '../../config/ApiConfig';

// OTP Modal Component
const OTPModal = ({ visible, onClose, onVerify, onResend, loading, error, cooldown = 0 }) => {
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const inputsRef = useRef([]);

    // Auto-focus next/prev on input
    const handleChange = (e, idx) => {
        const value = e.target.value.replace(/\D/, "");
        if (!value && idx > 0) { // If value is deleted and not the first input
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = "";
                return arr;
            });
            inputsRef.current[idx - 1].focus();
            return;
        }
        if (value) { // If a digit is entered
            setOtpDigits((prev) => {
                const arr = [...prev];
                arr[idx] = value;
                return arr;
            });
            if (idx < 5) { // If not the last input, focus next
                inputsRef.current[idx + 1].focus();
            }
        } else { // If value is deleted (e.g. backspace on an already filled input)
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
                            className="w-10 h-10 text-center text-lg border border-gray-300 rounded-md focus:outline-none focus:border-[#25D482]"
                            disabled={loading}
                        />
                    ))}
                </div>
                <button
                    onClick={handleVerify}
                    disabled={loading || otpDigits.some(d => d === "")}
                    className="w-full bg-[#25D482] text-white rounded py-2 font-medium hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300 mb-2"
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
                    className="w-full text-[#25D482] text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
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
                        className="w-full px-4 py-2 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#25D482]"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#25D482] text-white rounded py-2 font-medium hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300"
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
                        className="w-full px-4 py-2 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#25D482]"
                        placeholder="New password"
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 mb-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#25D482]"
                        placeholder="Confirm new password"
                        required
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="w-full bg-[#25D482] text-white rounded py-2 font-medium hover:bg-[#1fab6b] transition-colors disabled:bg-gray-300"
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
            await api.post('/user/resendOtp', {
                email: emailForOTP,
                type: 1
            });
            showToast('Verification code sent to your email.');
            setResendCooldown(60);
            setOtpLoading(false);
            return true;
        } catch (err) {
            showToast(err.response?.data?.message || err.message || 'Failed to send verification code. Please try again.');
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
            const loginEndpoint = activeTab === 'staff' ? '/auth/login/staff' : '/auth/login';
            const response = await api.post(loginEndpoint, {
                identifier: formData.username,
                password: formData.password,
            });
            const data = response.data;
            if (!data || !data.token) {
                throw new Error('No response from server or token missing');
            }
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.role);
            const tokenData = parseJwt(data.token);
            const resolvedUserEmail = data.email || tokenData.email || tokenData.sub;
            if (!resolvedUserEmail) {
                console.error("Email could not be resolved from token or login response.");
                throw new Error("Login failed: User email not found.");
            }
            setUserEmail(resolvedUserEmail);
            localStorage.setItem('userEmail', resolvedUserEmail);
            if (data.isVerified === false) {
                const otpRequested = await requestAccountVerificationOTP(resolvedUserEmail);
                if (otpRequested) {
                    setLoginProcessing(false);
                    setShowOTPModal(true);
                } else {
                    setError("Login successful, but failed to send verification OTP. Please try resending OTP.");
                    setLoginProcessing(false);
                }
            }
            if(data.status === "Inactive"){
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                setError("Your account is inactive. Please contact support.");
            }else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
            setLoginProcessing(false);
        } finally {
            setLoading(false);
        }
    };

    // OTP verification for account (login/registration)
    const handleVerifyAccountOTP = async (otp) => {
        setOtpLoading(true);
        setOtpError('');
        try {
            const emailForVerification = userEmail || localStorage.getItem('userEmail');
            if (!emailForVerification) {
                throw new Error('No email found for OTP verification. Please login again.');
            }
            const requestBody = {
                email: emailForVerification,
                otp: otp,
                type: 1
            };
            const response = await api.post('/user/verifyOtp', requestBody);
            const responseData = response.data;
            if (responseData.token) {
                localStorage.setItem('authToken', responseData.token);
            }
            setShowOTPModal(false);
            showToast('Account verified successfully. Please login to continue.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            navigate('/login');
        } catch (err) {
            setOtpError(err.response?.data?.message || err.message || 'OTP verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP for account verification with cooldown
    const handleResendAccountOTP = async () => {
        if (resendCooldown > 0) return;
        setOtpLoading(true);
        setOtpError('');
        try {
            const emailForResend = userEmail || localStorage.getItem('userEmail');
            if (!emailForResend) {
                throw new Error('No email found for OTP resend. Please login again.');
            }
            await api.post('/user/resendOtp', {
                email: emailForResend,
                type: 1
            });
            showToast('A new verification code has been sent to your email.');
            setResendCooldown(60);
        } catch (err) {
            setOtpError(err.response?.data?.message || err.message || 'Failed to resend OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    // FORGOT PASSWORD FLOW
    const handleForgotPasswordRequest = async () => {
        setForgotError('');
        setForgotLoading(true);
        try {
            await api.post('/user/forgotPassword', { email: forgotEmail });
            setShowForgotModal(false);
            setShowForgotOTPModal(true);
            showToast('OTP sent to your email for password reset.');
            setForgotResendCooldown(60);
        } catch (err) {
            setForgotError(err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleVerifyForgotOTP = async (otpValue) => {
        setForgotOTPLoading(true);
        setForgotOTPError('');
        try {
            await api.post('/user/verifyOtp', { email: forgotEmail, otp: otpValue, type: 2 });
            setShowForgotOTPModal(false);
            setShowNewPasswordModal(true);
        } catch (err) {
            setForgotOTPError(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.');
        } finally {
            setForgotOTPLoading(false);
        }
    };

    // Resend forgot password OTP with cooldown
    const handleResendForgotOTP = async () => {
        if (forgotResendCooldown > 0) return;
        setForgotOTPLoading(true);
        setForgotOTPError('');
        try {
            if (!forgotEmail) {
                setForgotOTPError('Email is required to resend OTP.');
                showToast('Email is required to resend OTP.');
                setForgotOTPLoading(false);
                return;
            }
            await api.post('/user/resendOtp', {
                email: forgotEmail,
                type: 2
            });
            showToast('A new OTP has been sent to your email.');
            setForgotResendCooldown(60);
        } catch (err) {
            setForgotOTPError(err.response?.data?.message || err.message || 'Failed to resend OTP. Please try again.');
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
            await api.post('/user/resetPassword', { email: forgotEmail, newPassword });
            setShowNewPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
            setForgotEmail('');
            showToast('Password has been reset successfully. You may now log in.');
        } catch (err) {
            setNewPasswordError(err.response?.data?.message || err.message || 'Failed to reset password. Please try again.');
        } finally {
            setNewPasswordLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative overflow-hidden">
                {/* Tab Buttons */}
                <div className="flex">
                    <button
                        onClick={() => handleTabSwitch('customer')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                            activeTab === 'customer'
                                ? 'bg-white text-gray-800 border-b-2 border-[#25D482]'
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
                <div className={`absolute left-0 top-0 w-1.5 h-full ${activeTab === 'customer' ? 'bg-[#25D482]' : 'bg-[#2563eb]'}`}></div> {/* Dynamic accent line */}
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
                                className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 ${
                                    activeTab === 'customer' 
                                        ? 'focus:border-[#25D482] focus:ring-[#25D482]' 
                                        : 'focus:border-[#2563eb] focus:ring-[#2563eb]'
                                }`}
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
                                    className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 ${
                                        activeTab === 'customer' 
                                            ? 'focus:border-[#25D482] focus:ring-[#25D482]' 
                                            : 'focus:border-[#2563eb] focus:ring-[#2563eb]'
                                    }`}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className={`absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 ${
                                        activeTab === 'customer' ? 'hover:text-[#25D482]' : 'hover:text-[#2563eb]'
                                    }`}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full mt-6 px-4 py-3 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                                activeTab === 'customer' 
                                    ? 'bg-[#25D482] hover:bg-[#1fab6b] focus:ring-[#25D482]' 
                                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] focus:ring-[#2563eb]'
                            }`}
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
                            className={`block w-full text-center mt-4 text-sm font-medium hover:underline bg-transparent border-none p-0 ${
                                activeTab === 'customer' ? 'text-[#25D482]' : 'text-[#2563eb]'
                            }`}
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
                        Don't have an account? <a href="/signup" className={`font-medium hover:underline ${activeTab === 'customer' ? 'text-[#25D482]' : 'text-[#2563eb]'}`}>Sign Up</a>
                    </div>
                </div>
            </div>

            {/* OTP Modal for account verification (after login) */}
            <OTPModal
                visible={showOTPModal}
                onClose={() => {
                    setShowOTPModal(false);
                    setOtpError(''); // Clear error when closing
                }}
                onVerify={handleVerifyAccountOTP}
                onResend={handleResendAccountOTP}
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

