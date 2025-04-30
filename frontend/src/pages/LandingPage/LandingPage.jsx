import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

const LandingPage = () => {
    return (
        <div className="font-['Poppins',sans-serif]">
            <Navbar />

            <main className="mt-20">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-[rgba(51,255,0,0.195)] to-white py-20">
                    <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl lg:max-w-md">
                            <h1 className="text-5xl font-bold mb-6 leading-tight text-gray-800">
                                IT Repair Management <span className="text-[#33e407]">Simplified</span>
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Streamline your IT repair workflow with IOConnect SerV-IT Manager. From service requests to device
                                collection, all in one place.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="#features"
                                    className="bg-[#33e407] text-white px-8 py-3 rounded font-medium transition-all duration-300 hover:bg-[#2bc706] hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.2)]"
                                >
                                    Explore Features
                                </a>
                                <a
                                    href="/signup"
                                    className="bg-transparent text-gray-800 px-8 py-3 rounded font-medium border border-[#33e407] transition-all duration-300 hover:bg-[rgba(51,228,7,0.1)] hover:-translate-y-1"
                                >
                                    Get Started
                                </a>
                            </div>
                        </div>
                        <div className={styles.heroImage}>
                            <img src="src/assets/images/mock.png" alt="IOCONNECT" />
                        <div className="mt-10 lg:mt-0">
                            <img src="/ioconnect-logo.png" alt="IOCONNECT" className="max-w-full rounded-lg shadow-2xl" />
                        </div>
                    </div>
                </section>


                {/* About Section */}
                <section className={styles.aboutSection} id="about">
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.aboutImage}>
                                {/* <img src="/ioconnect-logo.png" alt="About IOCONNECT" /> */}
                                <img src="src/assets/images/iocon_logo.png" alt="About IOCONNECT" />
                            </div>
                            <h2>
                                About <span>IOCONNECT</span>
                <section id="about" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-800">
                                About <span className="text-[#33e407]">IOCONNECT</span>
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Transforming IT repair management for better efficiency
                            </p>
                        </div>

                        <div className={styles.aboutContent}>
                            <div className={styles.aboutText}>
                                <h3>Digitizing IT Repair Workflow</h3>
                                <p>
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2">
                                <img src="/ioconnect-logo.png" alt="About IOCONNECT" className="max-w-full rounded-lg shadow-xl" />
                            </div>
                            <div className="lg:w-1/2">
                                <h3 className="text-2xl font-semibold mb-6 text-[#33e407]">Digitizing IT Repair Workflow</h3>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                    The IOConnect SerV-IT Manager is a web-based IT Repair Management System developed to replace
                                    IOConnect CCTV and Computer Installation Services' current manual repair tracking process.
                                </p>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                    Our purpose is to digitize and automate the entire repair workflow – from the initial service request
                                    to final device collection – in order to increase operational efficiency, enhance transparency, and
                                    improve communication between technicians and customers.
                                </p>
                                <p className="text-gray-600 leading-relaxed">
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
                <section id="features" className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-800">
                                Our <span className="text-[#33e407]">Features</span>
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Comprehensive tools to manage your IT repair services
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-14 h-14 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Service Request Management</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Easily create, track, and manage service requests from start to finish.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-14 h-14 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="3" y1="9" x2="21" y2="9"></line>
                                        <line x1="9" y1="21" x2="9" y2="9"></line>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Real-time Status Updates</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Keep customers informed with automated status updates throughout the repair process.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-14 h-14 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Technician Management</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Assign tasks to technicians and monitor their workload and performance.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-14 h-14 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Customer Communication</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Seamless communication between customers and technicians for better service delivery.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-14 h-14 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Analytics Dashboard</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Gain insights into repair trends, performance metrics, and customer satisfaction.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-14 h-14 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Scheduling System</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Efficiently schedule repairs and manage technician availability.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


                {/* Contact Section */}
                {/*<section className={styles.contactSection} id="contact">*/}
                {/*    <div className={styles.container}>*/}
                {/*        <div className={styles.sectionHeader}>*/}
                {/*            <h2>*/}
                {/*                Contact <span>Us</span>*/}
                {/*            </h2>*/}
                {/*            <p>Get in touch with our team for more information</p>*/}
                {/*        </div>*/}

                {/*        <div className={styles.contactContent}>*/}
                {/*            <div className={styles.contactInfo}>*/}
                {/*                <div className={styles.contactCard}>*/}
                {/*                    <div className={styles.contactIcon}>*/}
                {/*                        <svg*/}
                {/*                            xmlns="http://www.w3.org/2000/svg"*/}
                {/*                            width="24"*/}
                {/*                            height="24"*/}
                {/*                            viewBox="0 0 24 24"*/}
                {/*                            fill="none"*/}
                {/*                            stroke="currentColor"*/}
                {/*                            strokeWidth="2"*/}
                {/*                            strokeLinecap="round"*/}
                {/*                            strokeLinejoin="round"*/}
                {/*                        >*/}
                {/*                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>*/}
                {/*                            <circle cx="12" cy="10" r="3"></circle>*/}
                {/*                        </svg>*/}
                {/*                    </div>*/}
                {/*                    <h3>Address</h3>*/}
                {/*                    <p>8H Peace Valley Friendship St., Lahug Cebu City</p>*/}
                {/*                </div>*/}

                {/*                <div className={styles.contactCard}>*/}
                {/*                    <div className={styles.contactIcon}>*/}
                {/*                        <svg*/}
                {/*                            xmlns="http://www.w3.org/2000/svg"*/}
                {/*                            width="24"*/}
                {/*                            height="24"*/}
                {/*                            viewBox="0 0 24 24"*/}
                {/*                            fill="none"*/}
                {/*                            stroke="currentColor"*/}
                {/*                            strokeWidth="2"*/}
                {/*                            strokeLinecap="round"*/}
                {/*                            strokeLinejoin="round"*/}
                {/*                        >*/}
                {/*                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>*/}
                {/*                        </svg>*/}
                {/*                    </div>*/}
                {/*                    <h3>Phone</h3>*/}
                {/*                    <p>032-272-9019</p>*/}
                {/*                </div>*/}

                {/*                <div className={styles.contactCard}>*/}
                {/*                    <div className={styles.contactIcon}>*/}
                {/*                        <svg*/}
                {/*                            xmlns="http://www.w3.org/2000/svg"*/}
                {/*                            width="24"*/}
                {/*                            height="24"*/}
                {/*                            viewBox="0 0 24 24"*/}
                {/*                            fill="none"*/}
                {/*                            stroke="currentColor"*/}
                {/*                            strokeWidth="2"*/}
                {/*                            strokeLinecap="round"*/}
                {/*                            strokeLinejoin="round"*/}
                {/*                        >*/}
                {/*                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>*/}
                {/*                            <polyline points="22,6 12,13 2,6"></polyline>*/}
                {/*                        </svg>*/}
                {/*                    </div>*/}
                {/*                    <h3>Email</h3>*/}
                {/*                    <p>info@ioconnect-cbu.com</p>*/}
                {/*                </div>*/}
                {/*            </div>*/}

                {/*            <div className={styles.contactForm}>*/}
                {/*                <form>*/}
                {/*                    <div className={styles.formGroup}>*/}
                {/*                        <input type="text" placeholder="Your Name" required />*/}
                {/*                    </div>*/}
                {/*                    <div className={styles.formGroup}>*/}
                {/*                        <input type="email" placeholder="Your Email" required />*/}
                {/*                    </div>*/}
                {/*                    <div className={styles.formGroup}>*/}
                {/*                        <input type="text" placeholder="Subject" required />*/}
                {/*                    </div>*/}
                {/*                    <div className={styles.formGroup}>*/}
                {/*                        <textarea placeholder="Your Message" rows="5" required></textarea>*/}
                {/*                    </div>*/}
                {/*                    <button type="submit" className={styles.submitBtn}>*/}
                {/*                        Send Message*/}
                {/*                    </button>*/}
                {/*                </form>*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</section>*/}
                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-[rgba(51,228,7,0.9)] to-[rgba(51,228,7,0.7)] text-white text-center">
                    <div className="max-w-7xl mx-auto px-8">
                        <h2 className="text-4xl font-bold mb-4">Ready to streamline your IT repair process?</h2>
                        <p className="text-lg mb-8 max-w-3xl mx-auto">
                            Join IOCONNECT today and transform your service management
                        </p>
                        <a
                            href="/signup"
                            className="inline-block bg-white text-[#33e407] px-10 py-4 rounded font-semibold transition-all duration-300 hover:bg-opacity-90 hover:-translate-y-1 hover:shadow-lg"
                        >
                            Get Started Now
                        </a>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-800">
                                Contact <span className="text-[#33e407]">Us</span>
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Get in touch with our team for more information
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-4">
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
                                            className="text-[#33e407]"
                                        >
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Address</h3>
                                    <p className="text-gray-600">8H Peace Valley Friendship St., Lahug Cebu City</p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-4">
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
                                            className="text-[#33e407]"
                                        >
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Phone</h3>
                                    <p className="text-gray-600">032-272-9019</p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center mb-4">
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
                                            className="text-[#33e407]"
                                        >
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Email</h3>
                                    <p className="text-gray-600">info@ioconnect-cbu.com</p>
                                </div>
                            </div>

                            <div>
                                <form className="space-y-6">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            required
                                            className="w-full p-4 border border-gray-300 rounded text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Your Email"
                                            required
                                            className="w-full p-4 border border-gray-300 rounded text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Subject"
                                            required
                                            className="w-full p-4 border border-gray-300 rounded text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            placeholder="Your Message"
                                            rows="5"
                                            required
                                            className="w-full p-4 border border-gray-300 rounded text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-[#33e407] text-white py-4 px-8 rounded font-semibold transition-all duration-300 hover:bg-[#2bc706] hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.2)]"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;