import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import {
    LayoutGrid,
    Users,
    FolderKanban,
    UserCog,
    ShieldCheck,
    Settings,
    BarChart3,
    ClipboardList,
    Search,
    ChevronLeft,
    ChevronRight,
    PenLine,
    Trash2,
    Plus,
} from "lucide-react"

const UserManagement = () => {
    // Sample users data - in a real app this would come from an API
    const [users, setUsers] = useState([
        {
            id: 1,
            name: "John Doe",
            email: "john.doe@ioconnect.com",
            role: "Admin"
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane.smith@ioconnect.com",
            role: "Manager"
        },
        {
            id: 3,
            name: "Robert Johnson",
            email: "robert.johnson@ioconnect.com",
            role: "User"
        },
        {
            id: 4,
            name: "Emily Davis",
            email: "emily.davis@ioconnect.com",
            role: "Guest"
        },
        {
            id: 5,
            name: "Michael Wilson",
            email: "michael.wilson@ioconnect.com",
            role: "User"
        }
    ]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [tableMinHeight, setTableMinHeight] = useState("auto");
    
    // Set initial table height on component mount
    useEffect(() => {
        // Set a minimum table height based on initial content
        // Using a fixed height that accommodates ~5 rows + header
        setTableMinHeight("380px"); 
    }, []);
    
    // Filter users based on search term and selected role
    useEffect(() => {
        let filtered = users;
        
        // First filter by search term
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Then filter by role if not "All Roles"
        if (selectedRole !== 'All Roles') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }
        
        setFilteredUsers(filtered);
    }, [searchTerm, selectedRole, users]);
    
    // Handle search input change
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    
    // Handle role selection change
    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };
    
    return (
        <div className="flex min-h-screen font-['Poppins',sans-serif]">
            {/* Sidebar */}
            <div className="fixed w-[250px] bg-white border-r border-gray-200 flex flex-col h-screen z-10">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">
                        IO<span className="text-[#33e407]">CONNECT</span>
                    </h1>
                </div>

                <nav className="flex-1 py-4 overflow-y-auto">
                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
                        <ul>
                            <li className="mb-1">
                                <Link to="/dashboard" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <LayoutGrid size={18} className="mr-3" />
                                    <span>Dashboard</span>
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/users" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <Users size={18} className="mr-3" />
                                    <span>Users</span>
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/projects" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <FolderKanban size={18} className="mr-3" />
                                    <span>Projects</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">ADMINISTRATION</h2>
                        <ul>
                            <li className="mb-1">
                                <Link to="/user-management" className="flex items-center px-6 py-3 bg-[rgba(51,228,7,0.1)] text-[#33e407] font-medium border-l-3 border-[#33e407]">
                                    <UserCog size={18} className="mr-3" />
                                    <span>User Management</span>
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/roles" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <ShieldCheck size={18} className="mr-3" />
                                    <span>Roles & Permissions</span>
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/settings" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <Settings size={18} className="mr-3" />
                                    <span>Settings</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">REPORTS</h2>
                        <ul>
                            <li className="mb-1">
                                <Link to="/analytics" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <BarChart3 size={18} className="mr-3" />
                                    <span>Analytics</span>
                                </Link>
                            </li>
                            <li className="mb-1">
                                <Link to="/audit-logs" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                                    <ClipboardList size={18} className="mr-3" />
                                    <span>Audit Logs</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200 flex items-center">
                    <div className="w-9 h-9 bg-[#e6f9e6] text-[#33e407] rounded-md flex items-center justify-center font-semibold mr-3">
                        <span>AD</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 m-0">Admin User</h3>
                        <p className="text-xs text-gray-500 m-0">Administrator</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 ml-[250px] bg-gray-50">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">User Management</h1>
                    <p className="text-gray-600 text-base max-w-3xl">
                        Manage user accounts and control access by assigning appropriate roles. Role-Based Access Control (RBAC)
                        allows you to define permissions based on user roles.
                    </p>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 m-0">Users</h2>
                        <button className="flex items-center bg-[#33e407] text-white border-none rounded px-4 py-2 font-medium cursor-pointer transition-colors hover:bg-[#2bc706]">
                            <Plus size={16} className="mr-2" />
                            <span>Add User</span>
                        </button>
                    </div>

                    <div className="flex justify-between mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full py-2 pl-9 pr-4 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                            />
                        </div>
                        <div className="flex gap-4">
                            <select 
                                value={selectedRole}
                                onChange={handleRoleChange}
                                className="py-2 px-4 border border-gray-300 rounded-md bg-white text-sm min-w-[150px] focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                            >
                                <option>All Roles</option>
                                <option>Admin</option>
                                <option>Manager</option>
                                <option>User</option>
                                <option>Guest</option>
                            </select>
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
                                    <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Current Role</th>
                                    <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Assign Role</th>
                                    <th className="bg-gray-50 text-left p-4 font-semibold text-gray-600 text-sm border-b border-gray-200">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="relative">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-4 text-center text-gray-500">
                                            No users matching your search criteria
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="p-4 border-b border-gray-200 text-gray-800">{user.name}</td>
                                            <td className="p-4 border-b border-gray-200 text-gray-800">{user.email}</td>
                                            <td className="p-4 border-b border-gray-200 text-gray-800">{user.role}</td>
                                            <td className="p-4 border-b border-gray-200">
                                                <select className="w-full py-2 px-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]">
                                                    <option>{user.role}</option>
                                                    <option>Admin</option>
                                                    <option>Manager</option>
                                                    <option>User</option>
                                                    <option>Guest</option>
                                                </select>
                                            </td>
                                            <td className="p-4 border-b border-gray-200">
                                                <div className="flex gap-2">
                                                    {/*Edit button*/}
                                                    <button className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 text-gray-600 border-none cursor-pointer transition-all hover:bg-gray-200">
                                                        <PenLine size={16} />
                                                    </button>
                                                    {/*Delete button*/}
                                                    <button className="flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-500 border-none cursor-pointer transition-all hover:bg-red-100">
                                                        <Trash2 size={16} />
                                                    </button>
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
                            <span>Showing {filteredUsers.length > 0 ? '1' : '0'} to {filteredUsers.length} of {users.length} entries</span>
                        </div>
                        <div className="flex gap-1">
                            <button disabled className="flex items-center justify-center min-w-8 h-8 rounded border border-gray-300 bg-white text-gray-600 text-sm opacity-50 cursor-not-allowed">
                                <ChevronLeft size={16} />
                            </button>
                            <button className="flex items-center justify-center min-w-8 h-8 rounded border border-none bg-[#33e407] text-white text-sm cursor-pointer">1</button>
                            <button className="flex items-center justify-center min-w-8 h-8 rounded border border-gray-300 bg-white text-gray-600 text-sm cursor-pointer hover:border-[#33e407] hover:text-[#33e407]">2</button>
                            <button className="flex items-center justify-center min-w-8 h-8 rounded border border-gray-300 bg-white text-gray-600 text-sm cursor-pointer hover:border-[#33e407] hover:text-[#33e407]">3</button>
                            <button className="flex items-center justify-center min-w-8 h-8 rounded border border-gray-300 bg-white text-gray-600 text-sm cursor-pointer hover:border-[#33e407] hover:text-[#33e407]">
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

