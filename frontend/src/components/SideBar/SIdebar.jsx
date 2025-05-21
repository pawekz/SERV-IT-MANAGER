import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutGrid,
    Users,
    FolderKanban,
    UserCog,
    ShieldCheck,
    Settings,
    BarChart3,
    ClipboardList, LogOut,
} from 'lucide-react';


const Sidebar = ({ activePage }) => {
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showLogoutMenu, setShowLogoutMenu] = useState(false);
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

    const toggleLogoutMenu = () => {
        setShowLogoutMenu(prev => !prev);
    };

    const handleLogout = () => {

        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('userData');
        window.location.href = '/login';
    };

    const linkClass = (page) =>
        `flex items-center px-6 py-3 transition-all duration-200 ${
            activePage === page
                ? 'bg-[rgba(51,228,7,0.1)] text-[#33e407] font-semibold'
                : 'text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407]'
        }`;

    const customerLinks = (
        <>
            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
            <li className="mb-1">
                <Link to="/dashboard" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                    <LayoutGrid size={18} className="mr-3" />
                    <span>Dashboard</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/repairs" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                    <ClipboardList size={18} className="mr-3" />
                    <span>Repair Tickets</span>
                </Link>
            </li>
        </>
    );

    const technicianLinks = (
        <>
            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
            <li className="mb-1">
                <Link to="/dashboard" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                    <LayoutGrid size={18} className="mr-3" />
                    <span>Dashboard</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/customers" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                    <Users size={18} className="mr-3" />
                    <span>Customers</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/repairs" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                    <ClipboardList size={18} className="mr-3" />
                    <span>Repair Tickets</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/inventory" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
                    <FolderKanban size={18} className="mr-3" />
                    <span>Inventory</span>
                </Link>
            </li>
        </>
    );

    const adminLinks = (
        <>
            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
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
            <h2 className=" text-xs font-semibold text-gray-500 px-6 mb-2">ADMINISTRATION</h2>
            <li className="mb-1">
                <Link to="/user-management" className="flex items-center px-6 py-3 text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407] transition-all duration-200">
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
            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">REPORTS</h2>
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
        </>
    );

    return (

        <div className="fixed w-[250px] bg-white border-r border-gray-200 flex flex-col h-screen z-10">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">
                    IO<span className="text-[#33e407]">CONNECT</span>
                </h1>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul>
                    {role === 'admin' && adminLinks}
                    {role === 'customer' && customerLinks}
                    {role === 'technician' && technicianLinks}
                </ul>
            </nav>

            <div
                className="p-4 border-t border-gray-200 flex items-center cursor-pointer relative"
                onClick={toggleLogoutMenu}
            >
                <div className="w-9 h-9 bg-[#e6f9e6] text-[#33e407] rounded-md flex items-center justify-center font-semibold mr-3">
                    <span>{(userData.firstName?.charAt(0) || '') + (userData.lastName?.charAt(0) || '')}</span>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 m-0">
                        {userData.firstName} {userData.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 m-0">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </p>
                </div>

                {showLogoutMenu && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-300 rounded shadow-md w-60 z-20">
                        <Link
                            to="/accountinformation"
                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407]"
                            onClick={() => setShowLogoutMenu(false)}
                        >
                            <div className="flex items-center">
                                <Settings size={16} className="mr-2" />
                                Settings
                            </div>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407]"
                        >
                            <div className="flex items-center">
                                <LogOut size={16} className="mr-2" />
                                Logout
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;