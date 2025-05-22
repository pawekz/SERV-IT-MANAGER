import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const [success, setSuccess] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // OTP modal state
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const inputsRef = useRef([]);

    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Password regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_+])[A-Za-z\d@$!%*?&#^_+]{8,}$/;

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

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phoneNumber || !formData.username) {
            setError('All fields are required');
            setLoading(false);
            return;
        }
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
            setLoading(false);
            return;
        }

        const formattedPhoneNumber = formData.phoneNumber.replace(/\s/g, '');
        const requestData = { ...formData, phoneNumber: formattedPhoneNumber };

        try {
            const response = await fetch('http://localhost:8080/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData),
            });

            const contentType = response.headers.get("content-type");
            let data = null;
            if (contentType && contentType.includes("application/json") && response.status !== 204) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.warn("Response couldn't be parsed as JSON:", parseError);
                }
            }

            if (!response.ok) {
                throw new Error(data?.message || `Registration failed with status: ${response.status}`);
            }

            setSuccess(true);
            // Reset OTP digits and show OTP modal
            setOtpDigits(["", "", "", "", "", ""]);
            setOtpError('');
            setShowOTPModal(true);

        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
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
            const response = await fetch('http://localhost:8080/user/verifyOtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otp
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (response.status === 401) {
                    throw new Error('OTP code is expired or invalid. Please try again or request a new code.');
                } else {
                    throw new Error(errorData?.message || `Verification failed: ${response.status}`);
                }
            }

            // Show success modal instead of immediately navigating
            setShowOTPModal(false);
            setShowSuccessModal(true);

            // Redirect after 3 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
                navigate('/login');
            }, 3000);

        } catch (err) {
            setOtpError(err.message || 'OTP verification failed. Please try again.');
            console.error("OTP verification error:", err);
        } finally {
            setOtpLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setOtpLoading(true);
        setOtpError('');

        try {
            const response = await fetch(`http://localhost:8080/user/resendOtp?email=${encodeURIComponent(formData.email)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Failed to resend OTP: ${response.status}`);
            }

            alert('OTP has been resent to your email.');
        } catch (err) {
            setOtpError(err.message || 'Failed to resend OTP. Please try again.');
            console.error("Resend OTP error:", err);
        } finally {
            setOtpLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
            <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-[#33e407]"></div>
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
                        Registration successful! Please verify OTP.
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
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
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
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
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
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
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
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="mb-5">
                        <label htmlFor="phoneNumber" className="block mb-2 text-sm font-medium text-gray-600">Phone Number</label>
                        <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#33e407] focus-within:ring-1 focus-within:ring-[#33e407] transition-colors overflow-hidden">
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
                                        isPasswordValid ?
                                            'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500' :
                                            'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                        : 'border-gray-200 focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407]'
                                }`}
                                placeholder="Create a password"
                                required
                            />
                            {formData.password && (
                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                    {isPasswordValid ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ease-out ${
                                        isPasswordValid ? 'bg-green-500' : 'bg-amber-500'
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
                                        {formData.password.length >= 8 ? '✓' : '✗'} At least 8 characters
                                    </div>
                                    <div className={`${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        {/[A-Z]/.test(formData.password) ? '✓' : '✗'} At least one uppercase letter
                                    </div>
                                    <div className={`${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        {/[a-z]/.test(formData.password) ? '✓' : '✗'} At least one lowercase letter
                                    </div>
                                    <div className={`${/\d/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        {/\d/.test(formData.password) ? '✓' : '✗'} At least one number
                                    </div>
                                    <div className={`${/[@$!%*?&#^_+]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        {/[@$!%*?&#^_+]/.test(formData.password) ? '✓' : '✗'} At least one special character (@$!%*?&#^_+)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#33e407] rounded-md hover:bg-[#2bc906] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
                <div className="flex items-center my-6 text-gray-400 text-sm">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="px-4">OR</div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="text-center mt-4 text-sm text-gray-600">
                    Already have an account? <a href="/login" className="text-[#33e407] font-medium hover:underline">Login</a>
                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-xs relative">
                        <button
                            onClick={() => setShowOTPModal(false)}
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
                                {otpLoading ? "Verifying..." : "Verify Email"}
                            </button>

                            <button
                                onClick={handleResendOTP}
                                disabled={otpLoading}
                                className="w-full text-[#33e407] text-sm py-2 hover:underline"
                            >
                                Resend OTP Code
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
                            <div className="w-8 h-8 border-t-2 border-b-2 border-[#33e407] rounded-full animate-spin"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
//FF
export default SignUpPage;