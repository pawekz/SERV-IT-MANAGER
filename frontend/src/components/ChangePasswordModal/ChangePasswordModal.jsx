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
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Change Password</h3>
                    <button onClick={handleCancel} className="text-gray-500" aria-label="Close" title="Close">×</button>
                </div>

                <div className="p-4">
                    {error && (
                        <div className="mb-3 p-2 rounded bg-red-100 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-3 p-2 rounded bg-green-100 text-green-700 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="current-password" className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    id="current-password"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none"
                                    placeholder="Enter your current password"
                                    required
                                    value={formValues.currentPassword}
                                    onChange={handleInputChange}
                                />
                                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700" onClick={toggleCurrentPasswordVisibility}>
                                    {showCurrentPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="new-password" className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="new-password"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none"
                                    placeholder="Enter new password"
                                    required
                                    value={formValues.newPassword}
                                    onChange={handleInputChange}
                                />
                                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700" onClick={toggleNewPasswordVisibility}>{showNewPassword ? 'Hide' : 'Show'}</button>
                            </div>

                            {/* Password strength indicator - retained */}
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
                            <label htmlFor="confirm-password" className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirm-password"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none"
                                    placeholder="Confirm new password"
                                    required
                                    value={formValues.confirmPassword}
                                    onChange={handleInputChange}
                                />
                                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700" onClick={toggleConfirmPasswordVisibility}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={handleCancel} className="px-3 py-2 border rounded">Cancel</button>
                            <button type="submit" disabled={isLoading} className={`px-3 py-2 bg-[#33e407] text-white rounded ${isLoading ? 'opacity-60' : 'hover:bg-[#2bc706]'}`}>{isLoading ? 'Changing...' : 'Change Password'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
