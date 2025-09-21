import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
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

                {/* Desktop Auth */}
                <div className="hidden md:flex items-center space-x-4">
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

                    <div className="flex flex-col px-[160px] pb-4 space-y-4 text-center">
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
                    </div>
                </div>
            )}

        </nav>
    );
};

export default Navbar;
