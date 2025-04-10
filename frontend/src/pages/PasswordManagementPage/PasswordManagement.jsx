import { Link } from "react-router-dom"
import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import styles from "./PasswordManagement.module.css"

const PasswordManagement = () => {
    return (
        <div className={styles.passwordManagementPage}>
            <Navbar />

            <main className={styles.mainContent}>
                <div className={styles.passwordContainer}>
                    <div className={styles.sideBar}></div>

                    <div className={styles.passwordContent}>
                        <div className={styles.logoContainer}>
                            <h1 className={styles.logo}>
                                IO<span>CONNECT</span>
                            </h1>
                        </div>

                        <div className={styles.passwordHeader}>
                            <h2>Change Your Password</h2>
                            <p>Create a strong password to protect your account</p>
                        </div>

                        <form className={styles.passwordForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    placeholder="Enter your current password"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="newPassword">New Password</label>
                                <input type="password" id="newPassword" name="newPassword" placeholder="Enter new password" />
                                <div className={styles.passwordStrength}>
                                    <div className={styles.strengthBar}>
                                        <div className={styles.strengthIndicator}></div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password" />
                            </div>

                            <div className={styles.requirementsContainer}>
                                <h3>Password Requirements</h3>
                                <ul className={styles.requirementsList}>
                                    <li className={styles.requirementMet}>At least 8 characters long</li>
                                    <li className={styles.requirementMet}>Include at least one uppercase letter</li>
                                    <li className={styles.requirementMet}>Include at least one number</li>
                                    <li className={styles.requirementMet}>Include at least one special character</li>
                                    <li className={styles.requirementMet}>Should not be the same as your previous password</li>
                                </ul>
                            </div>

                            <div className={styles.actionButtons}>
                                <button type="button" className={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.changeBtn}>
                                    Change Password
                                </button>
                            </div>
                        </form>

                        <div className={styles.backLink}>
                            <Link to="/account">← Back to Account Settings</Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default PasswordManagement
