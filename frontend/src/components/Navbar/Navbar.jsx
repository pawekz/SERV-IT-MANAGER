import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Settings, LogOut, LayoutGrid } from 'lucide-react';
import api from '../../config/ApiConfig.jsx';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
    const [profileUrl, setProfileUrl] = useState(null);
    const dropdownRef = useRef(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'authToken') {
                setIsLoggedIn(!!e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Fetch profile picture similar to Sidebar
    useEffect(() => {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        let mounted = true;
        const fetchProfile = async () => {
            try {
                if (userData && userData.userId && userData.profilePictureUrl && userData.profilePictureUrl !== '0') {
                    const resp = await api.get(`/user/getProfilePicture/${userData.userId}`);
                    if (mounted) setProfileUrl(resp.data);
                } else {
                    if (mounted) setProfileUrl(null);
                }
            } catch (e) {
                if (mounted) setProfileUrl(null);
            }
        };
        if (isLoggedIn) fetchProfile();
        return () => { mounted = false; };
    }, [isLoggedIn]);

    // close dropdown when clicking outside
    useEffect(() => {
        const onClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('userData');
        window.location.href = '/';
    };

    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const formatInitials = () => {
        const first = (userData.firstName || '').trim();
        const last = (userData.lastName || '').trim();
        const initial = (first.charAt(0) || '') + (last.charAt(0) || '');
        return initial.toUpperCase();
    };

    return (
        <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
            <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img
                        src="/ioconnect-logo.png"
                        alt="IOCONNECT Logo"
                        className="h-12 w-auto"
                    />
                </Link>

                {/* Hamburger Button (Mobile) */}
                <button
                    className="md:hidden flex flex-col justify-between w-6 h-5 focus:outline-none"
                    onClick={toggleMenu}
                >
                    <span className="h-0.5 w-full bg-gray-800 rounded"></span>
                    <span className="h-0.5 w-full bg-gray-800 rounded"></span>
                    <span className="h-0.5 w-full bg-gray-800 rounded"></span>
                </button>

                {/* Desktop Nav */}
                <ul className="hidden md:flex space-x-8">
                    <li>
                        <Link
                            to="/"
                            className="text-gray-800 font-medium hover:text-green-500 transition-colors"
                        >
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/about"
                            className="text-gray-800 font-medium hover:text-green-500 transition-colors"
                        >
                            About Us
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/contact"
                            className="text-gray-800 font-medium hover:text-green-500 transition-colors"
                        >
                            Contact Us
                        </Link>
                    </li>
                </ul>

                {/* Desktop Auth / Profile */}
                <div className="hidden md:flex items-center space-x-4 relative">
                    {!isLoggedIn ? (
                        <>
                            <Link
                                to="/login"
                                className="text-gray-800 font-medium hover:text-green-500 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="text-white px-6 py-2 rounded font-medium transition-colors"
                                style={{ backgroundColor: "#33e407" }}
                            >
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(s => !s)}
                                className="flex items-center gap-2 focus:outline-none"
                                aria-haspopup="true"
                                aria-expanded={showDropdown}
                            >
                                {profileUrl ? (
                                    <img src={profileUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#e6f9e6] text-[#33e407] flex items-center justify-center font-semibold">
                                        {formatInitials()}
                                    </div>
                                )}
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow-md z-50">
                                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        <LayoutGrid size={16} />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link to="/accountinformation" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                        <Settings size={16} />
                                        <span>Settings</span>
                                    </Link>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white shadow-md">
                    <ul className="flex flex-col px-6 py-4 space-y-4 text-center">
                        <li>
                            <Link to="/" className="text-gray-800 font-medium">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/about" className="text-gray-800 font-medium">
                                About Us
                            </Link>
                        </li>
                        <li>
                            <Link to="/contact" className="text-gray-800 font-medium">
                                Contact Us
                            </Link>
                        </li>
                    </ul>

                    <div className="flex flex-col px-6 pb-4 space-y-2 text-center">
                        {!isLoggedIn ? (
                            <>
                                <Link to="/login" className="text-gray-800 font-medium">
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="text-white py-2 px-2 rounded font-medium text-center"
                                    style={{ backgroundColor: "#33e407" }}
                                >
                                    Sign up
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/dashboard" className="flex items-center justify-center gap-2 text-gray-800 font-medium">
                                    <LayoutGrid size={16} />
                                    <span>Dashboard</span>
                                </Link>
                                <Link to="/accountinformation" className="flex items-center justify-center gap-2 text-gray-800 font-medium">
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </Link>
                                <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-gray-800 font-medium">
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

        </nav>
    );
};

export default Navbar;
