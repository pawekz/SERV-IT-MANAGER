import React, { useState } from 'react';

const PasswordManagement = () => {
    // State for password visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // State for form values
    const [formValues, setFormValues] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Calculate password strength percentage based on length
    const calculatePasswordStrength = () => {
        const passwordLength = formValues.newPassword.length;
        const targetLength = 8;
        const percentage = Math.min((passwordLength / targetLength) * 100, 100);
        return {
            percentage,
            charactersRemaining: Math.max(targetLength - passwordLength, 0)
        };
    };

    // Toggle password visibility functions
    const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
    const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
    
    // Handle form input changes
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormValues({
            ...formValues,
            [id === 'current-password' ? 'currentPassword' : 
              id === 'new-password' ? 'newPassword' : 'confirmPassword']: value
        });
    };
    
    // Handle cancel button click
    const handleCancel = () => {
        setFormValues({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        // Reset visibility states too
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    // Get password strength info
    const { percentage, charactersRemaining } = calculatePasswordStrength();

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

                    <form>
                        <div className="mb-6">
                            <label htmlFor="current-password" className="block mb-2 text-sm font-medium text-gray-600">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    id="current-password"
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                    placeholder="Enter your current password"
                                    required
                                    value={formValues.currentPassword}
                                    onChange={handleInputChange}
                                />
                                <button 
                                    type="button" 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={toggleCurrentPasswordVisibility}
                                >
                                    {showCurrentPassword ? 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg> : 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-600">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="new-password"
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                    placeholder="Enter new password"
                                    required
                                    value={formValues.newPassword}
                                    onChange={handleInputChange}
                                />
                                <button 
                                    type="button" 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={toggleNewPasswordVisibility}
                                >
                                    {showNewPassword ? 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg> : 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                </button>
                            </div>
                            {/* Password strength meter */}
                            {formValues.newPassword.length > 0 ? (
                                <div className="mt-2">
                                    <div className="h-1 bg-gray-200 rounded-sm overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ease-out ${percentage === 100 ? 'bg-[#33e407]' : 'bg-yellow-400'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-start items-center mt-1">
                                        <span className="text-xs text-gray-500">
                                            {charactersRemaining > 0 ? 
                                                `${charactersRemaining} more character${charactersRemaining !== 1 ? 's' : ''} needed` : 
                                                'Minimum length reached'
                                            }
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <span className="text-xs text-gray-500">Password must be at least 8 characters long</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-600">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirm-password"
                                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#33e407] focus:ring-1 focus:ring-[#33e407] transition-colors"
                                    placeholder="Confirm new password"
                                    required
                                    value={formValues.confirmPassword}
                                    onChange={handleInputChange}
                                />
                                <button 
                                    type="button" 
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {showConfirmPassword ? 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg> : 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    }
                                </button>
                            </div>
                        </div>

                        {/*/!* Password Requirements *!/*/}
                        {/*<div className="my-6 bg-gray-50 rounded-lg p-4">*/}
                        {/*    <div className="text-sm font-semibold text-gray-600 mb-3">*/}
                        {/*        Password Requirement*/}
                        {/*    </div>*/}
                        {/*    <ul className="space-y-2">*/}
                        {/*        {[*/}
                        {/*            'At least 8 characters long',*/}
                        {/*            // 'Include at least one uppercase letter',*/}
                        {/*            // 'Include at least one number',*/}
                        {/*            // 'Include at least one special character',*/}
                        {/*            // 'Should not be the same as your previous password'*/}
                        {/*        ].map((requirement, index) => (*/}
                        {/*            <li key={index} className="text-xs text-gray-600 flex items-center">*/}
                        {/*                <span className="w-1.5 h-1.5 bg-[#33e407] rounded-full mr-2"></span>*/}
                        {/*                {requirement}*/}
                        {/*            </li>*/}
                        {/*        ))}*/}
                        {/*    </ul>*/}
                        {/*</div>*/}

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-3 mt-4 sm:flex-row flex-col-reverse">
                            <button
                                type="button"
                                className="px-6 py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors"
                                onClick={handleCancel}
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
                        <a href="/accountinformation" className="text-[#33e407] font-medium hover:underline">
                            &larr; Back to Account Settings
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordManagement;

