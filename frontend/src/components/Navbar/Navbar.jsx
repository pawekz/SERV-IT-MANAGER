import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (

        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link to="/" className={styles.logoContainer}>
                    <img src="src/assets/images/logo.png" alt="IOCONNECT Logo" className={styles.logo} />
                </Link>
            </div>
            <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
                <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <img src="/ioconnect-logo.png" alt="IOCONNECT Logo" className="h-12 w-auto" />
                    </Link>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex flex-col justify-between w-7.5 h-5 cursor-pointer" onClick={toggleMenu}>
                        <span className="h-0.5 w-full bg-gray-800 rounded-full"></span>
                        <span className="h-0.5 w-full bg-gray-800 rounded-full"></span>
                        <span className="h-0.5 w-full bg-gray-800 rounded-full"></span>
                    </div>

                    {/* Desktop Navigation */}
                    <ul className="hidden md:flex list-none m-0 p-0 absolute left-1/2 transform -translate-x-1/2">
                        <li className="mx-4">
                            <Link to="/" className="text-gray-800 font-medium transition-colors duration-300 hover:text-green-500"
                                  style={{ "&:hover": { color: "#33e407" } }}>
                                Home
                            </Link>
                        </li>
                        <li className="mx-4">
                            <Link to="/about" className="text-gray-800 font-medium transition-colors duration-300 hover:text-green-500"
                                  style={{ "&:hover": { color: "#33e407" } }}>
                                About Us
                            </Link>
                        </li>
                        <li className="mx-4">
                            <Link to="/contact" className="text-gray-800 font-medium transition-colors duration-300 hover:text-green-500"
                                  style={{ "&:hover": { color: "#33e407" } }}>
                                Contact Us
                            </Link>
                        </li>
                    </ul>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center">
                        <Link to="/login"
                              className="mr-4 text-gray-800 font-medium transition-colors duration-300 hover:text-green-500"
                              style={{ "&:hover": { color: "#33e407" } }}>
                            Login
                        </Link>
                        <Link to="/signup"
                              className="text-white px-6 py-2 rounded font-medium transition-colors duration-300"
                              style={{ backgroundColor: "#33e407", "&:hover": { backgroundColor: "#2bc706" } }}>
                            Sign up
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu */}
                <ul className={`md:hidden flex-col bg-white shadow-md py-4 ${isMenuOpen ? 'flex' : 'hidden'} absolute top-20 left-0 right-0`}>
                    <li className="mx-8 my-2"><Link to="/" className="text-gray-800 font-medium">Home</Link></li>
                    <li className="mx-8 my-2"><Link to="/about" className="text-gray-800 font-medium">About Us</Link></li>
                    <li className="mx-8 my-2"><Link to="/contact" className="text-gray-800 font-medium">Contact Us</Link></li>
                </ul>

                {/* Mobile Auth Buttons */}
                <div className={`md:hidden ${isMenuOpen ? 'flex' : 'hidden'} flex-col bg-white p-4 px-8 shadow-md absolute top-48 left-0 right-0`}>
                    <Link to="/login" className="mb-4 text-gray-800 font-medium">Login</Link>
                    <Link to="/signup"
                          className="text-white py-2 px-6 rounded font-medium text-center w-full"
                          style={{ backgroundColor: "#33e407" }}>
                        Sign up
                    </Link>
                </div>
            </nav>
        </nav>
            );
        };

export default Navbar;