import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import api, { parseJwt } from '../../config/ApiConfig';
import ChangePasswordModal from '../../components/ChangePasswordModal/ChangePasswordModal.jsx';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';

// Utility to title-case multi-word names
const toTitleCase = (str) => str
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const AccountInformation = () => {
    // State
    const [userData, setUserData] = useState({
        userId: null,
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '********',
        profilePictureUrl: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', username: '', phoneNumber: '' });
    const [updateStatus, setUpdateStatus] = useState({ success: false, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    // New state: password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Fetch user
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('Not authenticated. Please log in.');

                const cached = sessionStorage.getItem('userData');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (parsed && parsed.userId) {
                            setUserData(parsed);
                        }
                    } catch (_) { }
                }

                const resp = await api.get('/user/getCurrentUser');
                const data = resp.data || {};
                const merged = {
                    userId: data.userId,
                    firstName: toTitleCase(data.firstName || ''),
                    lastName: toTitleCase(data.lastName || ''),
                    // Robust username selection: backend may use `username` or `userName`, or we fall back to email/sub/firstName
                    username: data.username || data.userName || data.email || data.sub || data.firstName || '',
                    email: data.email || '',
                    phoneNumber: data.phoneNumber || '',
                    password: '********',
                    profilePictureUrl: data.profilePictureUrl || null
                };
                setUserData(merged);
                sessionStorage.setItem('userData', JSON.stringify(merged));
                setError(null);
            } catch (err) {
                console.error('Error fetching user data:', err);
                try {
                    const token = localStorage.getItem('authToken');
                    const decoded = parseJwt(token);
                    if (decoded) {
                        const fallback = {
                            userId: decoded.userId || null,
                            firstName: toTitleCase(decoded.firstName || ''),
                            lastName: toTitleCase(decoded.lastName || ''),
                            username: decoded.username || decoded.sub || '',
                            email: decoded.email || decoded.sub || '',
                            phoneNumber: decoded.phoneNumber || '',
                            password: '********',
                            profilePictureUrl: null
                        };
                        setUserData(fallback);
                        sessionStorage.setItem('userData', JSON.stringify(fallback));
                    }
                } catch (_) { }
                setError('Failed to load account information. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const { data: displayProfileUrl } = useProfilePhoto(userData.userId, userData.profilePictureUrl);

    useEffect(() => {
        setEditFormData({ firstName: userData.firstName, lastName: userData.lastName, username: userData.username, phoneNumber: userData.phoneNumber });
    }, [userData]);

    const getInitials = () => {
        if (userData.firstName && userData.lastName) return `${userData.firstName.charAt(0).toUpperCase()}${userData.lastName.charAt(0).toUpperCase()}`;
        if (userData.firstName) return userData.firstName.charAt(0).toUpperCase();
        return 'U';
    };

    const handleEditClick = () => { setIsEditing(true); setUpdateStatus({ success: false, message: '' }); };
    const handleCloseEdit = () => { setIsEditing(false); setEditFormData({ firstName: userData.firstName, lastName: userData.lastName, username: userData.username, phoneNumber: userData.phoneNumber }); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'firstName' || name === 'lastName') {
            let sanitized = value.replace(/[^a-zA-Z\s]/g, '');
            sanitized = sanitized.replace(/\s{2,}/g, ' ');
            sanitized = sanitized.replace(/^\s+/, '').replace(/\s+$/, '');
            sanitized = toTitleCase(sanitized);
            setEditFormData(prev => ({ ...prev, [name]: sanitized }));
        } else if (name === 'phoneNumber') {
            const digitsOnly = value.replace(/[^0-9]/g, '');
            setEditFormData(prev => ({ ...prev, [name]: digitsOnly }));
        } else {
            setEditFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUpdateStatus({ success: false, message: '' });
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated. Please log in.');

            let usernameChanged = false;
            if (userData.firstName !== editFormData.firstName || userData.lastName !== editFormData.lastName) {
                const r = await api.patch('/user/updateCurrentUserFullName', { newFirstName: editFormData.firstName, newLastName: editFormData.lastName });
                if (r.status < 200 || r.status >= 300) throw new Error(r.data || 'Failed to update full name');
            }
            if (userData.phoneNumber !== editFormData.phoneNumber) {
                const r = await api.patch('/user/changeCurrentUserPhoneNumber', { newPhoneNumber: editFormData.phoneNumber });
                if (r.status < 200 || r.status >= 300) throw new Error(r.data || 'Failed to update phone number');
            }
            if (userData.username !== editFormData.username) {
                const r = await api.patch('/user/updateCurrentUsername', { newUsername: editFormData.username });
                if (r.status < 200 || r.status >= 300) throw new Error(r.data || 'Failed to update username');
                usernameChanged = true;
            }

            const updated = { ...userData, firstName: editFormData.firstName, lastName: editFormData.lastName, username: editFormData.username, phoneNumber: editFormData.phoneNumber };
            setUserData(updated);
            sessionStorage.setItem('userData', JSON.stringify(updated));
            setUpdateStatus({ success: true, message: usernameChanged ? 'Username updated. Please log in again.' : 'Profile updated successfully!' });

            if (usernameChanged) {
                setTimeout(() => { localStorage.removeItem('authToken'); sessionStorage.removeItem('userData'); navigate('/login'); }, 2000);
            } else {
                setTimeout(() => setIsEditing(false), 1200);
            }
        } catch (err) {
            setUpdateStatus({ success: false, message: err.response?.data || err.message || 'Failed to update profile. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const triggerFileInput = () => { if (fileInputRef.current) fileInputRef.current.click(); };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingPic(true); setUploadError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            // Don't set Content-Type manually - axios 1.12.0 will set it automatically with boundary
            await api.post('/user/updateCurrentUserProfilePicture', fd);
            const refreshed = await api.get('/user/getCurrentUser');
            const newData = { ...userData, ...refreshed.data, password: '********' };
            setUserData(newData);
            sessionStorage.setItem('userData', JSON.stringify(newData));
        } catch (err) {
            console.error('Upload failed', err);
            setUploadError(err.response?.data || err.message || 'Failed to upload image');
        } finally {
            setIsUploadingPic(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemovePicture = async () => {
        if (!userData.userId) return;
        setIsUploadingPic(true); setUploadError(null);
        try {
            await api.delete('/user/removeCurrentUserProfilePicture');
            const refreshed = await api.get('/user/getCurrentUser');
            const newData = { ...userData, ...refreshed.data, profilePictureUrl: null };
            setUserData(newData);
            sessionStorage.setItem('userData', JSON.stringify(newData));
        } catch (err) {
            setUploadError(err.response?.data || err.message || 'Failed to remove picture');
        } finally {
            setIsUploadingPic(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">
            {/* Sidebar column */}
            <div className="w-full md:w-[250px] h-auto md:h-screen">
                <Sidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 p-8 bg-gray-50">
                {loading ? (
                    <div className="text-center py-8">Loading account information...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">
                        <p className="mb-3">{error}</p>
                        <button onClick={() => window.location.reload()} className="text-blue-500 underline">Try Again</button>
                    </div>
                ) : (
                    <>
                        {/* Header (left only) */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-semibold text-gray-800 mb-2">Account Information</h1>
                            <p className="text-gray-600 text-base max-w-3xl">Manage your personal details, profile picture, and account settings.</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div className="flex flex-col items-center px-6">
                                    {displayProfileUrl ? (
                                        <img loading="lazy" src={displayProfileUrl} alt="Profile" onError={() => setDisplayProfileUrl(null)} className="w-44 h-44 rounded-full object-cover border-2 mx-auto" style={{ borderColor: 'rgba(51, 228, 7, 0.18)' }} />
                                    ) : (
                                        <div className="w-44 h-44 rounded-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400 mx-auto" style={{ border: '2px solid rgba(51, 228, 7, 0.18)' }}>{getInitials()}</div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleFileChange} />

                                    <div className="mt-4 w-full flex flex-col gap-2 items-center">
                                        <button onClick={triggerFileInput} disabled={isUploadingPic} className="w-full border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 disabled:opacity-50">{isUploadingPic ? 'Uploading...' : (displayProfileUrl ? 'Change Photo' : 'Upload Photo')}</button>
                                        {displayProfileUrl && <button onClick={handleRemovePicture} disabled={isUploadingPic} className="w-full border border-red-200 text-red-600 px-3 py-2 rounded text-sm hover:bg-red-50 disabled:opacity-50">Remove Photo</button>}
                                    </div>
                                    {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                                            <input type="text" value={userData.firstName} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-800" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                                            <input type="text" value={userData.lastName} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-800" />
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                                        <input type="text" value={userData.username} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-800" />
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                        <input type="email" value={userData.email} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-800 break-all" />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be edited.</p>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                                        <div className="flex items-center w-full border border-gray-200 rounded-md overflow-hidden bg-white">
                                            <div className="flex items-center bg-gray-50 px-3 py-2 border-r border-gray-200">
                                                <img src="https://flagcdn.com/16x12/ph.png" alt="PH" className="w-4 h-auto mr-2" />
                                                <span className="text-sm text-gray-600">+63</span>
                                            </div>
                                            <input type="text" value={userData.phoneNumber} readOnly className="flex-1 px-3 py-2 text-sm text-gray-800 border-none focus:outline-none" />
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                                        <button onClick={() => setShowPasswordModal(true)} className="w-full sm:w-auto py-2 px-4 rounded-md text-white bg-[#17A2B8] hover:bg-[#138496]">Change Password</button>
                                        <button onClick={handleEditClick} className="w-full sm:w-auto py-2 px-4 rounded-md text-white bg-[#33e407] hover:bg-[#2bc706]">Edit Profile</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Edit modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                    <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Edit Profile</h3>
                            <button onClick={handleCloseEdit} className="text-gray-500" aria-label="Close" title="Close">×</button>
                        </div>

                        <div className="p-4">
                            {updateStatus.message && (
                                <div className={updateStatus.success ? 'mb-3 p-2 rounded bg-green-100 text-green-700 text-sm' : 'mb-3 p-2 rounded bg-red-100 text-red-700 text-sm'}>
                                    {updateStatus.message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="block text-xs text-gray-700 mb-1">First Name</label>
                                    <input id="edit-firstName" name="firstName" value={editFormData.firstName} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded" />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs text-gray-700 mb-1">Last Name</label>
                                    <input id="edit-lastName" name="lastName" value={editFormData.lastName} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded" />
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs text-gray-700 mb-1">Username</label>
                                    <input id="edit-username" name="username" value={editFormData.username} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded" />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs text-gray-700 mb-1">Phone Number</label>
                                    <input id="phoneNumber" name="phoneNumber" value={editFormData.phoneNumber} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded" />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={handleCloseEdit} className="px-3 py-2 border rounded">Cancel</button>
                                    <button type="submit" className="px-3 py-2 bg-[#33e407] text-white rounded">{isSubmitting ? 'Updating...' : 'Save Changes'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Password modal */}
            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
        </div>
    );
};

export default AccountInformation;
