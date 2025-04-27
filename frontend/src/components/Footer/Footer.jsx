import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#222] text-white py-12 pb-4">
            <div className="max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* About Section */}
                    <div>
                        <h3 className="relative text-lg mb-6 pb-2" style={{ color: '#33e407' }}>
                            IOCONNECT
                            <span className="absolute left-0 bottom-0 w-10 h-0.5 block" style={{ backgroundColor: '#33e407' }}></span>
                        </h3>
                        <p className="text-gray-300 leading-relaxed">
                            Providing professional IT repair management solutions to streamline your service operations
                            and enhance customer satisfaction.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <a
                                href="https://www.facebook.com/ioconnectcbu"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 text-white transition-all duration-300 hover:-translate-y-0.5"
                                style={{ "&:hover": { backgroundColor: "#33e407" } }}
                            >
                                <Facebook size={20} />
                            </a>
                            {/* Other social icons commented out as in original */}
                        </div>
                    </div>

                    {/* Quick Links Section */}
                    <div>
                        <h3 className="relative text-lg mb-6 pb-2" style={{ color: '#33e407' }}>
                            Quick Links
                            <span className="absolute left-0 bottom-0 w-10 h-0.5 block" style={{ backgroundColor: '#33e407' }}></span>
                        </h3>
                        <ul className="list-none p-0">
                            <li className="mb-3">
                                <Link to="/" className="text-gray-300 no-underline transition-colors duration-300 hover:text-green-400" style={{ "&:hover": { color: "#33e407" } }}>
                                    Home
                                </Link>
                            </li>
                            <li className="mb-3">
                                <Link to="/about" className="text-gray-300 no-underline transition-colors duration-300 hover:text-green-400" style={{ "&:hover": { color: "#33e407" } }}>
                                    About Us
                                </Link>
                            </li>
                            <li className="mb-3">
                                <Link to="/contact" className="text-gray-300 no-underline transition-colors duration-300 hover:text-green-400" style={{ "&:hover": { color: "#33e407" } }}>
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div>
                        <h3 className="relative text-lg mb-6 pb-2" style={{ color: '#33e407' }}>
                            Contact Us
                            <span className="absolute left-0 bottom-0 w-10 h-0.5 block" style={{ backgroundColor: '#33e407' }}></span>
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <MapPin size={18} style={{ color: '#33e407', marginTop: '3px' }} />
                                <p className="text-gray-300 m-0">8H Peace Valley Friendship St., Lahug Cebu City</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone size={18} style={{ color: '#33e407', marginTop: '3px' }} />
                                <p className="text-gray-300 m-0">032-272-9019</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail size={18} style={{ color: '#33e407', marginTop: '3px' }} />
                                <p className="text-gray-300 m-0">info@ioconnect-cbu.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} IOCONNECT. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;