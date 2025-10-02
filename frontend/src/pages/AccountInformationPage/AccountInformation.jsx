import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import api, { parseJwt } from '../../config/ApiConfig';

// Utility to title-case multi-word names (e.g., "juan dela cruz" -> "Juan Dela Cruz")
const toTitleCase = (str) => str
    .split(' ') // split on spaces
    .filter(Boolean) // remove empty strings
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const AccountInformation = () => {
    const [userData, setUserData] = useState({
        userId: null,
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber:'',
        password: '********',
        profilePictureUrl: null
    });
    const [displayProfileUrl, setDisplayProfileUrl] = useState(null); // URL for displaying profile pictures
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        phoneNumber:'',
    });
    const [updateStatus, setUpdateStatus] = useState({ success: false, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    // fetch current user (always prefer backend so we have profile pictures)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error("Not authenticated. Please log in.");

                // Attempt to use sessionStorage first (must include Profile Picture URL & userId)

                const cachedUserData = sessionStorage.getItem('userData');
                if (cachedUserData) {
                    try {
                        const parsed = JSON.parse(cachedUserData);
                        if (parsed && parsed.userId) {
                            setUserData(parsed);
                            if (parsed.profilePictureUrl && parsed.profilePictureUrl !== '0') {
                                await fetchPresignedUrl(parsed.userId, parsed.profilePictureUrl);
                            }
                        }
                    } catch (_) { }
                }

                // Always refresh from backend so picture changes propagate

                const response = await api.get('/user/getCurrentUser');
                const data = response.data;
                const merged = {
                    userId: data.userId,
                    firstName: toTitleCase(data.firstName || ''),
                    lastName: toTitleCase(data.lastName || ''),
                    username: data.email || data.username || data.firstName || '', //fallback
                    email: data.email || '',
                    phoneNumber: data.phoneNumber || '',
                    password: '********',
                    profilePictureUrl: data.profilePictureUrl || null
                };
                setUserData(merged);
                sessionStorage.setItem('userData', JSON.stringify(merged));
                if (merged.profilePictureUrl && merged.profilePictureUrl !== '0') {
                    await fetchPresignedUrl(merged.userId, merged.profilePictureUrl);
                } else {
                    setDisplayProfileUrl(null);
                }
                setError(null);
            } catch (err) {
                console.error("Error fetching user data:", err);
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
                } catch (_) {}
                setError("Failed to load account information. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const fetchPresignedUrl = async (userId, rawUrl) => {
        try {
            const resp = await api.get(`/user/getProfilePicture/${userId}`);
            setDisplayProfileUrl(resp.data);
        } catch (e) {
            console.warn('Could not fetch presigned URL, using stored url if possible');
            if (rawUrl && rawUrl !== '0') setDisplayProfileUrl(rawUrl);
        }
    };

    useEffect(() => {
        if (userData) {
            setEditFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                phoneNumber: userData.phoneNumber
            });
        }
    }, [userData]);

    const getInitials = () => {
        if (userData.firstName && userData.lastName) {
            return `${userData.firstName.charAt(0).toUpperCase()}${userData.lastName.charAt(0).toUpperCase()}`;
        }
        if (userData.firstName) return userData.firstName.charAt(0).toUpperCase();
        return "U";
    };

    const handlePasswordRedirect = () => navigate('/passwordmanagement');

    const handleEditClick = () => { setIsEditing(true); setUpdateStatus({ success: false, message: '' }); };
    const handleCloseEdit = () => {
        setIsEditing(false);
        setEditFormData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username,
            phoneNumber: userData.phoneNumber
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'firstName' || name === 'lastName') {
            let sanitized = value.replace(/[^a-zA-Z\s]/g, ''); // collapse multiple spaces
            sanitized = sanitized.replace(/\s{2,}/g, ' '); // trim leading/trailing spaces
            sanitized = sanitized.replace(/^\s+/, ''); // trim leading spaces
            sanitized = sanitized.replace(/\s+$/, ''); // trim trailing spaces
            sanitized = toTitleCase(sanitized); // ensure each part is capitalized
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
            if (!token) throw new Error("Not authenticated. Please log in.");
            let usernameChanged = false;
            if (userData.firstName !== editFormData.firstName || userData.lastName !== editFormData.lastName) {
                const response = await api.patch('/user/updateCurrentUserFullName', {
                    newFirstName: editFormData.firstName,
                    newLastName: editFormData.lastName
                });
                if (response.status < 200 || response.status >= 300) throw new Error(response.data || "Failed to update full name");
            }
            if (userData.phoneNumber !== editFormData.phoneNumber) {
                const response = await api.patch('/user/changeCurrentUserPhoneNumber', { newPhoneNumber: editFormData.phoneNumber });
                if (response.status < 200 || response.status >= 300) throw new Error(response.data || "Failed to update phone number");
            }
            if (userData.username !== editFormData.username) {
                const response = await api.patch('/user/updateCurrentUsername', { newUsername: editFormData.username });
                if (response.status < 200 || response.status >= 300) throw new Error(response.data || "Failed to update username");
                usernameChanged = true;
            }
            const updated = { ...userData, firstName: editFormData.firstName, lastName: editFormData.lastName, username: editFormData.username, phoneNumber: editFormData.phoneNumber };
            setUserData(updated);
            sessionStorage.setItem('userData', JSON.stringify(updated));
            setUpdateStatus({ success: true, message: usernameChanged ? "Username updated. Please log in again." : "Profile updated successfully!" });
            if (usernameChanged) {
                setTimeout(() => { localStorage.removeItem('authToken'); sessionStorage.removeItem('userData'); navigate('/login'); }, 2000);
            } else {
                setTimeout(() => setIsEditing(false), 1500);
            }
        } catch (err) {
            setUpdateStatus({ success: false, message: err.response?.data || err.message || "Failed to update profile. Please try again." });
        } finally { setIsSubmitting(false); }
    };

    const triggerFileInput = () => { if (fileInputRef.current) fileInputRef.current.click(); };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingPic(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/user/updateCurrentUserProfilePicture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const refreshed = await api.get('/user/getCurrentUser');
            const newData = { ...userData, ...refreshed.data, password: '********' };
            setUserData(newData);
            sessionStorage.setItem('userData', JSON.stringify(newData));
            if (newData.profilePictureUrl && newData.profilePictureUrl !== '0') {
                await fetchPresignedUrl(newData.userId, newData.profilePictureUrl);
            } else {
                setDisplayProfileUrl(null);
            }
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
            setDisplayProfileUrl(null);
        } catch (err) {
            setUploadError(err.response?.data || err.message || 'Failed to remove picture');
        } finally { setIsUploadingPic(false); }
    };

    return (
        // <CHANGE> Fixed mobile layout - changed from flex to flex-col on mobile, md:flex-row on larger screens to eliminate gap
        <div className="flex flex-col md:flex-row min-h-screen font-['Poppins',sans-serif]">
            <Sidebar/>
            <div className="flex-1 p-4 sm:p-6 lg:p-8 ml-0 md:ml-[250px] bg-gray-50">
                <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-4xl mx-auto">
                    {loading ? (
                        <div className="text-center py-8"><p>Loading account information...</p></div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p className="text-sm sm:text-base">{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-4 text-blue-500 underline text-sm sm:text-base">Try Again</button>
                        </div>
                    ) : (
                        <>
                            <section className="mb-8 lg:mb-10">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Account Information</h2>
                                <div className="flex items-center gap-4 sm:gap-6 flex-col sm:flex-row text-center sm:text-left">
                                    <div className="relative flex-shrink-0">
                                        {displayProfileUrl ? (
                                            <img
                                                src={displayProfileUrl || "/placeholder.svg"}
                                                alt="Profile"
                                                onError={() => setDisplayProfileUrl(null)}
                                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2"
                                                style={{ borderColor: "rgba(51, 228, 7, 0.2)" }}
                                            />
                                        ) : (
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 flex items-center justify-center text-3xl sm:text-4xl text-gray-400" style={{ border: "2px solid rgba(51, 228, 7, 0.2)" }}>
                                                <span>{getInitials()}</span>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">{`${userData.firstName} ${userData.lastName}`}</h3>
                                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 break-all">{userData.email}</p>
                                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center sm:justify-start">
                                            <button
                                                type="button"
                                                onClick={triggerFileInput}
                                                disabled={isUploadingPic}
                                                className="border border-gray-300 text-gray-600 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 w-full sm:w-auto"
                                            >{isUploadingPic ? 'Uploading...' : (displayProfileUrl ? 'Change Profile Picture' : 'Upload Profile Picture')}</button>
                                            {displayProfileUrl && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemovePicture}
                                                    disabled={isUploadingPic}
                                                    className="border border-red-300 text-red-600 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-all hover:bg-red-50 disabled:opacity-50 w-full sm:w-auto"
                                                >Remove</button>
                                            )}
                                        </div>
                                        {uploadError && <p className="text-xs sm:text-sm text-red-500 mt-2">{uploadError}</p>}
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8 lg:mb-10">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Personal Information</h2>

                                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
                                    <div className="flex-1">
                                        <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={userData.firstName}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-sm sm:text-base text-gray-800 font-normal focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={userData.lastName}
                                            readOnly
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-sm sm:text-base text-gray-800 font-normal focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <label htmlFor="username" className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={userData.username}
                                        readOnly
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-sm sm:text-base text-gray-800 font-normal focus:outline-none"
                                    />
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={userData.email}
                                        readOnly
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-sm sm:text-base text-gray-800 font-normal focus:outline-none break-all"
                                    />
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#33e407] focus-within:ring-1 focus-within:ring-[#33e407] transition-colors overflow-hidden">
                                        <div className="flex items-center bg-gray-50 px-2 sm:px-3 py-2 sm:py-3 border-r border-gray-200">
                                            <img
                                                src="https://flagcdn.com/16x12/ph.png"
                                                alt="Philippine flag"
                                                className="mr-1 sm:mr-2 w-4 sm:w-5 h-auto"
                                            />
                                            <span className="text-xs sm:text-sm text-gray-600">+63</span>
                                        </div>
                                        <input
                                            maxLength={13}
                                            type="tel"
                                            id="phoneNumber"
                                            value={userData.phoneNumber}
                                            readOnly
                                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-none focus:outline-none"
                                            placeholder="905 123 4567"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mb-6">
                                <button
                                    onClick={handlePasswordRedirect}
                                    className="py-2 sm:py-3 px-4 sm:px-6 rounded-md font-medium transition-all w-full sm:w-auto text-sm sm:text-base text-white bg-[#17A2B8] hover:bg-[#138496]">
                                    Change Password
                                </button>

                                <button
                                    onClick={handleEditClick}
                                    className="py-2 sm:py-3 px-4 sm:px-6 rounded-md font-medium transition-all w-full sm:w-auto text-sm sm:text-base text-white bg-[#33e407] hover:bg-[#2bc706]">
                                    Edit Profile
                                </button>
                            </div>
                        </>
                    )}

                    <div className="text-center mt-4">
                        <Link to="#" className="text-sm sm:text-base font-medium hover:underline" style={{ color: "#33e407" }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Edit Profile</h3>
                            <button
                                onClick={handleCloseEdit}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4">
                            {updateStatus.message && (
                                <div className={`mb-4 p-2 sm:p-3 rounded text-xs sm:text-sm ${updateStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {updateStatus.message}
                                </div>
                            )}

                            <div className="mb-3 sm:mb-4">
                                <label htmlFor="edit-firstName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="edit-firstName"
                                    name="firstName"
                                    value={editFormData.firstName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    pattern="[A-Za-z ]+"
                                    title="Please enter only letters and spaces"
                                />
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <label htmlFor="edit-lastName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="edit-lastName"
                                    name="lastName"
                                    value={editFormData.lastName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    pattern="[A-Za-z ]+"
                                    title="Please enter only letters and spaces"
                                />
                            </div>

                            <div className="mb-3 sm:mb-6">
                                <label htmlFor="edit-username" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="edit-username"
                                    name="username"
                                    value={editFormData.username}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div className="mb-4 sm:mb-6">
                                <label htmlFor="edit-phonenumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <div className="flex items-center w-full border border-gray-200 rounded-md focus-within:border-[#33e407] focus-within:ring-1 focus-within:ring-[#33e407] transition-colors overflow-hidden">
                                    <div className="flex items-center bg-gray-50 px-2 sm:px-3 py-2 sm:py-3 border-r border-gray-200">
                                        <img
                                            src="https://flagcdn.com/16x12/ph.png"
                                            alt="Philippine flag"
                                            className="mr-1 sm:mr-2 w-4 sm:w-5 h-auto"
                                        />
                                        <span className="text-xs sm:text-sm text-gray-600">+63</span>
                                    </div>
                                    <input
                                        maxLength={10}
                                        type="text"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={editFormData.phoneNumber}
                                        onChange={handleInputChange}
                                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-none focus:outline-none"
                                        placeholder="9051234567"
                                        required
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseEdit}
                                    className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#33e407] hover:bg-[#2bc706] text-white rounded-md w-full sm:w-auto"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountInformation;