import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/Toast/Toast.jsx';
import Spinner from '../../components/Spinner/Spinner.jsx';
import api from '../../config/ApiConfig.jsx';

// Employee Onboarding Page – accessed via emailed link.
const EmployeeSignUpPage = () => {
    const navigate = useNavigate();
    // Step control: 1 = verify code, 2 = set password
    const [step, setStep] = useState(1);

    // Step 1 fields
    const [email, setEmail] = useState('');
    const [onboardingCode, setOnboardingCode] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeLoading, setCodeLoading] = useState(false);

    // Step 2 fields
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const closeToast = () => setToast({ ...toast, show: false });

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
    const [resendCooldown, setResendCooldown] = useState(0);
    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Password change handler (step 2)
    const handlePasswordChange = (e) => {
        const { value } = e.target;
        setPassword(value);
        setIsPasswordValid(passwordRegex.test(value));
    };

    /* Step 1: Verify onboarding code */
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setCodeError('');
        setCodeLoading(true);
        try {
            await api.post('/user/verifyOnboardingCode', { email, onboardingCode });
            setStep(2);
        } catch (err) {
            setCodeError(err.response?.data || err.message || 'Code verification failed.');
        } finally {
            setCodeLoading(false);
        }
    };

    /* Step 2: Set password */
    const handleCompleteOnboarding = async (e) => {
        e.preventDefault();
        setPwError('');
        if (!password || !confirmPassword) {
            setPwError('Please enter and confirm your password');
            return;
        }
        if (password !== confirmPassword) {
            setPwError('Passwords do not match');
            return;
        }
        if (!isPasswordValid) {
            setPwError('Password does not meet requirements');
            return;
        }
        setPwLoading(true);
        try {
            const response = await fetch(`${window.__API_BASE__}/user/completeOnboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, onboardingCode, password }),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to complete onboarding';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch {}
                setPwError(errorMessage);
                setPwLoading(false);
                return;
            }
            showToast('Account activated! Redirecting to login...', 'success');
            setTimeout(() => navigate('/login/staff'), 3000);
        } catch (err) {
            setPwError('Network error. Please try again later.');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
            <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-[#2563eb]"></div>
                <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-gray-800 tracking-wide">
                        IO<span className="text-[#2563eb]">CONNECT</span>
                    </div>
                </div>

                {step === 1 && (
                    <>
                        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">Employee Onboarding</h1>
                        {codeError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                                {codeError}
                            </div>
                        )}
                        <form onSubmit={handleVerifyCode}>
                            <div className="mb-5">
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-600">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
                                    placeholder="Enter your registered email"
                                    required
                                />
                            </div>
                            <div className="mb-5">
                                <label htmlFor="code" className="block mb-2 text-sm font-medium text-gray-600">Onboarding Code</label>
                                <input
                                    type="text"
                                    id="code"
                                    maxLength={6}
                                    value={onboardingCode}
                                    onChange={e => setOnboardingCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
                                    placeholder="Ex: 123456"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={codeLoading}
                                className="w-full mt-4 px-4 py-3 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {codeLoading ? (
                                    <span className="flex items-center justify-center">
                                        <Spinner size="small" />
                                        <span className="ml-2">Verifying...</span>
                                    </span>
                                ) : 'Verify Code'}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">Set Your Password</h1>
                        {pwError && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
                                {pwError}
                            </div>
                        )}
                        <form onSubmit={handleCompleteOnboarding}>
                            <div className="mb-5">
                                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-600">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-3 text-sm border rounded-md focus:outline-none transition-colors ${
                                            password ?
                                                (isPasswordValid ? 'border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500')
                                                : 'border-gray-200 focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]'
                                        }`}
                                        placeholder="Create a password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-5">
                                <label htmlFor="confirm" className="block mb-2 text-sm font-medium text-gray-600">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirm"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-colors"
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={pwLoading}
                                className="w-full mt-4 px-4 py-3 text-sm font-medium text-white bg-[#33e407] rounded-md hover:bg-[#2bc906] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {pwLoading ? (
                                    <span className="flex items-center justify-center">
                                        <Spinner size="small" />
                                        <span className="ml-2">Saving...</span>
                                    </span>
                                ) : 'Activate Account'}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Toast notification */}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />
        </div>
    );
};

export default EmployeeSignUpPage;
