import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HardDriveDownload, RotateCcw, Download, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import ScheduleTab from "../../components/ScheduleTab/ScheduleTab.jsx";
import DestinationTab from "../../components/DestinationTab/DestinationTab.jsx";
import HistoryTab from "../../components/HistoryTab/HistoryTab.jsx";
import api from "../../services/api";

const tabTitles = [
    'Schedule',
    'Destination & Storage',
    'Back Up History'
];

// Helper to decode JWT and check role
function getUserRole() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).role;
    } catch {
        return null;
    }
}

const BackUpPage = () => {
    const [initialLoading, setInitialLoading] = useState(false); // For initial page data if any
    const [initialError, setInitialError] = useState(null); // For initial page data error

    const [activeTab, setActiveTab] = useState(tabTitles[0]);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

    const navigate = useNavigate();
    const [tokenExpiredModal, setTokenExpiredModal] = useState(false);

    const userRole = getUserRole();
    const isAdmin = userRole === 'ADMIN';

    // Function to clear messages after a delay
    const clearMessages = () => {
        setActionError(null);
        setActionSuccessMessage(null);
    };

    const handleManualBackup = async () => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccessMessage(null);
        try {
            const response = await api.post("/api/backup/now");
            setActionSuccessMessage(response.data || "Backup created successfully.");
        } catch (err) {
            setActionError(err.response?.data || err.message);
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 5000);
        }
    };

    useEffect(() => {
        const handleTokenExpired = () => {
            setTokenExpiredModal(true);
            setTimeout(() => {
                setTokenExpiredModal(false);
                navigate('/login');
            }, 2000);
        };
        window.addEventListener('tokenExpired', handleTokenExpired);
        return () => window.removeEventListener('tokenExpired', handleTokenExpired);
    }, [navigate]);

    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            {/* Token Expired Modal */}
            {tokenExpiredModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-xl text-center">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Session Expired</h3>
                        <p className="text-gray-600">Your session has expired. Please log in again.<br/>Redirecting to login...</p>
                    </div>
                </div>
            )}
            <Sidebar activePage="backup" />
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Back Up and Recovery</h1>
                        <p className="text-gray-600 text-base max-w-3xl">
                            Manually create database backups, schedule automatic backups, and restore from existing backup points.
                        </p>
                    </div>
                    <div className="shrink-0">
                        <button
                            onClick={handleManualBackup}
                            disabled={actionLoading}
                            className="flex items-center py-3 px-6 rounded-md font-medium transition-all text-white bg-[#33e407] hover:bg-[#2bc706] disabled:bg-gray-400"
                        >
                            <HardDriveDownload className="mr-2" />
                            {actionLoading ? 'Backing up...' : 'Manual Back Up'}
                        </button>
                    </div>
                </div>

                {/* Action Messages */}
                {actionError && (
                    <div className="mb-4 p-4 rounded-md bg-red-100 text-red-700 flex items-center">
                        <AlertCircle size={20} className="mr-2 shrink-0" />
                        <span>{actionError}</span>
                        <button onClick={() => setActionError(null)} className="ml-auto text-red-700 underline">Dismiss</button>
                    </div>
                )}
                {actionSuccessMessage && (
                    <div className="mb-4 p-4 rounded-md bg-green-100 text-green-700 flex items-center">
                        <CheckCircle2 size={20} className="mr-2 shrink-0" />
                        <span>{actionSuccessMessage}</span>
                        <button onClick={() => setActionSuccessMessage(null)} className="ml-auto text-green-700 underline">Dismiss</button>
                    </div>
                )}

                {initialLoading ? (
                    <div className="text-center py-8"><p>Loading page data...</p></div>
                ) : initialError ? (
                    <div className="text-center py-8 text-red-500">
                        <p>{initialError}</p>
                        <button onClick={() => window.location.reload()} className="mt-4 text-blue-500 underline">Try Again</button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="flex flex-wrap border-b border-gray-300 px-2">
                            {tabTitles.map((title) => (
                                <button
                                    key={title}
                                    className={`px-4 py-3 font-medium transition-all ${
                                        activeTab === title
                                            ? 'border-b-2 border-[#01e135] text-[#01e135]'
                                            : 'text-gray-600 hover:text-[#01e135]'
                                    }`}
                                    onClick={() => setActiveTab(title)}
                                >
                                    {title}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {activeTab === 'Schedule' && <ScheduleTab />}
                            {activeTab === 'Destination & Storage' && <DestinationTab />}
                            {activeTab === 'Back Up History' && <HistoryTab />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackUpPage;
