import { useState, useEffect } from "react";
import { Folder, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import api from '../../config/ApiConfig';

const DestinationTab = () => {
    const [currentDir, setCurrentDir] = useState("");
    const [newDir, setNewDir] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [error, setError] = useState(null);

    // Ticket files directory state
    const [ticketFilesDir, setTicketFilesDir] = useState("");
    const [newTicketFilesDir, setNewTicketFilesDir] = useState("");
    const [ticketFilesLoading, setTicketFilesLoading] = useState(false);
    const [ticketFilesMsg, setTicketFilesMsg] = useState(null);
    const [ticketFilesError, setTicketFilesError] = useState(null);

    useEffect(() => {
        fetchCurrentDirectory();
        fetchTicketFilesDirectory();
    }, []);

    const fetchCurrentDirectory = async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/backup/directory");
            setCurrentDir(response.data.path);
            setNewDir(response.data.path);
        } catch (err) {
            setError(err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketFilesDirectory = async () => {
        setTicketFilesLoading(true);
        try {
            const response = await api.get("/repairTicket/ticketfiles/directory");
            setTicketFilesDir(response.data.path);
            setNewTicketFilesDir(response.data.path);
        } catch (err) {
            setTicketFilesError(err.response?.data || err.message);
        } finally {
            setTicketFilesLoading(false);
        }
    };

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

    const handleReset = () => {
        setNewDir(currentDir);
        setMsg(null);
        setError(null);
    };

    // Ticket files directory handlers
    const handleTicketFilesSave = async () => {
        setTicketFilesLoading(true);
        setTicketFilesMsg(null);
        setTicketFilesError(null);
        try {
            await api.post("/repairTicket/ticketfiles/directory", { path: newTicketFilesDir });
            setTicketFilesDir(newTicketFilesDir);
            setTicketFilesMsg("Ticket files directory updated successfully.");
        } catch (err) {
            setTicketFilesError(err.response?.data || err.message);
        } finally {
            setTicketFilesLoading(false);
            setTimeout(() => { setTicketFilesMsg(null); setTicketFilesError(null); }, 4000);
        }
    };

    const handleTicketFilesReset = () => {
        setNewTicketFilesDir(ticketFilesDir);
        setTicketFilesMsg(null);
        setTicketFilesError(null);
    };

    if ((loading && !currentDir) || (ticketFilesLoading && !ticketFilesDir)) {
        return <div className="text-center py-4"><p>Loading directory configuration...</p></div>;
    }

    return (
        <div className="space-y-6">
            {/* Backup Directory Section */}
            <div className="flex items-center">
                <Folder size={20} className="mr-2 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-700">Backup Directory Configuration</h3>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-100 text-red-700 flex items-center">
                    <AlertCircle size={20} className="mr-2 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {msg && (
                <div className="p-4 rounded-md bg-green-100 text-green-700 flex items-center">
                    <CheckCircle2 size={20} className="mr-2 shrink-0" />
                    <span>{msg}</span>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Important Information</h4>
                <p className="text-sm text-blue-700">
                    The backup directory path should be a valid directory path on the <strong>server</strong> where backups will be stored. 
                    This is not a local path on your computer, but rather a server-side file system path.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Backup Directory
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={currentDir}
                            readOnly
                            className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-600 cursor-not-allowed"
                            placeholder="No directory configured"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Folder size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        This is the currently active backup storage location.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Backup Directory
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={newDir}
                            onChange={e => setNewDir(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            aria-label="New backup directory (server-side path)"
                            placeholder="Enter server-side directory path (e.g., /var/backups/servit)"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Folder size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Enter the new server-side directory path where backup files should be stored.
                    </p>
                </div>
            </div>

            <div className="flex space-x-3">
                <button
                    onClick={handleSave}
                    disabled={loading || !newDir || newDir === currentDir}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <Save size={16} className="mr-2" />
                    {loading ? 'Updating...' : 'Update Directory'}
                </button>

                {newDir !== currentDir && (
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Ticket Files Directory Section */}
            <div className="flex items-center mt-10">
                <Folder size={20} className="mr-2 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-700">Ticket Files Directory Configuration</h3>
            </div>

            {ticketFilesError && (
                <div className="p-4 rounded-md bg-red-100 text-red-700 flex items-center">
                    <AlertCircle size={20} className="mr-2 shrink-0" />
                    <span>{ticketFilesError}</span>
                </div>
            )}
            {ticketFilesMsg && (
                <div className="p-4 rounded-md bg-green-100 text-green-700 flex items-center">
                    <CheckCircle2 size={20} className="mr-2 shrink-0" />
                    <span>{ticketFilesMsg}</span>
                </div>
            )}

            <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-800 mb-2">Important Information</h4>
                <p className="text-sm text-green-700">
                    The ticket files directory path is where all repair ticket images, digital signatures, and documents will be stored. This should be a valid directory path on the <strong>server</strong>.
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Ticket Files Directory
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={ticketFilesDir}
                            readOnly
                            className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-600 cursor-not-allowed"
                            placeholder="No directory configured"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Folder size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        This is the currently active ticket files storage location.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Ticket Files Directory
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={newTicketFilesDir}
                            onChange={e => setNewTicketFilesDir(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            aria-label="New ticket files directory (server-side path)"
                            placeholder="Enter server-side directory path (e.g., /var/servit/ticketfiles)"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <Folder size={16} className="text-gray-400" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Enter the new server-side directory path where ticket files should be stored.
                    </p>
                </div>
            </div>

            <div className="flex space-x-3">
                <button
                    onClick={handleTicketFilesSave}
                    disabled={ticketFilesLoading || !newTicketFilesDir || newTicketFilesDir === ticketFilesDir}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <Save size={16} className="mr-2" />
                    {ticketFilesLoading ? 'Updating...' : 'Update Directory'}
                </button>

                {newTicketFilesDir !== ticketFilesDir && (
                    <button
                        onClick={handleTicketFilesReset}
                        disabled={ticketFilesLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>

            <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Directory Requirements:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Must be a valid server-side file system path</li>
                    <li>The server application must have read/write permissions</li>
                    <li>Directory will be created automatically if it doesn't exist</li>
                    <li>Use forward slashes (/) for path separators on Unix/Linux systems</li>
                    <li>Use backslashes (\) for path separators on Windows systems</li>
                </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md">
                <h4 className="font-medium text-yellow-800 mb-2">Examples</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                    <p><strong>Linux/Unix:</strong> <code>/var/servit/ticketfiles</code> or <code>/home/user/ticketfiles</code></p>
                    <p><strong>Windows:</strong> <code>C:\TicketFiles\SERVIT</code> or <code>D:\Data\TicketFiles</code></p>
                    <p><strong>Relative:</strong> <code>./ticketfiles</code> or <code>../storage/ticketfiles</code></p>
                </div>
            </div>
        </div>
    );
};

export default DestinationTab; 