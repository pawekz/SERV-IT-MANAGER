import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import styles from "./AccountInformation.module.css"
import { Link } from "react-router-dom"

const AccountInformation = () => {
    return (
        <div className={styles.accountInformationPage}>
            <Navbar />

            <main className={styles.mainContent}>
                <div className={styles.accountContainer}>
                    <div className={styles.sideBar}></div>

                    <div className={styles.accountContent}>
                        <div className={styles.logoContainer}>
                            <h1 className={styles.logo}>
                                IO<span>CONNECT</span>
                            </h1>
                        </div>

                        <section className={styles.accountSection}>
                            <h2>Account Information</h2>

                            <div className={styles.accountHeader}>
                                <div className={styles.accountAvatar}>
                                    <span>JD</span>
                                </div>
                                <div className={styles.accountInfo}>
                                    <h3>John Doe</h3>
                                    <p>john.doe@example.com</p>
                                    <button className={styles.changePhotoBtn}>Change Profile Picture</button>
                                </div>
                            </div>
                        </section>

                        <section className={styles.personalSection}>
                            <h2>Personal Information</h2>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="firstName">First Name</label>
                                    <input type="text" id="firstName" name="firstName" value="John" readOnly />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="lastName">Last Name</label>
                                    <input type="text" id="lastName" name="lastName" value="Doe" readOnly />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email Address</label>
                                <input type="email" id="email" name="email" value="john.doe@example.com" readOnly />
                            </div>
                        </section>

                        <section className={styles.passwordSection}>
                            <h2>Change Password</h2>

                            <div className={styles.formGroup}>
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    placeholder="Enter your current password"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword">New Password</label>
                                    <input type="password" id="newPassword" name="newPassword" placeholder="Enter new password" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <p className={styles.passwordRequirement}>Password must be at least 8 characters long</p>

                            <p className={styles.lastUpdated}>Last updated: March 23, 2025</p>
                        </section>

                        <div className={styles.actionButtons}>
                            <button className={styles.cancelBtn}>Cancel</button>
                            <button className={styles.saveBtn}>Save Changes</button>
                        </div>

                        <div className={styles.backLink}>
                            <Link to="/">← Back to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default AccountInformation
