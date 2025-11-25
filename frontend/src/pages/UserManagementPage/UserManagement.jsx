import Sidebar from "../../components/SideBar/Sidebar.jsx";
import React, { useState, useEffect } from "react"
import { PenLine, Trash2, CheckCheck, Activity } from "lucide-react"
import Toast from "../../components/Toast/Toast.jsx";
import CreateEmployeeModal from "../../components/CreateEmployeeModal/CreateEmployeeModal.jsx";

const UserManagement = () => {
    // Sample users data - in a real app this would come from an API
    const [users, setUsers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserEmail = userData.email;
    const currentUserId = userData.userId || null;
    const [editIndex, setEditIndex] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // 1-based for UI
    const [pageSize, setPageSize] = useState(10); // configurable page size (Per Page)
    const [totalEntries, setTotalEntries] = useState(0);
    const [serverTotalPages, setServerTotalPages] = useState(1);

    // Toast state for global success/error messages
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    // modal state for create employee
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Derived paging indices (server-side pagination)
    const indexOfFirstUser = (currentPage - 1) * pageSize;
    const currentUsers = filteredUsers || users; // filteredUsers is derived from users (current page)
    const totalPages = serverTotalPages || 1;

    const [selectedUser, setSelectedUser] = useState({
        firstName: '',
        lastName: '',
        userId:''
    });
    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        userId:''
    });

    const fetchUsers = async (page = currentPage) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            // backend expects 0-based page index
            const params = new URLSearchParams({ page: String(Math.max(0, page - 1)), size: String(pageSize) });
            const response = await fetch(`${window.__API_BASE__}/user/getAllUsers?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Spring Page shape: { content: [...], totalElements, totalPages, number }
            const content = data.content || data;
            setUsers(content || []);
            setFilteredUsers(content || []);
            setTotalEntries(data.totalElements ?? data.total ?? (content ? content.length : 0));
            setServerTotalPages(data.totalPages ?? Math.max(1, Math.ceil((content?.length || 0) / pageSize)));
            // sync currentPage to server-provided page (number is 0-based)
            const serverPageNumber = (typeof data.number === 'number') ? data.number : (page - 1);
            setCurrentPage(serverPageNumber + 1);
        } catch (err) {
            const msg = err.message || 'Error fetching users.';
            setError(msg);
            setToastMessage(msg);
            setToastType('error');
            setToastShow(true);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        // fetch when component mounts and whenever currentPage or pageSize changes
        fetchUsers(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize]);


    // derive role & status options from loaded users
    const roleOptions = ['All Roles', ...Array.from(new Set(users.map(u => (u.role || '').toString().trim()).filter(Boolean))).map(r => (r.charAt(0).toUpperCase() + r.toLowerCase().slice(1)) )];
    const statusOptions = ['All Status', ...Array.from(new Set(users.map(u => (u.status || '').toString().trim()).filter(Boolean)))];

    // Filter users based on search term, selected role, and status
    useEffect(() => {
        let filtered = users || [];

        // Exclude current logged-in user
        // Keep userId 1 (initial admin) visible even if it's the logged-in user.
        // Otherwise, exclude the current logged-in user from the list.
        if (currentUserEmail) {
            filtered = filtered.filter(user => (user.email !== currentUserEmail) || String(user.userId) === String(1));
        }

        // First filter by search term
        if (appliedSearchTerm.trim() !== '') {
            const q = appliedSearchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                (user.email || '').toLowerCase().includes(q) ||
                ((user.firstName || '') + ' ' + (user.lastName || '')).toLowerCase().includes(q)
            );
        }

        // Then filter by role if not "All Roles"
        if (selectedRole && selectedRole !== 'All Roles') {
            filtered = filtered.filter(user => (user.role || '').charAt(0).toUpperCase()+ (user.role || '').toLowerCase().slice(1) === selectedRole);
        }

        // Filter by status if not "All Status"
        if (selectedStatus && selectedStatus !== 'All Status') {
            filtered = filtered.filter(user => user.status === selectedStatus);
        }

        setFilteredUsers(filtered);
    }, [appliedSearchTerm, selectedRole, selectedStatus, users, currentUserEmail]);

    // Handle search input change
    const handleSearchInput = (e) => {
        setSearchInput(e.target.value);
    };

    const handleSearch = () => {
        const trimmed = searchInput.trim();
        setAppliedSearchTerm(trimmed);
        fetchUsers(1);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        setAppliedSearchTerm('');
        fetchUsers(1);
    };

    // Handle role selection change
    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    // Handle status selection change
    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
    };

    // Handle per-page change
    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value, 10) || 10;
        setPageSize(newSize);
        // fetchUsers will be triggered by useEffect when pageSize changes
        setCurrentPage(1);
    };

    // Handle details selection change
    const handleEdit = (row/*, index*/) => {
        // Use userId as the edit marker so it remains stable across pages
        setEditIndex(row.userId);
        setSelectedUser({ ...row });
        setEditFormData({
            firstName: row.firstName,
            lastName: row.lastName,
            userId: row.userId,
            role: row.role
        });
    };

    // Handle deactive account
    const handleDelete = async (row) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            const response = await fetch(`${window.__API_BASE__}/user/updateStatus/${row.userId}`, {
                method: 'PATCH', // Use PATCH or PUT for updates
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "Inactive"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Optional: refetch current page
            fetchUsers(currentPage);

            // show success toast
            setToastMessage('User deactivated successfully.');
            setToastType('success');
            setToastShow(true);
        } catch (err) {
            const msg = err.message || 'Failed to deactivate user.';
            setError(msg);
            setToastMessage(msg);
            setToastType('error');
            setToastShow(true);
        } finally {
            setLoading(false);
        }
    };

    // Handle reactivating account
    const handleReactivate = async (row) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            const response = await fetch(`${window.__API_BASE__}/user/updateStatus/${row.userId}`, {
                method: 'PATCH', // Use PATCH or PUT for updates
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "Active"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Optional: refetch current page
            fetchUsers(currentPage);

            setToastMessage('User reactivated successfully.');
            setToastType('success');
            setToastShow(true);
        } catch (err) {
            const msg = err.message || 'Failed to reactivate user.';
            setError(msg);
            setToastMessage(msg);
            setToastType('error');
            setToastShow(true);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    // Status styling based on status value
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-700';
            case 'Pending':
                return 'bg-orange-100 text-orange-700';
            case 'Inactive':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            // Track update success
            let nameUpdated = false;
            let roleUpdated = false;

            // Update name if changed
            console.log("checking change");

            if (
                selectedUser.firstName !== editFormData.firstName ||
                selectedUser.lastName !== editFormData.lastName
            ) {
                const nameResponse = await fetch(`${window.__API_BASE__}/user/updateFullName/${editFormData.userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        newFirstName: editFormData.firstName,
                        newLastName: editFormData.lastName
                    })
                });

                if (!nameResponse.ok) {
                    const errorText = await nameResponse.text();
                    throw new Error(errorText || "Failed to update name");
                }
                nameUpdated = true;
                console.log("name changed");

            }

            // Only update role if changed
            if (selectedUser.role && editFormData.role && selectedUser.role.toUpperCase() !== editFormData.role.toUpperCase()) {
                const roleResponse = await fetch(`${window.__API_BASE__}/user/changeRole/${editFormData.userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        role: editFormData.role.toUpperCase()
                    })
                });

                if (!roleResponse.ok) {
                    const errorText = await roleResponse.text();
                    throw new Error(errorText || "Failed to update role");
                }
                console.log("role changed");
                roleUpdated = true;
            }


            if (!nameUpdated && !roleUpdated) {
                console.log("no changed");
                setToastMessage("No changes to update.");
                setToastType('info');
                setToastShow(true);
            } else {
                console.log("something changed");
                setToastMessage("Profile updated successfully.");
                setToastType('success');
                setToastShow(true);
            }
            // <-- Exit edit mode
        } catch (err) {
            const msg = err.message || "Failed to update profile. Please try again.";
            setToastMessage(msg);
            setToastType('error');
            setToastShow(true);
        } finally {
            setIsSubmitting(false);
            fetchUsers(currentPage);
            setEditIndex(null);
        }
    };


    return (
        <div className="flex min-h-screen flex-col md:flex-row font-['Poppins',sans-serif]">

            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'usermanagement'}/>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 bg-gray-50">
                <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="md:flex-1">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">User Management</h1>
                        <p className="text-gray-600 text-base max-w-3xl">
                            Manage user accounts and control access by assigning appropriate roles. Role-Based Access Control (RBAC)
                            allows you to define permissions based on user roles.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center py-2 px-4 rounded-md font-medium transition-all text-white bg-[#2563eb] hover:bg-[#1e49c7]"
                        >
                            Create Employee
                        </button>
                    </div>
                </div>

                {/* Create Employee Modal */}
                <CreateEmployeeModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => fetchUsers(1)} />

                <div>
                    {/* Card Container similar to HistoryPage */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
                        {/* Header / Controls */}
                        <div className="px-6 py-5 border-b border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                    Users
                                    <span className="text-sm font-normal text-gray-500">({filteredUsers.length})</span>
                                </h2>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full lg:w-auto">
                                <div className="flex flex-1 min-w-[220px] items-center gap-2 flex-col sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-2 w-full sm:flex-1">
                                        <input
                                            type="text"
                                            placeholder={'Search by email or name...'}
                                        value={searchInput}
                                            aria-label="Search users"
                                            onChange={handleSearchInput}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#1e49c7]"
                                        />
                                        {searchInput && (
                                            <button
                                                onClick={handleClearSearch}
                                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                                aria-label="Clear search"
                                            >Clear</button>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleSearch}
                                        className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-[#2563eb] text-white rounded-md hover:bg-[#1e49c7] text-sm font-medium"
                                    >Search</button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-gray-600">Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={handleStatusChange}
                                        className="px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                                    >
                                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-gray-600">Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={handleRoleChange}
                                        className="px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                                    >
                                        {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-medium text-gray-600">Per Page</label>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="px-2 py-2 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                                    >
                                        {[5,10,20].map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Body / Table */}
                        <div className="overflow-x-auto">
                            {/* global toast for success/error messages (renders fixed bottom-right) */}
                            <Toast show={toastShow} message={toastMessage} type={toastType} onClose={() => setToastShow(false)} duration={3500} />

                            {/* loading / error states */}
                            {loading ? (
                                 <div className="text-center text-gray-500 py-16">Loading users...</div>
                             ) : error ? (
                                 <div className="text-center text-red-500 py-16">{error}</div>
                             ) : (
                             <table className="w-full border-collapse min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Name</th>
                                        <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Email</th>
                                        <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Status</th>
                                        <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Role</th>
                                        <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="relative">
                                    {(!filteredUsers || filteredUsers.length === 0) ? (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-500">
                                                No users matching your search criteria
                                            </td>
                                        </tr>
                                    ) : (
                                        currentUsers.map((user) => {
                                             const isSelf = String(user.userId) === String(currentUserId);
                                             return (
                                                <tr key={user.userId}>
                                                    <td className="p-4 border-b border-gray-200">
                                                        <div className="flex">
                                                            {editIndex === user.userId ? (
                                                                 <input
                                                                     type="text"
                                                                     name="firstName"
                                                                     value={editFormData.firstName}
                                                                     onChange={handleInputChange}
                                                                     className="border rounded px-2 py-1 w-50"
                                                                 />
                                                            ) : (
                                                                <span>{user.firstName}</span>
                                                            )}
                                                            {editIndex === user.userId ? (
                                                                 <input
                                                                     type="text"
                                                                     name="lastName"
                                                                     value={editFormData.lastName}
                                                                     onChange={handleInputChange}
                                                                     className="border rounded px-2 py-1 w-50"
                                                                 />
                                                            ) : (
                                                                <span className="pl-2">{user.lastName}</span>
                                                            )}
                                                         </div>
                                                     </td>
                                                     <td className="p-4 border-b border-gray-200">{user.email}</td>
                                                     <td className="p-4 border-b border-gray-200">
                                                         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(user.status)}`}>
                                                             {user.status}
                                                         </span>
                                                     </td>
                                                     <td className="p-4 border-b border-gray-200 text-gray-800">
                                                        {editIndex === user.userId ? (
                                                             <select
                                                                 name="role"
                                                                 value={editFormData.role}
                                                                 onChange={handleInputChange}
                                                                 className="w-full py-2 px-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:border-[#25D482] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                                             >
                                                                 <option hidden>{user.role && (user.role.charAt(0).toUpperCase() + user.role.toLowerCase().slice(1))}</option>
                                                                 <option>Admin</option>
                                                                 <option>Customer</option>
                                                                 <option>Technician</option>
                                                             </select>
                                                         ) : (
                                                             user.role && (user.role.charAt(0).toUpperCase() + user.role.toLowerCase().slice(1))
                                                         )}
                                                     </td>
                                                     <td className="p-4 border-b border-gray-200">
                                                         <div className="flex gap-2">
                                                            {editIndex === user.userId ? (
                                                                 <button
                                                                     className="flex items-center justify-center w-8 h-8 rounded bg-green-100 text-[#25D482] border-none cursor-pointer transition-all hover:bg-gray-200"
                                                                     onClick={() => handleSubmit()}
                                                                     disabled={isSelf || isSubmitting}
                                                                     title={isSelf ? "You cannot edit your own account." : (isSubmitting ? 'Saving...' : 'Save changes')}
                                                                 >
                                                                     <CheckCheck size={16} />
                                                                 </button>
                                                             ) : (
                                                                 <button
                                                                    className={`flex items-center justify-center w-8 h-8 rounded ${isSelf ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} border-none transition-all`}
                                                                    onClick={() => !isSelf && handleEdit(user /*, index*/)}
                                                                    disabled={isSelf}
                                                                    title={isSelf ? "You cannot edit your own account." : "Edit user"}
                                                                 >
                                                                     <PenLine size={16} />
                                                                 </button>
                                                             )}

                                                            {isSelf ? (
                                                                <button
                                                                    className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 text-gray-400 border-none cursor-not-allowed"
                                                                    disabled
                                                                    title="You cannot deactivate/reactivate your own account."
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            ) : user.status === 'Inactive' ? (
                                                                <button
                                                                    className="flex items-center justify-center w-8 h-8 rounded bg-green-100 text-[#25D482] border-none cursor-pointer transition-all hover:bg-red-100"
                                                                    onClick={() => handleReactivate(user)}
                                                                >
                                                                    <Activity size={16} />
                                                                </button>
                                                            ) : user.status === 'Active' ? (
                                                                <button
                                                                    className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-500 border-none cursor-pointer transition-all hover:bg-red-100"
                                                                    onClick={() => handleDelete(user)}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            ) : (
                                                                <button className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-gray-700 border-none cursor-pointer transition-all hover:bg-red-100" disabled>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            )}

                             {/* Pagination area similar to HistoryPage's renderPagination */}
                             <div className="mt-6 flex items-center justify-between px-4 pb-5">
                                 <div className="text-gray-600 text-sm">
                                     <span>
                                       {(() => {
                                           const total = totalEntries || 0;
                                           const start = total > 0 ? indexOfFirstUser + 1 : 0;
                                           const end = Math.min(indexOfFirstUser + (filteredUsers?.length || 0), total);
                                           return `Showing ${start} to ${end} of ${total} entries`;
                                       })()}
                                     </span>
                                 </div>
                                 <div className="flex gap-2 items-center">
                                     <button
                                         onClick={() => fetchUsers(Math.max(currentPage - 1, 1))}
                                         disabled={currentPage === 1}
                                         className={`px-3 py-1.5 rounded-md text-xs font-medium border ${currentPage === 1 ? 'bg-white text-gray-400 cursor-not-allowed opacity-50' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                     >Prev</button>

                                     {/* Compact page number buttons (up to 5 centered) */}
                                     {(() => {
                                         const pages = [];
                                         const maxButtons = 5;
                                         let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                                         let end = start + maxButtons - 1;
                                         if (end > totalPages) {
                                             end = totalPages;
                                             start = Math.max(1, end - maxButtons + 1);
                                         }
                                         for (let i = start; i <= end; i++) {
                                             pages.push(
                                                 <button
                                                     key={i}
                                                     onClick={() => fetchUsers(i)}
                                                     className={`px-3 py-1.5 rounded-md text-xs font-medium border ${i === currentPage ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                                 >{i}</button>
                                             );
                                         }
                                         return pages;
                                     })()}

                                    <button
                                        onClick={() => fetchUsers(Math.min(currentPage + 1, serverTotalPages))}
                                        disabled={currentPage === serverTotalPages}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium border ${currentPage === totalPages ? 'bg-white text-gray-400 cursor-not-allowed opacity-50' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                                    >Next</button>
                                 </div>
                             </div>

                         </div>
                     </div>
                 </div>
             </div>
         </div>
     )
 }

 export default UserManagement
