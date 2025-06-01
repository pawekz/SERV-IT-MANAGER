import { useState, useEffect, useCallback } from "react";
// import { Link, useNavigate } from "react-router-dom"; // Link and useNavigate not used in this version
import { HardDriveDownload, RotateCcw, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import ScheduleTab from "../../components/ScheduleTab/ScheduleTab.jsx";

// Placeholder for ScheduleTab if its content is not relevant to this task.
// const ScheduleTab = () => <div>Schedule content goes here. (Out of scope for current task)</div>;
const DestinationTab = () => <div>Destination & Storage content goes here. (Out of scope for current task)</div>;

const tabTitles = [
    'Schedule',
    'Destination & Storage',
    'Back Up History'
];

// Helper to get the auth token (adjust based on actual auth implementation)
const getAuthToken = () => {
    return localStorage.getItem("token"); // Assuming token is stored in localStorage
};

const BackUpPage = () => {
    // const [userData, setUserData] = useState({}); // Not used in this version
    const [initialLoading, setInitialLoading] = useState(false); // For initial page data if any
    const [initialError, setInitialError] = useState(null); // For initial page data error

    const [activeTab, setActiveTab] = useState(tabTitles[0]);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

    const [backupList, setBackupList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/backup/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            const resultText = await response.text();
            if (!response.ok) {
                throw new Error(resultText || `Failed to create backup. Status: ${response.status}`);
            }
            setActionSuccessMessage(resultText);
            fetchBackupList(); // Refresh list after backup
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 5000);
        }
    };

    const fetchBackupList = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/backup/list`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Failed to fetch backup list. Status: ${response.status}`);
            }
            const data = await response.json();
            setBackupList(data);
        } catch (err) {
            setListError(err.message);
            setBackupList([]); // Clear list on error
        } finally {
            setListLoading(false);
        }
    }, [API_BASE_URL]);


    const handleRestore = async (fileName) => {
        if (!window.confirm(`Are you sure you want to restore the system from backup: ${fileName}? This action cannot be undone.`)) {
            return;
        }
        setActionLoading(true);
        setActionError(null);
        setActionSuccessMessage(null);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/backup/restore/${encodeURIComponent(fileName)}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            const resultText = await response.text();
            if (!response.ok) {
                throw new Error(resultText || `Failed to restore backup. Status: ${response.status}`);
            }
            setActionSuccessMessage(resultText);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 7000); // Longer time for restore message
        }
    };

    const handleDownload = async (fileName) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccessMessage(null);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/backup/download/${encodeURIComponent(fileName)}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                 const errorText = await response.text(); // Attempt to get error message from body
                 throw new Error(errorText || `Failed to download backup. Status: ${response.status}`);
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', fileName); //or retrieve from content-disposition
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            setActionSuccessMessage(`Backup ${fileName} downloaded.`);

        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 5000);
        }
    };


    // HistoryTab Component
    const HistoryTab = () => {
        useEffect(() => {
            if (activeTab === 'Back Up History') {
                fetchBackupList();
            }
        }, [activeTab]); // Removed fetchBackupList from dependency array as it's memoized by useCallback

        if (listLoading) return <div className="text-center py-4"><p>Loading backup history...</p></div>;
        if (listError) return <div className="text-center py-4 text-red-600"><p>Error loading history: {listError}</p></div>;
        if (backupList.length === 0) return <div className="text-center py-4"><p>No backup files found.</p></div>;

        return (
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Available Backups</h3>
                <ul className="divide-y divide-gray-200">
                    {backupList.map((fileName) => (
                        <li key={fileName} className="py-3 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                            <span className="text-gray-700 break-all">{fileName}</span>
                            <div className="flex space-x-2 shrink-0">
                                <button
                                    onClick={() => handleDownload(fileName)}
                                    disabled={actionLoading}
                                    className="flex items-center px-3 py-2 text-sm rounded-md text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                                >
                                    <Download size={16} className="mr-1" /> Download
                                </button>
                                <button
                                    onClick={() => handleRestore(fileName)}
                                    disabled={actionLoading}
                                    className="flex items-center px-3 py-2 text-sm rounded-md text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                                >
                                    <RotateCcw size={16} className="mr-1" /> Restore
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };


    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            <Sidebar activePage="backup" />
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Back Up and Recovery</h1>
                        <p className="text-gray-600 text-base max-w-3xl">
                            Manually create database backups and restore from existing backup points.
                        </p>
                    </div>
                    <div className="shrink-0">
                        <button
                            onClick={handleManualBackup}
                            disabled={actionLoading}
                            className="flex items-center py-3 px-6 rounded-md font-medium transition-all text-white bg-[#33e407] hover:bg-[#2bc706] disabled:bg-gray-400"
                        >
                            <HardDriveDownload className="mr-2" />
                            {actionLoading && backupList.length === 0 ? 'Backing up...' : 'Manual Back Up'}
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

                        <div className="p-6"> {/* Adjusted padding for tab content area */}
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
