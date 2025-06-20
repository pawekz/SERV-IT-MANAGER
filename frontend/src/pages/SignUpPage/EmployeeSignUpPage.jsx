import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner.jsx';
import LoadingModal from "../../components/LoadingModal/LoadingModal.jsx";

// This page is for EMPLOYEE registration. Admin approval is required for activation.
const EmployeeSignUpPage = () => {
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
    const closeToast = () => setToast({ ...toast, show: false });

    // OTP modal state
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputsRef = useRef([]);

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Password regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_+])[A-Za-z\d@$!%*?&#^_+]{8,}$/;

    // Toast effect - auto-hide after 3 seconds
    useEffect(() => {
        let timer;
        if (toast.show) {
            timer = setTimeout(() => {
                closeToast();
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [toast.show]);

    // Cooldown timer effect
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

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
        const progress = Math.min(formData.password.length / 8 * 100, 100);
        return progress;
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
            const response = await fetch('http://localhost:8080/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Registration failed with status: ${response.status}`;
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorMessage;
                    }
                } catch (parseError) {
                    if (responseText) errorMessage = responseText;
                }
                throw new Error(errorMessage);
            }

            setSuccess(true);
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError('');
            setResendCooldown(0);
            setShowOTPModal(true);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
            setSignupProcessing(false); // Stop the loading screen
        }
    };

    // OTP input handlers
    const handleOtpChange = (e, idx) => {
        const value = e.target.value.replace(/\D/, "");
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

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
            inputsRef.current[idx - 1].focus();
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        const otp = otpDigits.join("");

        if (otp.length !== 6) {
            setOtpError('Please enter a valid 6-digit OTP');
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const payload = {
                email: formData.email,
                otp: otp,
                type: 1
            };

            const response = await fetch('http://localhost:8080/user/verifyOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Verification failed (${response.status})`;
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    if (responseText) errorMessage = responseText;
                }
                setOtpError(errorMessage);
                if (response.status === 401 && !errorMessage.includes('Invalid or expired')) {
                    setOtpError('Invalid or expired OTP code. Please try again or request a new one.');
                }
                return;
            }

            setShowOTPModal(false);
            setShowSuccessModal(true);

            setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/login');
            }, 5000);

        } catch (err) {
            setOtpError(err.message || 'OTP verification failed. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendCooldown > 0) return; // Prevent resend if cooldown is active

        setOtpLoading(true);
        setOtpError('');

        try {
            const payload = {
                email: formData.email,
                type: 1
            };

            const response = await fetch('http://localhost:8080/user/resendOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Failed to resend OTP (${response.status})`;
                try {
                    if (responseText) {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    if (responseText) errorMessage = responseText;
                }
                setOtpError(errorMessage);
                if (response.status === 401 && !errorMessage.includes('Invalid request')) {
                    setOtpError('Invalid request. Please try registering again.');
                }
                return;
            }

            setOtpDigits(["", "", "", "", "", ""]);
            showToast('OTP has been resent to your email.');
            setResendCooldown(60); // Set cooldown timer to 60 seconds

            if (inputsRef.current[0]) {
                inputsRef.current[0].focus();
            }

        } catch (err) {
            setOtpError(err.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Effect to log OTP modal state changes
    useEffect(() => {
        if (!showOTPModal) {
            // Optionally reset OTP fields when modal is closed externally, if desired
            // setOtpDigits(["", "", "", "", "", ""]);
            // setOtpError('');
        }
    }, [showOTPModal]);

    return (
        <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
            <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-[#2563eb]"></div>
                <div className="text-center mb-2">
                    <div className="text-2xl font-bold text-gray-800 tracking-wide">
                        IO<span className="text-[#2563eb]">CONNECT</span>
                    </div>
                </div>

                <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    Employee Registration
                </h1>
                {success && !showOTPModal && (
                    <div className="mb-4 p-3 bg-blue-100 border border-blue-200 text-blue-700 rounded">
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
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
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
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
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
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
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
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
                            placeholder="Enter your email"
                            required
                        />
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
                                        (isPasswordValid ? 'border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500')
                                        : 'border-gray-200 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]'
                                }`}
                                placeholder="Create a password"
                                required
                            />
                            {formData.password && (
                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                    {isPasswordValid ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
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
                                        getPasswordProgress() < 40 ? 'bg-blue-300' :
                                        getPasswordProgress() < 80 ? 'bg-blue-400' :
                                        'bg-blue-500'
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
                                    <div className={`${formData.password.length >= 8 ? 'text-blue-600' : 'text-red-600'}`}>• At least 8 characters</div>
                                    <div className={`${/[A-Z]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>• At least one uppercase letter</div>
                                    <div className={`${/[a-z]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>• At least one lowercase letter</div>
                                    <div className={`${/\d/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>• At least one number</div>
                                    <div className={`${/[@$!%*?&#^_+]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>• At least one special character (@$!%*?&#^_+)</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                    Already have an account? <a href="/login" className="text-[#2563eb] font-medium hover:underline">Login</a>
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-xs relative">
                        <button
                            onClick={() => {
                                setShowOTPModal(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                            Email Verification
                        </h2>
                        <p className="text-gray-600 text-sm mb-6 text-center">
                            A 6-digit code has been sent to your email: {formData.email}
                        </p>

                        {otpError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                                {otpError}
                            </div>
                        )}

                        <div className="flex justify-center gap-2 mb-6">
                            {otpDigits.map((digit, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    ref={el => inputsRef.current[idx] = el}
                                    onChange={e => handleOtpChange(e, idx)}
                                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                                    className="w-10 h-12 text-center text-xl border border-gray-300 rounded-md focus:outline-none focus:border-[#33e407] transition-colors"
                                />
                            ))}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleVerifyOTP}
                                disabled={otpLoading || otpDigits.some(d => d === "")}
                                className="w-full bg-[#33e407] text-white rounded py-3 font-medium hover:bg-[#2bc906] transition-colors disabled:bg-gray-300"
                            >
                                {otpLoading ? (
                                    <span className="flex items-center justify-center">
                                        <Spinner size="small" />
                                        <span className="ml-2">Verifying...</span>
                                    </span>
                                ) : "Verify Email"}
                            </button>

                            <button
                                onClick={handleResendOTP}
                                disabled={otpLoading || resendCooldown > 0}
                                className="w-full text-[#33e407] text-sm py-2 hover:underline disabled:text-gray-400 disabled:no-underline"
                            >
                                {resendCooldown > 0 ? `Resend OTP Code (${resendCooldown}s)` : "Resend OTP Code"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-sm relative text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="rounded-full bg-blue-100 p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default EmployeeSignUpPage; 