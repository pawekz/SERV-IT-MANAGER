import React from 'react';

const PasswordManagement = () => {
    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center px-5 py-10">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-md relative overflow-hidden my-10">
                {/* Green accent border on the left */}
                <div className="absolute left-0 top-0 w-1 h-full bg-[#33e407]"></div>

                <div className="p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="text-2xl font-bold text-gray-800 tracking-wide">
                            IO<span className="text-[#33e407]">CONNECT</span>
                        </div>
                    </div>

                    {/* Page Title & Subtitle */}
                    <h1 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                        Change Your Password
                    </h1>
                    <p className="text-sm text-gray-500 mb-8 text-center">
                        Create a strong password to protect your account
                    </p>

                    {/* This is where the messages Success Message or error message and it will display based on the state of the password change process. */}
                    {/* Error message (hidden by default) */}

                    {/* Success message (hidden by default) */}

                    {/* <div className="hidden bg-green-50 text-green-700 border border-green-100 rounded-md p-3 mb-6 flex items-center">
                        <span className="mr-3 text-lg">✓</span>
                        Password changed successfully!
                    </div>

                    <div className="hidden bg-red-50 text-red-600 border border-red-100 rounded-md p-3 mb-6 flex items-center">
                        <span className="mr-3 text-lg">✕</span>
                        Current password is incorrect. Please try again.
                    </div> */}

                    <form>
                        <div className="mb-6">
                            <label htmlFor="current-password" className="block mb-2 text-sm font-medium text-gray-600">
                                Current Password
                            </label>
                            <input
                                type="password"
                                id="current-password"
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                placeholder="Enter your current password"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-600">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                placeholder="Enter new password"
                                required
                            />
                            {/* Password strength meter */}
                            <div className="mt-2 h-1 bg-gray-200 rounded-sm overflow-hidden">
                                <div className="h-full w-2/3 bg-yellow-400 transition-all duration-300"></div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-600">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirm-password"
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="my-6 bg-gray-50 rounded-lg p-4">
                            <div className="text-sm font-semibold text-gray-600 mb-3">
                                Password Requirements
                            </div>
                            <ul className="space-y-2">
                                {[
                                    'At least 8 characters long',
                                    'Include at least one uppercase letter',
                                    'Include at least one number',
                                    'Include at least one special character',
                                    'Should not be the same as your previous password'
                                ].map((requirement, index) => (
                                    <li key={index} className="text-xs text-gray-600 flex items-center">
                                        <span className="w-1.5 h-1.5 bg-[#33e407] rounded-full mr-2"></span>
                                        {requirement}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3 mt-4 sm:flex-row flex-col-reverse">
                            <button
                                type="button"
                                className="px-6 py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-[#33e407] text-white rounded-md font-medium text-sm hover:bg-[#2bc906] transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                    </form>

                    {/* Back link */}
                    <div className="text-center mt-6 text-sm text-gray-600">
                        <a href="account.html" className="text-[#33e407] font-medium hover:underline">
                            &larr; Back to Account Settings
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordManagement;