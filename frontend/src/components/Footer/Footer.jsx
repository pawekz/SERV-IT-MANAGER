import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h3>IOCONNECT</h3>
                        <p>
                            Providing professional IT repair management solutions to streamline your service operations
                            and enhance customer satisfaction.
                        </p>
                        <div className={styles.socialIcons}>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <Facebook size={20} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <Twitter size={20} />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                                <Linkedin size={20} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    <div className={styles.footerSection}>
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/services">Services</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div className={styles.footerSection}>
                        <h3>Contact Us</h3>
                        <div className={styles.contactInfo}>
                            <div className={styles.contactItem}>
                                <MapPin size={18} />
                                <p>8H Peace Valley Friendship St., Lahug Cebu City</p>
                            </div>
                            <div className={styles.contactItem}>
                                <Phone size={18} />
                                <p>032-272-9019</p>
                            </div>
                            <div className={styles.contactItem}>
                                <Mail size={18} />
                                <p>info@ioconnect-cbu.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; {new Date().getFullYear()} IOCONNECT. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
