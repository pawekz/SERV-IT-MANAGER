import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, UserCog, Settings, Truck, ShieldCheck, ClipboardList, LogOut, FolderClock, Inbox, FileClock, Menu, X } from 'lucide-react';
import api from '../../config/ApiConfig.jsx';

const formatName = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    return raw.trim().split(/\s+/).map(word =>
        word.split('-').map(hy =>
            hy.split("'").map(seg => seg ? seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase() : seg).join("'")
        ).join('-')
    ).join(' ');
};

const Sidebar = ({ activePage }) => {
    const role = localStorage.getItem('userRole')?.toLowerCase();
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutMenu, setShowLogoutMenu] = useState(false);
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const [profileUrl, setProfileUrl] = useState(null);

    // Fetch presigned URL if profile picture exists
    useEffect(() => {
        let intervalId;
        const fetchProfile = async () => {
            try {
                if (userData && userData.userId && userData.profilePictureUrl && userData.profilePictureUrl !== '0') {
                    const resp = await api.get(`/user/getProfilePicture/${userData.userId}`);
                    setProfileUrl(resp.data);
                } else {
                    setProfileUrl(null);
                }
            } catch (e) {
                setProfileUrl(null); // fallback to initials
            }
        };
        fetchProfile();
        // refresh every 4 minutes (presigned expires in 5)
        intervalId = setInterval(fetchProfile, 240000);
        return () => clearInterval(intervalId);
    }, [userData?.userId, userData?.profilePictureUrl]);

    const toggleLogoutMenu = () => {
        setShowLogoutMenu(prev => !prev);
    };
    const toggleSidebar = () => setIsOpen(prev => !prev);
    const closeSidebar = () => setIsOpen(false);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('userData');
        window.location.href = '/login';
    };

    const linkClass = (page) =>
        `flex items-center px-6 py-3 transition-all duration-200 ${
            activePage === page
                ? role === "customer"
                    ? "bg-[rgba(51,228,7,0.1)] text-[#33e407] font-semibold"
                    : "bg-[rgba(37,99,235,0.1)] text-[#2563eb] font-semibold"
                : role === "customer"
                    ? "text-gray-600 hover:bg-[rgba(51,228,7,0.05)] hover:text-[#33e407]"
                    : "text-gray-600 hover:bg-[rgba(37,99,235,0.05)] hover:text-[#2563eb]"
        }`;

    const customerLinks = (
        <>

            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
            <li className="mb-1">
                <Link to="/dashboard" className={linkClass('dashboard')}>
                    <LayoutGrid size={18} className="mr-3" />
                    <span>Dashboard</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/repairqueue" className={linkClass('repair')}>
                    <ClipboardList size={18} className="mr-3" />
                    <span>Repair Queue</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/warranty" className={linkClass('warranty')}>
                    <Truck size={18} className="mr-3" />
                    <span>Warranty Request</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/history" className={linkClass('history')}>
                    <FileClock size={18} className="mr-3" />
                    <span>History</span>
                </Link>
            </li>
        </>
    );

    const technicianLinks = (
        <>
            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
            <li className="mb-1">
                <Link to="/dashboard" className={linkClass('dashboard')}>
                    <LayoutGrid size={18} className="mr-3" />
                    <span>Dashboard</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/repairqueue" className={linkClass('repair')}>
                    <ClipboardList size={18} className="mr-3" />
                    <span>Repair Queue</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/warranty" className={linkClass('warranty')}>
                    <ShieldCheck size={18} className="mr-3" />
                    <span>Warranty Request</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/history" className={linkClass('history')}>
                    <FileClock size={18} className="mr-3" />
                    <span>History</span>
                </Link>
            </li>

            <div className="mb-6 mt-6">
                <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">ADMINISTRATION</h2>
                <ul>
                    <li className="mb-1">
                        <Link to="/inventory" className={linkClass('inventory')}>
                            <Inbox size={18} className="mr-3" />
                            <span>Inventory</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </>
    );

    const adminLinks = (
        <>
            <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">MAIN</h2>
            <li className="mb-1">
                <Link to="/dashboard" className={linkClass('dashboard')}>
                    <LayoutGrid size={18} className="mr-3" />
                    <span>Dashboard</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/repairqueue" className={linkClass('repair')}>
                    <ClipboardList size={18} className="mr-3" />
                    <span>Repair Queue</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/warranty" className={linkClass('warranty')}>
                    <ShieldCheck size={18} className="mr-3" />
                    <span>Warranty Request</span>
                </Link>
            </li>
            <li className="mb-1">
                <Link to="/history" className={linkClass('history')}>
                    <FileClock size={18} className="mr-3" />
                    <span>History</span>
                </Link>
            </li>

            <div className="mb-6 mt-6">
                <h2 className="text-xs font-semibold text-gray-500 px-6 mb-2">ADMINISTRATION</h2>
                <ul>
                    <li className="mb-1">
                        <Link to="/profilemanage" className={linkClass('usermanagement')}>
                            <UserCog size={18} className="mr-3" />
                            <span>User Management</span>
                        </Link>
                    </li>
                    <li className="mb-1">
                        <Link to="/inventory" className={linkClass('inventory')}>
                            <Inbox size={18} className="mr-3" />
                            <span>Inventory</span>
                        </Link>
                    </li>
                    <li className="mb-1">
                        <Link to="/backup" className={linkClass('backup')}>
                            <FolderClock size={18} className="mr-3" />
                            <span>Backup & Restore</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </>
    );

    const formattedFirst = formatName(userData.firstName || '');
    const formattedLast = formatName(userData.lastName || '');
    const fullName = `${formattedFirst}${formattedLast ? ' ' + formattedLast : ''}`;

    return (
        <>
            {/* Mobile top bar */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
                {/* Left side: menu button */}
                <button onClick={toggleSidebar} className="mr-3">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Center: logo */}
                <h1 className="text-xl font-bold text-gray-800 flex-1 text-center">
                    IO<span className="text-[#33e407]">CONNECT</span>
                </h1>
            </div>

            {/* <CHANGE> Backdrop overlay that appears when sidebar is open on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 w-[250px] h-screen bg-white border-r border-gray-200 flex flex-col z-20 
                transform transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0`}
            >
                {/* <CHANGE> Added close button in sidebar header */}
                <div className="p-5 pb-4 border-b border-gray-200 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">
                        IO<span className="text-[#33e407]">CONNECT</span>
                    </h1>
                    <button
                        onClick={closeSidebar}
                        className="md:hidden text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <X size={24} />
                    </button>
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
                    {profileUrl ? (
                        <img
                            src={profileUrl || "/placeholder.svg"}
                            alt="Profile"
                            onError={() => setProfileUrl(null)}
                            className="w-9 h-9 rounded-full object-cover mr-3 border border-[#e6f9e6]"
                        />
                    ) : (
                        <div className="w-9 h-9 bg-[#e6f9e6] text-[#33e407] rounded-full flex items-center justify-center font-semibold mr-3">
                            <span>{(formattedFirst.charAt(0) || '') + (formattedLast.charAt(0) || '')}</span>
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 m-0">
                            {fullName}
                        </h3>
                        <p className="text-xs text-gray-500 m-0">
                            {role?.charAt(0).toUpperCase() + role?.slice(1)}
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
        </>
    );
};

export default Sidebar;