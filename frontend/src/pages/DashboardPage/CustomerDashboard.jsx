import Sidebar from "../../components/SideBar/Sidebar.jsx"
import {
    HelpCircle,
    Mail,
    HandHelpingIcon as HelpIcon,
    FileText,
    X
} from "lucide-react"

import TermsEditor from "../TermsEditor/TermsEditor.jsx";

import { Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import NotificationBell from "../../components/Notifications/NotificationBell.jsx";
import ActiveRepairsCarousel from "./CustomerDashboardComponents/ActiveRepairsCarousel.jsx";
import RecentUpdatesCard from "./CustomerDashboardComponents/RecentUpdatesCard.jsx";
import RequiredActionsCard from "./CustomerDashboardComponents/RequiredActionsCard.jsx";
import DocumentAccessCard from "./CustomerDashboardComponents/DocumentAccessCard.jsx";
import api from '../../config/ApiConfig.jsx';

const CustomerDashboard = () => {
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '********', // Placeholder for security
        role: '' // Added role field
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for customer-specific statistics
    const [stats, setStats] = useState({
        activeRepairs: 1,
        completedRepairs: 5,
        warrantyItems: 2,
        totalSpent: "$1,249.99"
    });

    // State for repair history data
    const [repairData, setRepairData] = useState([]);
    const [repairLoading, setRepairLoading] = useState(true);
    const [repairError, setRepairError] = useState(null);

    // Modal state for repair details
    const [modalData, setModalData] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const [profileUrl, setProfileUrl] = useState(null);

    // Modal state for Terms & Conditions
    const [showTermsModal, setShowTermsModal] = useState(false);

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    // Function to show the repair details modal
    const showRepairDetailsModal = (item) => {
        setModalData(item);
    };

    // Function to close the modal
    const closeModal = () => {
        setModalData(null);
    };

    const getInitials = () => {
        if (userData.firstName && userData.lastName) return userData.firstName[0].toUpperCase() + userData.lastName[0].toUpperCase();
        if (userData.firstName) return userData.firstName[0].toUpperCase();
        return 'U';
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);

                // Check if we have cached user data in sessionStorage first
                const cachedUserData = sessionStorage.getItem('userData');
                if (cachedUserData) {
                    const parsedData = JSON.parse(cachedUserData);
                    setUserData(parsedData);
                    setLoading(false);
                    return;
                }

                // Get token from localStorage if no cached data
                const token = localStorage.getItem('authToken');

                if (!token) {
                    throw new Error("Not authenticated. Please log in.");
                }

                // Try to parse token to get user info
                const decodedToken = parseJwt(token);

                if (decodedToken) {
                    const userData = {
                        firstName: decodedToken.firstName || '',
                        lastName: decodedToken.lastName || '',
                        username: decodedToken.username || decodedToken.sub || '',
                        email: decodedToken.email || decodedToken.sub || '',
                        phoneNumber: decodedToken.phoneNumber || '',
                        password: '********', // Mask password for security
                        role: decodedToken.role || '' // Extract role from token
                    };

                    setUserData(userData);

                    // Cache the user data in sessionStorage for persistence across refreshes
                    sessionStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    // If token can't be decoded, could attempt API call to get user data
                    throw new Error("Could not retrieve user information");
                }
                setError(null);
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Failed to load account information. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Add useEffect to fetch customer repair stats
    useEffect(() => {
        // In a real application, you would fetch actual repair statistics from your backend
        const fetchRepairStats = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                // This would be replaced with an actual API call
                // Example: const response = await api.get('repair/getCustomerStats');

                // For now, we'll just use the default stats
                // setStats(await response.json());
            } catch (err) {
                console.error("Error fetching repair statistics:", err);
            }
        };

        fetchRepairStats();
    }, []);

    // Add useEffect to fetch repair history
    useEffect(() => {
        const fetchRepairHistory = async () => {
            try {
                setRepairLoading(true);
                const token = localStorage.getItem('authToken');

                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                // This would be replaced with an actual API call
                // Example: const response = await api.get('/repair/getCustomerRepairs', {

                // Mock data for now
                const mockRepairData = [
                    { id: 1, device: "iPhone 13", status: "In Progress", date: "May 28, 2025" },
                    { id: 2, device: "MacBook Pro", status: "Completed", date: "May 20, 2025" },
                    { id: 3, device: "iPad Pro", status: "Completed", date: "April 15, 2025" }
                ];

                setRepairData(mockRepairData);
                setRepairError(null);
            } catch (err) {
                console.error("Error fetching repair history:", err);
                setRepairError("Failed to load repair history");
            } finally {
                setRepairLoading(false);
            }
        };

        fetchRepairHistory();
    }, []);

    useEffect(() => {
        const ensureUserWithPicture = async () => {
            try {
                let stored = sessionStorage.getItem('userData');
                let parsed = stored ? JSON.parse(stored) : null;
                if (!parsed || !parsed.userId) {
                    const resp = await api.get('/user/getCurrentUser');
                    parsed = { ...userData, ...resp.data, password: '********' };
                    sessionStorage.setItem('userData', JSON.stringify(parsed));
                    setUserData(prev => ({ ...prev, ...parsed }));
                } else if (!parsed.profilePictureUrl) {
                    // try refresh backend (maybe just uploaded)
                    const resp = await api.get('/user/getCurrentUser');
                    parsed = { ...parsed, ...resp.data };
                    sessionStorage.setItem('userData', JSON.stringify(parsed));
                    setUserData(prev => ({ ...prev, ...parsed }));
                }
                if (parsed.profilePictureUrl && parsed.profilePictureUrl !== '0') {
                    try {
                        const presigned = await api.get(`/user/getProfilePicture/${parsed.userId}`);
                        setProfileUrl(presigned.data);
                    } catch { setProfileUrl(null); }
                } else {
                    setProfileUrl(null);
                }
            } catch (e) {
                setProfileUrl(null);
            }
        };
        ensureUserWithPicture();
        const interval = setInterval(ensureUserWithPicture, 240000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get current repair items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = repairData.slice(indexOfFirstItem, indexOfLastItem);

    // Calculate total pages
    const totalPages = Math.ceil(repairData.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Previous page
    const goToPreviousPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    // Next page
    const goToNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-rowflex-col md:flex-row">
            {/* Custom Sidebar Component */}
            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'dashboard'}/>
            </div>


            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50">
                {/* Header with User Menu */}
                <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Customer Portal</h2>
                    </div>
                    <div className="flex items-center space-x-5">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <HelpCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        {/* Real-time notifications */}
                        <NotificationBell />
                        <Link to="/accountinformation" className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 bg-gray-100 overflow-hidden">
                            {profileUrl ? (
                                <img src={profileUrl} alt="Profile" onError={() => setProfileUrl(null)} className="w-full h-full object-cover" loading="lazy"/>
                            ) : (
                                <span className="text-sm font-semibold text-gray-600">{getInitials()}</span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Hello {userData.firstName}</h1>

                    {/* Active Repair Card */}
                    <ActiveRepairsCarousel customerEmail={userData.email} />

                    {/* Updates and Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <RecentUpdatesCard />
                        <RequiredActionsCard />
                    </div>

                    {/* Others */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DocumentAccessCard />
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Others</h3>
                            <div className="space-y-3">

                                <a href="mailto:servit.validation@gmail.com?subject=Support%20Request&body=Hello%20Support%20Team," className="flex items-center w-full px-4 py-3 bg-purple-50 text-purple-600 rounded-md no-underline cursor-pointer">
                                    <Mail className="h-5 w-5 mr-3" />
                                    Email Support Team
                                </a>

                                <Link to="/FAQ">
                                    <button className="flex items-center w-full px-4 py-3 bg-amber-50 text-amber-600 rounded-md mt-4">
                                        <HelpIcon className="h-5 w-5 mr-3" />
                                        FAQ / Help Center
                                    </button>
                                </Link>

                                <button className="flex items-center w-full px-4 py-3 bg-green-50 text-green-700 rounded-md mt-4" onClick={() => setShowTermsModal(true)}>
                                    <FileText className="h-5 w-5 mr-3 text-green-600" />
                                    Terms and Conditions
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                    tabIndex={-1}
                    aria-modal="true"
                    role="dialog"
                    onClick={() => setShowTermsModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-10 relative border border-gray-100"
                        style={{ maxWidth: "900px", minHeight: "60vh" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition-colors"
                            onClick={() => setShowTermsModal(false)}
                            aria-label="Close"
                        >
                            <X size={28} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center tracking-tight">
                            Terms & Conditions
                        </h2>
                        <div className="max-h-[60vh] overflow-y-auto border border-gray-100 rounded-lg p-6 bg-gray-50">
                            <TermsEditor />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CustomerDashboard
