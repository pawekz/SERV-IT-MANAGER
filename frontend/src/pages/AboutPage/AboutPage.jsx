import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import { Link } from "react-router-dom"

const AboutPage = () => {
    return (
        <div className="font-['Poppins',sans-serif]">
            <Navbar />

            <main className="mt-20">
                {/* Hero Section */}
                <section className="bg-gradient-to-tr from-[#33e407]/10 to-white py-24 text-center">
                    <div className="max-w-7xl mx-auto px-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800">
                                About <span className="text-[#33e407]">IOCONNECT</span>
                            </h1>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Transforming IT repair management through innovation and excellence
                            </p>
                        </div>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
                                Our <span className="text-[#33e407]">Story</span>
                            </h2>
                            <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                The journey that brought us here
                            </p>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2">
                                <img
                                    src="/ioconnect-logo.png"
                                    alt="IOCONNECT History"
                                    className="w-full rounded-lg shadow-lg"
                                />
                            </div>
                            <div className="lg:w-1/2">
                                <h3 className="text-2xl font-semibold mb-6 text-[#33e407]">
                                    From Humble Beginnings
                                </h3>
                                <p className="mb-4 leading-relaxed text-gray-600">
                                    Founded in 2015, IOCONNECT began as a small IT repair shop in Cebu City with a vision to revolutionize
                                    how businesses manage their IT repair processes. What started as a team of three passionate technicians
                                    has grown into a comprehensive IT repair management solution provider serving businesses across the Philippines.
                                </p>
                                <p className="mb-4 leading-relaxed text-gray-600">
                                    Our founder, recognizing the inefficiencies in traditional paper-based repair tracking systems,
                                    set out to create a digital solution that would streamline the entire repair workflow. After years
                                    of development and refinement, the IOConnect SerV-IT Manager was born – a platform designed by repair
                                    technicians for repair technicians.
                                </p>
                                <p className="leading-relaxed text-gray-600">
                                    Today, IOCONNECT continues to innovate and expand, driven by our commitment to excellence and our
                                    passion for solving complex IT management challenges.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white p-12 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-20 h-20 bg-[#33e407]/10 rounded-full flex items-center justify-center mx-auto mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
                                    Our Mission
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-center">
                                    To empower IT repair businesses with innovative digital solutions that enhance operational efficiency,
                                    improve customer satisfaction, and drive sustainable growth. We are committed to transforming the
                                    repair management landscape through technology that simplifies complex processes.
                                </p>
                            </div>

                            <div className="bg-white p-12 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-20 h-20 bg-[#33e407]/10 rounded-full flex items-center justify-center mx-auto mb-6">
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
                                        className="text-[#33e407]"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 16l4-4-4-4"></path>
                                        <path d="M8 12h8"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
                                    Our Vision
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-center">
                                    To be the global leader in IT repair management solutions, setting the industry standard for
                                    digital transformation in repair services. We envision a world where every repair business,
                                    regardless of size, has access to powerful tools that enable them to deliver exceptional service.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Values Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">
                                Our <span className="text-[#33e407]">Values</span>
                            </h2>
                            <p className="text-lg text-gray-600 max-w-xl mx-auto">
                                The principles that guide everything we do
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-16 h-16 bg-[#33e407]/10 rounded-full flex items-center justify-center mb-6">
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
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Excellence
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We strive for excellence in everything we do, from product development to customer support.
                                    We are committed to delivering solutions that exceed expectations and set new standards in the industry.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-16 h-16 bg-[#33e407]/10 rounded-full flex items-center justify-center mb-6">
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
                                        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                                        <line x1="16" y1="8" x2="2" y2="22"></line>
                                        <line x1="17.5" y1="15" x2="9" y2="15"></line>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Innovation
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We embrace innovation as a core value, constantly seeking new ways to improve our solutions
                                    and address emerging challenges in the IT repair industry. We believe that innovation drives progress.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-16 h-16 bg-[#33e407]/10 rounded-full flex items-center justify-center mb-6">
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
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Customer Focus
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Our customers are at the heart of everything we do. We listen to their needs, anticipate their challenges,
                                    and develop solutions that address their specific requirements. Their success is our success.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                                <div className="w-16 h-16 bg-[#33e407]/10 rounded-full flex items-center justify-center mb-6">
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
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                    Integrity
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We conduct our business with the highest level of integrity, transparency, and ethical standards.
                                    We believe in building trust through honest communication and delivering on our promises.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-tr from-[#33e407]/90 to-[#33e407]/70 text-white text-center">
                    <div className="max-w-7xl mx-auto px-8">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to transform your IT repair management?
                        </h2>
                        <p className="text-lg mb-8 max-w-2xl mx-auto">
                            Join hundreds of businesses that trust IOCONNECT for their repair workflow needs
                        </p>
                        <div className="flex flex-col md:flex-row justify-center gap-6">
                            <Link
                                to="/contact"
                                className="bg-white text-[#33e407] px-10 py-4 rounded font-semibold inline-block transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:w-auto w-full max-w-xs mx-auto"
                                onClick={() => {
                                    window.scrollTo(0, 0);
                                }}
                            >
                                Contact Us
                            </Link>
                            <Link
                                to="/signup"
                                className="bg-transparent text-white px-10 py-4 rounded font-semibold border border-white inline-block transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 md:w-auto w-full max-w-xs mx-auto"
                            >
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