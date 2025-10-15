import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import styles from "./LandingPage.module.css"

const LandingPage = () => {
    return (
        <div className={styles.landingPage}>
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div className={styles.container}>
                        <div className={styles.heroContent}>
                            <h1>
                                IT Repair Management <span>Simplified</span>
                            </h1>
                            <p>
                                Streamline your IT repair workflow with IOConnect SerV-IT Manager. From service requests to device
                                collection, all in one place.
                            </p>
                            <div className={styles.heroBtns}>
                                <a href="#features" className={styles.primaryBtn}>
                                    Explore Features
                                </a>
                                <a href="/signup" className={styles.secondaryBtn}>
                                    Get Started
                                </a>
                            </div>
                        </div>
                        <div className={styles.heroImage}>
                            <img src="/mock.png" alt="IOCONNECT" loading="lazy" />
                        </div>
                    </div>
                </section>


                {/* About Section */}
                <section className={styles.aboutSection} id="about">
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.aboutImage}>
                                 <img src="/ioconnect-logo.png" alt="About IOCONNECT" loading="lazy" />
                                {/*<img src="../../../src/assets/images/iocon_logo.png" alt="About IOCONNECT" />*/}
                                {/**/}
                            </div>
                            <h2>
                                About <span>IOCONNECT</span>
                            </h2>
                            <p>Transforming IT repair management for better efficiency</p>
                        </div>

                        <div className={styles.aboutContent}>
                            <div className={styles.aboutText}>
                                <h3>Digitizing IT Repair Workflow</h3>
                                <p>
                                    The IOConnect SerV-IT Manager is a web-based IT Repair Management System developed to replace
                                    IOConnect CCTV and Computer Installation Services' current manual repair tracking process.
                                </p>
                                <p>
                                    Our purpose is to digitize and automate the entire repair workflow – from the initial service request
                                    to final device collection – in order to increase operational efficiency, enhance transparency, and
                                    improve communication between technicians and customers.
                                </p>
                                <p>
                                    By moving from a paper-based system to an online platform, we aim to streamline documentation, provide
                                    real-time status updates, and boost both technician and customer satisfaction.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className={styles.ctaSection}>
                    <div className={styles.container}>
                        <h2>Ready to streamline your IT repair process?</h2>
                        <p>Join IOCONNECT today and transform your service management</p>
                        <a href="#contact" className={styles.ctaButton}>
                            Get Started Now
                        </a>
                    </div>
                </section>


                {/* Features Section */}
                <section className={styles.featuresSection} id="features">
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                Our <span>Features</span>
                            </h2>
                            <p>Comprehensive tools to manage your IT repair services</p>
                        </div>

                        <div className={styles.featuresGrid}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                    </svg>
                                </div>
                                <h3>Service Request Management</h3>
                                <p>Easily create, track, and manage service requests from start to finish.</p>
                            </div>

                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="9" y1="21" x2="9" y2="9"></line>
                                    </svg>
                                </div>
                                <h3>Real-time Status Updates</h3>
                                <p>Keep customers informed with automated status updates throughout the repair process.</p>
                            </div>

                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <h3>Technician Management</h3>
                                <p>Assign tasks to technicians and monitor their workload and performance.</p>
                            </div>

                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                                <h3>Customer Communication</h3>
                                <p>Seamless communication between customers and technicians for better service delivery.</p>
                            </div>

                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                    </svg>
                                </div>
                                <h3>Analytics Dashboard</h3>
                                <p>Gain insights into repair trends, performance metrics, and customer satisfaction.</p>
                            </div>

                            <div className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <h3>Scheduling System</h3>
                                <p>Efficiently schedule repairs and manage technician availability.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    )
}

export default LandingPage
