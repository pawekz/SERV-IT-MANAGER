import { Link } from "react-router-dom"
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import React, { useState, useEffect } from "react"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    PenLine,
    Trash2,
    CheckCheck,
    Activity
} from "lucide-react"

const UserManagement = () => {
    // Sample users data - in a real app this would come from an API
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [selectedStatus, setSelectedStatus] = useState('All Status');
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [tableMinHeight, setTableMinHeight] = useState("auto");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserEmail = userData.email;
    const [editIndex, setEditIndex] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updateStatus, setUpdateStatus] = useState({ success: false, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
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

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Not authenticated. Please log in.");
            }

            const response = await fetch(`${window.__API_BASE__}/user/getAllUsers`, {
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
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchUsers();
    }, []);


    // Set initial table height on component mount
    useEffect(() => {
        // Set a minimum table height based on initial content
        // Using a fixed height that accommodates ~5 rows + header
        setTableMinHeight("380px");
    }, []);

    // Filter users based on search term, selected role, and status
    useEffect(() => {
        let filtered = users;

        // Exclude current logged-in user
        if (currentUserEmail) {
            filtered = filtered.filter(user => user.email !== currentUserEmail);
        }

        // First filter by search term
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(user =>
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Then filter by role if not "All Roles"
        if (selectedRole !== 'All Roles') {
            filtered = filtered.filter(user => user.role.charAt(0).toUpperCase()+user.role.toLowerCase().slice(1) === selectedRole);
        }

        // Filter by status if not "All Status"
        if (selectedStatus !== 'All Status') {
            filtered = filtered.filter(user => user.status === selectedStatus);
        }

        setFilteredUsers(filtered);
    }, [searchTerm, selectedRole, selectedStatus, users]);

    // Handle search input change
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle role selection change
    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    // Handle status selection change
    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
    };

    // Handle details selection change
    const handleEdit = (row, index) => {
        setIsEditing(true);
        setEditIndex(index);
        setSelectedUser({ ...row });
        setEditFormData({
            firstName: row.firstName,
            lastName: row.lastName,
            userId: row.userId
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

            // Optional: refetch all users to refresh the list
            fetchUsers();

        } catch (err) {
            setError(err.message);
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

            // Optional: refetch all users to refresh the list
            fetchUsers();

        } catch (err) {
            setError(err.message);
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

    const handleSubmit = async (e) => {
        setIsSubmitting(true);
        setUpdateStatus({ success: false, message: '' });

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
            if (selectedUser.role.toUpperCase() !== editFormData.role.toUpperCase()) {
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
                setUpdateStatus({ success: true, message: "No changes to update." });
            } else {
                console.log("something changed");
                setUpdateStatus({ success: true, message: "Profile updated successfully." });
            }
            // <-- Exit edit mode
        } catch (err) {
            setUpdateStatus({
                success: false,
                message: err.message || "Failed to update profile. Please try again."
            });
        } finally {
            setIsSubmitting(false);
            fetchUsers();
            setIsEditing(false);
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
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">User Management</h1>
                    <p className="text-gray-600 text-base max-w-3xl">
                        Manage user accounts and control access by assigning appropriate roles. Role-Based Access Control (RBAC)
                        allows you to define permissions based on user roles.
                    </p>
                </div>

                <div>

                    <div className="flex justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full py-2 pl-9 pr-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#25D482] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                            />
                        </div>
                        <div className="flex gap-3 items-center">
                            <select
                                value={selectedStatus}
                                onChange={handleStatusChange}
                                className="py-2 px-4 border border-gray-300 rounded-md bg-white text-sm min-w-[150px] focus:outline-none focus:border-[#25D482] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                            >
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Pending</option>
                                <option>Inactive</option>
                            </select>
                            <select
                                value={selectedRole}
                                onChange={handleRoleChange}
                                className="py-2 px-4 border border-gray-300 rounded-md bg-white text-sm min-w-[150px] focus:outline-none focus:border-[#25D482] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                            >
                                <option>All Roles</option>
                                <option>Admin</option>
                                <option>Customer</option>
                                <option>Technician</option>
                            </select>
                            {/* Create Employee button (visible to Admins as this page is admin-only) */}
                            <Link
                                to="/employee-signup"
                                className="bg-[#25D482] hover:bg-[#1fab6b] transition text-white text-sm font-medium py-2 px-4 rounded-md whitespace-nowrap"
                            >
                                Create Employee
                            </Link>
                        </div>
                    </div>

                    <div
                        className="bg-white rounded-lg shadow-sm overflow-hidden mb-6"
                        style={{ minHeight: tableMinHeight }}
                    >
                        <table className="w-full border-collapse">
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
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500">
                                            No users matching your search criteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((currentUsers, index) => (
                                        <tr key={currentUsers.userId}>
                                            <td className="p-4 border-b border-gray-200">
                                                <div className="flex">
                                                {editIndex === index ? (
                                                    <input
                                                        type="text"
                                                        name="firstName"
                                                        value={editFormData.firstName}
                                                        onChange={handleInputChange}
                                                        className="border rounded px-2 py-1 w-50"
                                                    />
                                                ) : (
                                                   <span>{currentUsers.firstName}</span>
                                                )}
                                                {editIndex === index ? (
                                                    <input
                                                        type="text"
                                                        name="lastName"
                                                        value={editFormData.lastName}
                                                        onChange={handleInputChange}
                                                        className="border rounded px-2 py-1 w-50"
                                                    />
                                                ) : (
                                                    <span className="pl-2">{currentUsers.lastName}</span>
                                                )}
                                                </div>
                                            </td>
                                            <td className="p-4 border-b border-gray-200">
                                                {currentUsers.email}
                                            </td>
                                            <td className="p-4 border-b border-gray-200">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(currentUsers.status)}`}>
                                                    {currentUsers.status}
                                                </span>
                                            </td>
                                            <td className="p-4 border-b border-gray-200 text-gray-800">
                                                {editIndex === index ? (
                                                        <select  name="role"
                                                                 value={editFormData.role}
                                                                 onChange={handleInputChange}
                                                                 className="w-full py-2 px-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:border-[#25D482] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                                        >
                                                            <option hidden>
                                                                {currentUsers.role.charAt(0).toUpperCase()+currentUsers.role.toLowerCase().slice(1)}
                                                            </option>
                                                            <option>Admin</option>
                                                            <option>Customer</option>
                                                            <option>Technician</option>
                                                        </select>
                                                ) : (
                                                    currentUsers.role.charAt(0).toUpperCase()+currentUsers.role.toLowerCase().slice(1)
                                                )}
                                            </td>
                                            <td className="p-4 border-b border-gray-200">
                                                <div className="flex gap-2">
                                                    {/*Edit button*/}
                                                    {editIndex === index ? (
                                                        <button className="flex items-center justify-center w-8 h-8 rounded bg-green-100 text-[#25D482] border-none cursor-pointer transition-all hover:bg-gray-200" onClick={() => handleSubmit(currentUsers, index)} >
                                                            <CheckCheck size={16} />
                                                        </button>

                                                    ) : (
                                                        <button className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 text-gray-600 border-none cursor-pointer transition-all hover:bg-gray-200" onClick={() => handleEdit(currentUsers, index)} >
                                                            <PenLine size={16} />
                                                        </button>
                                                    )}
                                                    {/*Delete button*/}
                                                    {currentUsers.status === "Inactive" ? (
                                                        <button
                                                            className="flex items-center justify-center w-8 h-8 rounded bg-green-100 text-[#25D482] border-none cursor-pointer transition-all hover:bg-red-100"
                                                            onClick={() => handleReactivate(currentUsers)}
                                                        >
                                                            <Activity size={16} />
                                                        </button>
                                                    ) : currentUsers.status === "Active" ? (
                                                        <button
                                                            className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-500 border-none cursor-pointer transition-all hover:bg-red-100"
                                                            onClick={() => handleDelete(currentUsers)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-gray-700 border-none cursor-pointer transition-all hover:bg-red-100"
                                                            disabled
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center py-4">
                        <div className="text-gray-600 text-sm">
                            <span>
                              Showing {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} to{' '}
                                {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`flex items-center justify-center min-w-8 h-8 rounded border border-gray-300 text-sm ${
                                    currentPage === 1
                                        ? 'bg-white text-gray-400 cursor-not-allowed opacity-50'
                                        : 'bg-white text-gray-600 hover:border-[#25D482] hover:text-[#25D482]'
                                }`}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                const pageNum = index + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`flex items-center justify-center min-w-8 h-8 rounded text-sm ${
                                            currentPage === pageNum
                                                ? 'bg-[#25D482] text-white border-none'
                                                : 'bg-white text-gray-600 border border-gray-300 hover:border-[#25D482] hover:text-[#25D482]'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`flex items-center justify-center min-w-8 h-8 rounded border border-gray-300 text-sm ${
                                    currentPage === totalPages
                                        ? 'bg-white text-gray-400 cursor-not-allowed opacity-50'
                                        : 'bg-white text-gray-600 hover:border-[#25D482] hover:text-[#25D482]'
                                }`}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserManagement

