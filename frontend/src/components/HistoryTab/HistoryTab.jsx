import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Trash2, AlertCircle, CheckCircle2, History, Calendar, Clock } from "lucide-react";
import api from '../../config/ApiConfig';

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

const HistoryTab = () => {
    const [backupList, setBackupList] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({}); // { type, backupId, fileName, onConfirm }

    const userRole = getUserRole();
    const isAdmin = userRole === 'ADMIN';

    useEffect(() => {
        fetchBackupList();
        
        // Refresh list every 5 minutes
        const interval = setInterval(() => {
            fetchBackupList();
        }, 300000); // 5 minutes
        
        return () => clearInterval(interval);
    }, []);

    // Helper to convert UTC date string to user's local time zone and format
    const formatToLocal = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Use user's local time zone
        return date.toLocaleString();
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

    // Function to clear messages after a delay
    const clearMessages = () => {
        setActionError(null);
        setActionSuccessMessage(null);
    };

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

    const handleRefresh = () => {
        fetchBackupList();
    };

    if (listLoading && backupList.length === 0) {
        return <div className="text-center py-8"><p>Loading backup history...</p></div>;
    }

    return (
        <div className="space-y-6">
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

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <History size={20} className="mr-2 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-700">Backup History</h3>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={listLoading}
                    className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 transition-colors"
                >
                    <RotateCcw size={16} className={`mr-1 ${listLoading ? 'animate-spin' : ''}`} />
                    {listLoading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {actionError && (
                <div className="p-4 rounded-md bg-red-100 text-red-700 flex items-center">
                    <AlertCircle size={20} className="mr-2 shrink-0" />
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)} className="ml-auto text-red-700 underline">Dismiss</button>
                </div>
            )}
            {actionSuccessMessage && (
                <div className="p-4 rounded-md bg-green-100 text-green-700 flex items-center">
                    <CheckCircle2 size={20} className="mr-2 shrink-0" />
                    <span>{actionSuccessMessage}</span>
                    <button onClick={() => setActionSuccessMessage(null)} className="ml-auto text-green-700 underline">Dismiss</button>
                </div>
            )}

            {listError && (
                <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                        <AlertCircle size={48} className="mx-auto mb-2" />
                        <p className="font-medium">Error loading backup history</p>
                        <p className="text-sm">{listError}</p>
                    </div>
                    <button onClick={handleRefresh} className="text-blue-600 hover:underline">
                        Try Again
                    </button>
                </div>
            )}

            {!listError && backupList.length === 0 && !listLoading && (
                <div className="text-center py-12">
                    <History size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Backup Files Found</h4>
                    <p className="text-gray-500 mb-4">
                        There are no backup files available at this time. Create your first backup to see it here.
                    </p>
                </div>
            )}

            {!listError && backupList.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">Available Backups ({backupList.length})</h4>
                            <div className="text-sm text-gray-500">
                                {listLoading && <span className="italic">Updating...</span>}
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {backupList.map(({ fileName, id, backupDate }) => (
                            <div key={id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-gray-900 truncate">{fileName}</h5>
                                        <div className="flex items-center mt-1 text-sm text-gray-500">
                                            <Calendar size={14} className="mr-1" />
                                            <span>{formatToLocal(backupDate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 shrink-0">
                                        <button
                                            onClick={() => handleRestore(id)}
                                            disabled={actionLoading}
                                            className="flex items-center px-3 py-2 text-sm rounded-md text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 transition-colors"
                                            title="Restore from this backup"
                                        >
                                            <RotateCcw size={16} className="mr-1" />
                                            Restore
                                        </button>
                                        
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDelete(id, fileName)}
                                                disabled={actionLoading}
                                                className="flex items-center px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                                                title="Delete this backup"
                                            >
                                                <Trash2 size={16} className="mr-1" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Backup Management:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Backups are listed in descending order (newest first)</li>
                    <li>Restore operations will replace all current data</li>
                    <li>Only administrators can delete backup files</li>
                    <li>Restore operations require a sign-out and sign-in</li>
                    <li>List refreshes automatically every 5 minutes</li>
                </ul>
            </div>
        </div>
    );
};

export default HistoryTab; 