import React, { useState } from 'react';
import api from '../../config/ApiConfig.jsx';

const ChangePasswordModal = ({ onClose }) => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formValues, setFormValues] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const calculatePasswordStrength = () => {
        const passwordLength = formValues.newPassword.length;
        const targetLength = 8;
        const percentage = Math.min((passwordLength / targetLength) * 100, 100);
        return {
            percentage,
            charactersRemaining: Math.max(targetLength - passwordLength, 0)
        };
    };

    const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
    const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormValues({
            ...formValues,
            [id === 'current-password' ? 'currentPassword' : id === 'new-password' ? 'newPassword' : 'confirmPassword']: value
        });
    };

    const handleCancel = () => {
        setFormValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false);
        setError(null); setSuccess(null);
        if (onClose) onClose();
    };

    const validateForm = () => {
        if (!formValues.currentPassword) {
            setError("Current password is required");
            return false;
        }
        if (formValues.newPassword.length < 8) {
            setError("New password must be at least 8 characters long");
            return false;
        }
        if (formValues.newPassword !== formValues.confirmPassword) {
            setError("New passwords don't match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); setSuccess(null);
        if (!validateForm()) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("You must be logged in to change your password");
            return;
        }

        setIsLoading(true);
        try {
            await api.patch('/user/changeCurrentUserPassword', {
                currentPassword: formValues.currentPassword,
                newPassword: formValues.newPassword
            });
            setSuccess("Password changed successfully!");
            setFormValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
            localStorage.removeItem('authToken');
            setTimeout(() => {
                // redirect to login
                window.location.href = '/login';
            }, 1200);
        } catch (err) {
            let errorMessage = "An error occurred while changing your password";
            if (err.response && err.response.data) {
                errorMessage = err.response.data.message || err.response.data.error || errorMessage;
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const { percentage, charactersRemaining } = calculatePasswordStrength();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-md relative overflow-hidden my-6">
                <div className="absolute left-0 top-0 w-1 h-full bg-[#33e407]"></div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Change Your Password</h2>
                        <button onClick={handleCancel} className="text-gray-500" aria-label="Close" title="Close">×</button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm">
                            <p className="flex items-center">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-600 rounded-md text-sm">
                            <p className="flex items-center">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="current-password" className="block mb-2 text-sm font-medium text-gray-600">Current Password</label>
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
                                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={toggleCurrentPasswordVisibility}>
                                    {showCurrentPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="new-password" className="block mb-2 text-sm font-medium text-gray-600">New Password</label>
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
                                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={toggleNewPasswordVisibility}>{showNewPassword ? 'Hide' : 'Show'}</button>
                            </div>

                            {formValues.newPassword.length > 0 ? (
                                <div className="mt-2">
                                    <div className="h-1 bg-gray-200 rounded-sm overflow-hidden">
                                        <div className={`h-full transition-all duration-500 ease-out ${percentage === 100 ? 'bg-[#33e407]' : 'bg-yellow-400'}`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <div className="flex justify-start items-center mt-1">
                                        <span className="text-xs text-gray-500">
                                            {charactersRemaining > 0 ? `${charactersRemaining} more character${charactersRemaining !== 1 ? 's' : ''} needed` : 'Password must be at least 8 characters long ✓'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-2">
                                    <span className="text-xs text-gray-500">Password must be at least 8 characters long</span>
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-600">Confirm New Password</label>
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
                                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={toggleConfirmPasswordVisibility}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
                            </div>
                        </div>

                        <div className="flex justify-between gap-3 mt-2 sm:flex-row flex-col-reverse">
                            <button type="button" onClick={handleCancel} className="px-6 py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors">Cancel</button>
                            <button type="submit" disabled={isLoading} className={`px-6 py-3 ${isLoading ? 'bg-gray-400' : 'bg-[#33e407] hover:bg-[#2bc906]'} text-white rounded-md font-medium text-sm transition-colors`}>{isLoading ? 'Changing Password...' : 'Change Password'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
