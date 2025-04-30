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

                <div className={styles.mobileMenuButton} onClick={toggleMenu}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <ul className={`${styles.navLinks} ${isMenuOpen ? styles.active : ''}`}>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About Us</Link></li>
                    <li><Link to="/contact">Contact Us</Link></li>
                </ul>

                <div className={`${styles.authButtons} ${isMenuOpen ? styles.active : ''}`}>
                    <Link to="/login" className={styles.loginBtn}>Login</Link>
                    <Link to="/signup" className={styles.signUpBtn}>Sign up</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
