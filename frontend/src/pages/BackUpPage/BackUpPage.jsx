import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HardDriveDownload, RotateCcw, Download, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import ScheduleTab from "../../components/ScheduleTab/ScheduleTab.jsx";
import api from "../../services/api";

// Placeholder for ScheduleTab if its content is not relevant to this task.
// const ScheduleTab = () => <div>Schedule content goes here. (Out of scope for current task)</div>;
const DestinationTab = () => {
    const [currentDir, setCurrentDir] = useState("");
    const [newDir, setNewDir] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        api.get("/api/backup/directory")
            .then(res => {
                setCurrentDir(res.data.path);
                setNewDir(res.data.path);
            })
            .catch(err => setError(err.response?.data || err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setMsg(null);
        setError(null);
        try {
            await api.post("/api/backup/directory", { path: newDir });
            setCurrentDir(newDir);
            setMsg("Backup directory updated successfully.");
        } catch (err) {
            setError(err.response?.data || err.message);
        } finally {
            setLoading(false);
            setTimeout(() => { setMsg(null); setError(null); }, 4000);
        }
    };

    return (
        <div>
            <h3 className="font-semibold mb-2">Backup Directory</h3>
            {loading && <p>Loading...</p>}
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {msg && <div className="text-green-600 mb-2">{msg}</div>}
            <div className="mb-2">
                <label className="block text-gray-700">Current Directory:</label>
                <input
                    type="text"
                    value={currentDir}
                    readOnly
                    className="w-full bg-gray-100 border rounded px-2 py-1"
                />
            </div>
            <div className="mb-2">
            <label className="block text-gray-700">New Directory:</label>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newDir}
                        onChange={e => setNewDir(e.target.value)}
                        className="w-full border rounded px-2 py-1 bg-white"
                        aria-label="New backup directory (server-side path)"
                        placeholder="Enter server-side directory path"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Note: This should be a valid directory path on the <b>server</b> where backups will be stored. This is not a local path on your computer.
                </p>
            </div>
            <button
                onClick={handleSave}
                disabled={loading || !newDir}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Save
            </button>
        </div>
    );
};

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

const HistoryTab = ({ backupList, listLoading, listError, actionLoading, handleRestore, handleDelete, isAdmin }) => {
    // Helper to convert UTC date string to user's local time zone and format
    const formatToLocal = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Use user's local time zone
        return date.toLocaleString();
    };

    if (listLoading) return <div className="text-center py-4"><p>Loading backup history...</p></div>;
    if (listError) return <div className="text-center py-4 text-red-600"><p>Error loading history: {listError}</p></div>;
    if (backupList.length === 0) return <div className="text-center py-4"><p>No backup files found.</p></div>;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Available Backups</h3>
            <ul className="divide-y divide-gray-200">
                {backupList.map(({ fileName, id, backupDate }) => (
                    <li key={id} className="py-3 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                        <span className="text-gray-700 break-all">{fileName} <span className="text-xs text-gray-400 ml-2">{formatToLocal(backupDate)}</span></span>
                        <div className="flex space-x-2 shrink-0">
                            <button
                                onClick={() => handleRestore(id)}
                                disabled={actionLoading}
                                className="flex items-center px-3 py-2 text-sm rounded-md text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                            >
                                <RotateCcw size={16} className="mr-1" /> Restore
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDelete(id, fileName)}
                                    disabled={actionLoading}
                                    className="flex items-center px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                                >
                                    <Trash2 size={16} className="mr-1" /> Delete
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// ConfirmModal component
const ConfirmModal = ({ open, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", loading }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="mb-4 text-gray-700">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
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
            fetchBackupList(); // Refresh list after backup
        } catch (err) {
            setActionError(err.response?.data || err.message);
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 5000);
        }
    };

    const fetchBackupList = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const response = await api.get("/api/backup/list");
            setBackupList(response.data);
        } catch (err) {
            setListError(err.response?.data || err.message);
            setBackupList([]);
        } finally {
            setListLoading(false);
        }
    }, []);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({}); // { type, backupId, fileName, onConfirm }

    // Helper to open modal for delete or restore
    const openConfirmModal = ({ type, backupId, fileName, onConfirm }) => {
        setModalConfig({ type, backupId, fileName, onConfirm });
        setModalOpen(true);
    };
    const closeModal = () => setModalOpen(false);

    // Modified handlers to use modal
    const handleRestore = (backupId) => {
        openConfirmModal({
            type: 'restore',
            backupId,
            onConfirm: () => confirmRestore(backupId)
        });
    };
    const handleDelete = (backupId, fileName) => {
        openConfirmModal({
            type: 'delete',
            backupId,
            fileName,
            onConfirm: () => confirmDelete(backupId, fileName)
        });
    };

    // Actual API calls after modal confirm
    const confirmRestore = async (backupId) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccessMessage(null);
        closeModal();
        try {
            const response = await api.post("/api/backup/restore", { backupId });
            if (response.data && response.data.requireSignout) {
                setActionSuccessMessage(response.data.message || "Restore successful. Signing out...");
                setTimeout(() => {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }, 5000);
            } else {
                setActionSuccessMessage(response.data.message || "Restore successful.");
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.requireSignout) {
                setActionError(err.response.data.message || "Restore failed. Signing out...");
                /*setTimeout(() => {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }, 2000);*/
            } else {
                setActionError(err.response?.data?.message || err.message);
            }
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 7000);
        }
    };
    const confirmDelete = async (backupId, fileName) => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccessMessage(null);
        closeModal();
        try {
            await api.post('/api/backup/delete', { backupId });
            setActionSuccessMessage('Backup deleted successfully.');
            fetchBackupList();
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

    // Fetch backup list every 5 minutes
    useEffect(() => {
        if (activeTab === 'Back Up History') {
            fetchBackupList(); // Initial fetch
            const interval = setInterval(() => {
                fetchBackupList();
            }, 300000); // 5 minutes
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchBackupList]);

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

                {/* Confirm Modal for Delete/Restore */}
                <ConfirmModal
                    open={modalOpen}
                    title={modalConfig.type === 'delete' ? 'Delete Backup' : 'Restore Backup'}
                    message={modalConfig.type === 'delete'
                        ? `Are you sure you want to delete the backup: ${modalConfig.fileName || ''}? This action cannot be undone.`
                        : 'Are you sure you want to restore the system from this backup? This action cannot be undone.'}
                    onConfirm={modalConfig.onConfirm}
                    onCancel={closeModal}
                    confirmText={modalConfig.type === 'delete' ? 'Delete' : 'Restore'}
                    loading={actionLoading}
                />

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
                            {activeTab === 'Back Up History' && (
                                <HistoryTab
                                    backupList={backupList}
                                    listLoading={listLoading}
                                    listError={listError}
                                    actionLoading={actionLoading}
                                    handleRestore={handleRestore}
                                    handleDelete={handleDelete}
                                    isAdmin={isAdmin}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackUpPage;
