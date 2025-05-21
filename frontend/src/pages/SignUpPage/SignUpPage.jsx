import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
    const navigate = useNavigate();
    // State for form inputs
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        phoneNumber: '',
        email: '',
        password: '',
        phoneNumber: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
        
        // Check password validity when password field changes
        if (id === 'password') {
            setIsPasswordValid(passwordRegex.test(value));
        }
    };

    // Add this new function to handle phone number input
    const handlePhoneInput = (e) => {
        const { value } = e.target;
        // Remove non-numeric characters from input
        const numericValue = value.replace(/\D/g, '');
        
        // Format the phone number with spaces (905 123 4567)
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

    // Handle name input - only allow letters
    const handleNameInput = (e) => {
        const { id, value } = e.target;
        // Only accept letters, spaces, hyphens, and apostrophes for names
        // Regex pattern: only letters (including accented), spaces, hyphens, apostrophes
        if (/^[A-Za-zÀ-ÖØ-öø-ÿ\s\-']*$/.test(value) || value === '') {
            setFormData({ ...formData, [id]: value });
        }
    };

    // Calculate password strength percentage
    const getPasswordProgress = () => {
        if (!formData.password) return 0;
        const progress = Math.min(formData.password.length / 8 * 100, 100);
        return progress;
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Basic validation
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

        try {
            const response = await fetch('http://localhost:8080/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            // Check if response has content before parsing JSON
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

            // Registration successful
            setSuccess(true);
            setFormData({
                firstName: '',
                lastName: '',
                username: '',
                phoneNumber: '',
                email: '',
                password: ''
            });
            
            // Redirect to login page after a brief delay
            setTimeout(() => {
                navigate('/login');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen w-full bg-gray-50">
            <div className="w-full max-w-md p-10 bg-white rounded-xl shadow-md relative overflow-hidden">
                {/* Green accent border on the left */}
                <div className="absolute left-0 top-0 w-1 h-full bg-[#33e407]"></div>

                {/* Logo */}
                <div className="text-center mb-2">
                    <div className="text-2xl font-bold text-gray-800 tracking-wide">
                        IO<span className="text-[#33e407]">CONNECT</span>
                    </div>
                </div>

                {/* Form Title */}
                <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                    Create your account
                </h1>

                {/* Success message */}
                {success && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded">
                        Registration successful! You can now log in.
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label
                                htmlFor="firstName"
                                className="block mb-2 text-sm font-medium text-gray-600"
                            >
                                First Name
                            </label>
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
                            <label
                                htmlFor="lastName"
                                className="block mb-2 text-sm font-medium text-gray-600"
                            >
                                Last Name
                            </label>
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
                            htmlFor="email"
                            className="block mb-2 text-sm font-medium text-gray-600"
                        >
                            Email
                        </label>
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
                    {/*this is for the phone number input text box*/}
                    <div className="mb-5">
                        <label
                            htmlFor="phoneNumber"
                            className="block mb-2 text-sm font-medium text-gray-600"
                        >
                            Phone Number
                        </label>
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
                            {/* Password validation icon */}
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
                            {/* Password visibility toggle button */}
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
                        
                        {/* Password progress animation */}
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
                                    <div className={`${/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                                        {/[@$!%*?&]/.test(formData.password) ? '✓' : '✗'} At least one special character (@$!%*?&)
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

                {/* Divider */}
                <div className="flex items-center my-6 text-gray-400 text-sm">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="px-4">OR</div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Google Sign Up Button */}
                {/*<button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">*/}
                {/*    <svg*/}
                {/*        className="w-4 h-4"*/}
                {/*        viewBox="0 0 24 24"*/}
                {/*        xmlns="http://www.w3.org/2000/svg"*/}
                {/*    >*/}
                {/*        <path*/}
                {/*            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"*/}
                {/*            fill="#4285F4"*/}
                {/*        />*/}
                {/*        <path*/}
                {/*            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"*/}
                {/*            fill="#34A853"*/}
                {/*        />*/}
                {/*        <path*/}
                {/*            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"*/}
                {/*            fill="#FBBC05"*/}
                {/*        />*/}
                {/*        <path*/}
                {/*            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"*/}
                {/*            fill="#EA4335"*/}
                {/*        />*/}
                {/*    </svg>*/}
                {/*    Sign up with Google*/}
                {/*</button>*/}

                {/* Login Link */}
                <div className="text-center mt-4 text-sm text-gray-600">
                    Already have an account? <a href="/login" className="text-[#33e407] font-medium hover:underline">Login</a>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;

