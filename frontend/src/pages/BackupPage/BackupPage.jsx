import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { HardDriveDownload, AlertCircle, Upload } from "lucide-react";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import BackupScheduleTab from "../../components/BackupScheduleTab/BackupScheduleTab.jsx";
import BackupHistoryTab from "../../components/BackupHistoryTab/BackupHistoryTab.jsx";
import api from '../../config/ApiConfig';
import Toast from "../../components/Toast/Toast";

const tabTitles = [
    'Schedule',
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

const BackupPage = () => {
    const [initialLoading, setInitialLoading] = useState(false); // For initial page data if any
    const [initialError, setInitialError] = useState(null); // For initial page data error

    const [activeTab, setActiveTab] = useState(tabTitles[0]);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [toastS3Key, setToastS3Key] = useState(null);

    const navigate = useNavigate();
    const [tokenExpiredModal, setTokenExpiredModal] = useState(false);
    const fileInputRef = useRef(null);
    const [uploadRestoreLoading, setUploadRestoreLoading] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const userRole = getUserRole();
    const isAdmin = userRole === 'ADMIN';

    // Function to clear messages after a delay
    const clearMessages = () => {
        setActionError(null);
        setShowToast(false);
        setToastMessage("");
        setToastS3Key(null);
    };

    const handleManualBackup = async () => {
        setActionLoading(true);
        setActionError(null);
        setShowToast(false);
        setToastMessage("");
        setToastS3Key(null);
        try {
            const response = await api.post("/api/backup/now");
            const data = response.data || "Backup created successfully.";
            if (typeof data === "object" && data.message) {
                setToastMessage(data.message);
            } else {
                setToastMessage(typeof data === "string" ? data : "Backup created successfully.");
            }
            if (typeof data === "object" && data.s3Key) {
                setToastS3Key(data.s3Key);
            }
            setToastType("success");
            setShowToast(true);
        } catch (err) {
            setActionError(err.response?.data || err.message);
        } finally {
            setActionLoading(false);
            setTimeout(clearMessages, 5000);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.sql')) {
            setActionError("Only .sql files are allowed");
            setTimeout(clearMessages, 5000);
            return;
        }
        
        setSelectedFile(file);
        setShowRestoreConfirm(true);
    };

    const handleUploadRestore = async () => {
        if (!selectedFile) return;
        
        setShowRestoreConfirm(false);
        setUploadRestoreLoading(true);
        setActionError(null);
        setShowToast(false);
        setToastMessage("");
        setToastS3Key(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const response = await api.post("/api/backup/restore-upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const data = response.data;
            setToastMessage(data.message || "Restore completed successfully");
            setToastType("success");
            setShowToast(true);
            
            // If restore requires sign out
            if (data.requireSignout) {
                setTimeout(() => {
                    localStorage.removeItem('authToken');
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setActionError(err.response?.data?.message || err.response?.data || err.message);
        } finally {
            setUploadRestoreLoading(false);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(clearMessages, 5000);
        }
    };

    const cancelUploadRestore = () => {
        setShowRestoreConfirm(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">
            {/* Token Expired Modal */}
            {tokenExpiredModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 shadow-xl text-center">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Session Expired</h3>
                        <p className="text-gray-600">Your session has expired. Please log in again.<br/>Redirecting to login...</p>
                    </div>
                </div>
            )}
            {/* Restore from File Confirmation Modal */}
            {showRestoreConfirm && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">Restore from File</h3>
                        <p className="mb-2 text-gray-700">
                            Are you sure you want to restore the system from:
                        </p>
                        <p className="mb-4 text-sm font-medium text-blue-600 break-all">
                            {selectedFile?.name}
                        </p>
                        <p className="mb-4 text-sm text-red-600">
                            ⚠️ This will replace all current data. You will be signed out after the restore completes.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={cancelUploadRestore}
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUploadRestore}
                                className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600"
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'backup'}/>
            </div>
            <div className="flex-1 p-8 bg-gray-50">
                <div className="flex flex-wrap justify-between items-center mb-6">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Back Up and Restore</h1>
                        <p className="text-gray-600 text-base max-w-3xl">
                            Manually create database backups, schedule automatic backups, and restore from existing backup points.
                        </p>
                    </div>
                    <div className="shrink-0 flex gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".sql"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadRestoreLoading || actionLoading}
                            className="flex items-center py-3 px-6 rounded-md font-medium transition-all text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400"
                        >
                            <Upload className="mr-2" size={20} />
                            {uploadRestoreLoading ? 'Restoring...' : 'Restore from File'}
                        </button>
                        <button
                            onClick={handleManualBackup}
                            disabled={actionLoading || uploadRestoreLoading}
                            className="flex items-center py-3 px-6 rounded-md font-medium transition-all text-white bg-[#2563eb] hover:bg-[#1e49c7] disabled:bg-gray-400"
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
                {showToast && (
                    <Toast
                        show={showToast}
                        message={toastMessage}
                        type={toastType}
                        onClose={() => setShowToast(false)}
                        duration={3500}
                    >
                        {toastS3Key && (
                            <div className="mt-2 text-xs text-gray-700">
                                <strong>S3 Key:</strong> {toastS3Key}
                            </div>
                        )}
                    </Toast>
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
                                            ? 'border-b-2 border-[#1e49c7] text-[#1e49c7]'
                                            : 'text-gray-600 hover:text-[#1e49c7]'
                                    }`}
                                    onClick={() => setActiveTab(title)}
                                >
                                    {title}
                                </button>
                            ))}
                        </div>

                        <div className="p-6">
                            {activeTab === 'Schedule' && <BackupScheduleTab />}
                            {activeTab === 'Back Up History' && <BackupHistoryTab />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackupPage;
