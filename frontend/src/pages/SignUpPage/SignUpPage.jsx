import React from 'react';

const SignUpPage = () => {
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

                {/* Signup Form */}
                <form>
                    <div className="mb-5">
                        <label
                            htmlFor="fullname"
                            className="block mb-2 text-sm font-medium text-gray-600"
                        >
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullname"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                            placeholder="Enter your full name"
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
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                            placeholder="Enter your email"
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
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                            placeholder="Create a password"
                            required
                        />
                        <div className="text-xs text-gray-400 mt-1.5">
                            Password must be at least 8 characters long
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-6 px-4 py-3 text-sm font-medium text-white bg-[#33e407] rounded-md hover:bg-[#2bc906] transition-colors"
                    >
                        Sign Up
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-6 text-gray-400 text-sm">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="px-4">OR</div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Google Sign Up Button */}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Sign up with Google
                </button>

                {/* Login Link */}
                <div className="text-center mt-4 text-sm text-gray-600">
                    Already have an account? <a href="index.html" className="text-[#33e407] font-medium hover:underline">Sign in</a>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;