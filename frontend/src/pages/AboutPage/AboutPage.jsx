import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import styles from "./AboutPage.module.css"
import { Link } from "react-router-dom"

const AboutPage = () => {
    return (
        <div className={styles.aboutPage}>
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div className={styles.container}>
                        <div className={styles.heroContent}>
                            <h1>About <span>IOCONNECT</span></h1>
                            <p>Transforming IT repair management through innovation and excellence</p>
                        </div>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className={styles.storySection}>
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>Our <span>Story</span></h2>
                            <p>The journey that brought us here</p>
                        </div>

                        <div className={styles.storyContent}>
                            <div className={styles.storyImage}>
                                <img src="/ioconnect-logo.png" alt="IOCONNECT History" />
                            </div>
                            <div className={styles.storyText}>
                                <h3>From Humble Beginnings</h3>
                                <p>
                                    Founded in 2015, IOCONNECT began as a small IT repair shop in Cebu City with a vision to revolutionize
                                    how businesses manage their IT repair processes. What started as a team of three passionate technicians
                                    has grown into a comprehensive IT repair management solution provider serving businesses across the Philippines.
                                </p>
                                <p>
                                    Our founder, recognizing the inefficiencies in traditional paper-based repair tracking systems,
                                    set out to create a digital solution that would streamline the entire repair workflow. After years
                                    of development and refinement, the IOConnect SerV-IT Manager was born – a platform designed by repair
                                    technicians for repair technicians.
                                </p>
                                <p>
                                    Today, IOCONNECT continues to innovate and expand, driven by our commitment to excellence and our
                                    passion for solving complex IT management challenges.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className={styles.missionSection}>
                    <div className={styles.container}>
                        <div className={styles.missionVisionGrid}>
                            <div className={styles.missionCard}>
                                <div className={styles.cardIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                </div>
                                <h3>Our Mission</h3>
                                <p>
                                    To empower IT repair businesses with innovative digital solutions that enhance operational efficiency,
                                    improve customer satisfaction, and drive sustainable growth. We are committed to transforming the
                                    repair management landscape through technology that simplifies complex processes.
                                </p>
                            </div>

                            <div className={styles.visionCard}>
                                <div className={styles.cardIcon}>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 16l4-4-4-4"></path>
                                        <path d="M8 12h8"></path>
                                    </svg>
                                </div>
                                <h3>Our Vision</h3>
                                <p>
                                    To be the global leader in IT repair management solutions, setting the industry standard for
                                    digital transformation in repair services. We envision a world where every repair business,
                                    regardless of size, has access to powerful tools that enable them to deliver exceptional service.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className={styles.valuesSection}>
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>Our <span>Values</span></h2>
                            <p>The principles that guide everything we do</p>
                        </div>

                        <div className={styles.valuesGrid}>
                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
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
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                    </svg>
                                </div>
                                <h3>Excellence</h3>
                                <p>
                                    We strive for excellence in everything we do, from product development to customer support.
                                    We are committed to delivering solutions that exceed expectations and set new standards in the industry.
                                </p>
                            </div>

                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
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
                                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                                        <line x1="16" y1="8" x2="2" y2="22"></line>
                                        <line x1="17.5" y1="15" x2="9" y2="15"></line>
                                    </svg>
                                </div>
                                <h3>Innovation</h3>
                                <p>
                                    We embrace innovation as a core value, constantly seeking new ways to improve our solutions
                                    and address emerging challenges in the IT repair industry. We believe that innovation drives progress.
                                </p>
                            </div>

                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
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
                                <h3>Customer Focus</h3>
                                <p>
                                    Our customers are at the heart of everything we do. We listen to their needs, anticipate their challenges,
                                    and develop solutions that address their specific requirements. Their success is our success.
                                </p>
                            </div>

                            <div className={styles.valueCard}>
                                <div className={styles.valueIcon}>
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
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <h3>Integrity</h3>
                                <p>
                                    We conduct our business with the highest level of integrity, transparency, and ethical standards.
                                    We believe in building trust through honest communication and delivering on our promises.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* CTA Section */}
                <section className={styles.ctaSection}>
                    <div className={styles.container}>
                        <h2>Ready to transform your IT repair management?</h2>
                        <p>Join hundreds of businesses that trust IOCONNECT for their repair workflow needs</p>
                        <div className={styles.ctaButtons}>
                            <Link
                                to="/contact"
                                className={styles.primaryBtn}
                                onClick={() => {
                                    window.scrollTo(0, 0);
                                }}
                            >
                                Contact Us
                            </Link>
                            <Link to="/signup" className={styles.secondaryBtn}>
                                Get Started
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

export default AboutPage