import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from "lucide-react"
import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"

const ContactPage = () => {
    return (
        <div className="font-['Poppins',sans-serif]">
            {/* Navbar would be imported here */}
            <Navbar />

            <main className="mt-20">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-[rgba(93,255,53,0.34)] to-white py-20 text-center">
                    <div className="max-w-7xl mx-auto px-8">
                        <div>
                            <h1 className="text-5xl font-bold mb-6 text-gray-800">
                                Get in <span className="text-[#33e407]">Touch</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                We'd love to hear from you. Reach out to our team with any questions or inquiries.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact Info & Form Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12">
                            <div className="bg-gray-50 p-10 rounded-lg shadow-md">
                                <h2 className="text-3xl font-semibold mb-4 text-gray-800">Contact Information</h2>
                                <p className="text-gray-600 mb-8">
                                    Reach out to us through any of these channels and we'll respond as soon as possible.
                                </p>

                                <div className="flex flex-col gap-6 mb-8">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <MapPin size={24} className="text-[#33e407]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Our Location</h3>
                                            <p className="text-gray-600">8H Peace Valley Friendship St., Lahug Cebu City</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Phone size={24} className="text-[#33e407]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Phone Number</h3>
                                            <p className="text-gray-600">032-272-9019</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Mail size={24} className="text-[#33e407]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Email Address</h3>
                                            <p className="text-gray-600">info@ioconnect-cbu.com</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-start">
                                        <div className="w-12 h-12 bg-[rgba(51,228,7,0.1)] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Clock size={24} className="text-[#33e407]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Business Hours</h3>
                                            <p className="text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                                            <p className="text-gray-600">Saturday: 9:00 AM - 1:00 PM</p>
                                            <p className="text-gray-600">Sunday: Closed</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Connect With Us</h3>
                                    <div className="flex gap-4">
                                        <a
                                            href="https://www.facebook.com/ioconnectcbu"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Facebook"
                                            className="w-10 h-10 bg-[#33e407] rounded-full flex items-center justify-center text-white hover:bg-[#2bc706] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.3)]"
                                        >
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
                                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                            </svg>
                                        </a>
                                        {/* <a
                                            href="https://twitter.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Twitter"
                                            className="w-10 h-10 bg-[#33e407] rounded-full flex items-center justify-center text-white hover:bg-[#2bc706] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.3)]"
                                        >
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
                                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                                            </svg>
                                        </a>
                                        <a
                                            href="https://linkedin.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="LinkedIn"
                                            className="w-10 h-10 bg-[#33e407] rounded-full flex items-center justify-center text-white hover:bg-[#2bc706] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.3)]"
                                        >
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
                                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                                                <rect x="2" y="9" width="4" height="12"></rect>
                                                <circle cx="4" cy="4" r="2"></circle>
                                            </svg>
                                        </a>
                                        <a
                                            href="https://instagram.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Instagram"
                                            className="w-10 h-10 bg-[#33e407] rounded-full flex items-center justify-center text-white hover:bg-[#2bc706] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.3)]"
                                        >
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
                                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                            </svg>
                                        </a> */}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-lg shadow-md border border-gray-100">
                                <div className="flex items-center gap-4 mb-8">
                                    <MessageSquare size={28} className="text-[#33e407]" />
                                    <h2 className="text-3xl font-semibold text-gray-800 m-0">Send Us a Message</h2>
                                </div>
                                <form>
                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        <div className="mb-6">
                                            <label htmlFor="name" className="block mb-2 font-medium text-gray-700">Full Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                placeholder="Enter your full name"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md font-inherit text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                            />
                                        </div>
                                        <div className="mb-6">
                                            <label htmlFor="email" className="block mb-2 font-medium text-gray-700">Email Address</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                placeholder="Enter your email address"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md font-inherit text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        <div className="mb-6">
                                            <label htmlFor="phone" className="block mb-2 font-medium text-gray-700">Phone Number</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                placeholder="Enter your phone number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md font-inherit text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                            />
                                        </div>
                                        <div className="mb-6">
                                            <label htmlFor="subject" className="block mb-2 font-medium text-gray-700">Subject</label>
                                            <input
                                                type="text"
                                                id="subject"
                                                name="subject"
                                                placeholder="What is this regarding?"
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-md font-inherit text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <label htmlFor="message" className="block mb-2 font-medium text-gray-700">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows="6"
                                            placeholder="How can we help you?"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-md font-inherit text-base transition-all focus:outline-none focus:border-[#33e407] focus:ring-2 focus:ring-[rgba(51,228,7,0.1)]"
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 bg-[#33e407] text-white py-4 px-8 rounded-md font-semibold text-base cursor-pointer transition-all hover:bg-[#2bc706] hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(51,228,7,0.2)] w-full"
                                    >
                                        <Send size={18} />
                                        <span>Send Message</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Map Section */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-800">
                                Our <span className="text-[#33e407]">Location</span>
                            </h2>
                            {/* <p className="text-lg text-gray-600">Visit our office in Cebu City</p> */}
                            <p className="text-lg text-gray-600">Address: 8H Peace Valley Friendship St., Lahug Cebu City
                            </p>
                        </div>
                        <div className="relative rounded-lg overflow-hidden shadow-md">
                            <div className="w-full h-[450px] relative">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15695.521165383631!2d123.88999!3d10.33999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9994347e0fc8f%3A0xd3caa399f8e51ce0!2sLahug%2C%20Cebu%20City%2C%20Cebu!5e0!3m2!1sen!2sph!4v1712677618!5m2!1sen!2sph"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="IOCONNECT Office Location"
                                    className="w-full h-full border-0"
                                ></iframe>
                            </div>
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[rgba(51,228,7,0.9)] text-white py-3 px-6 rounded-full flex items-center gap-2 shadow-md z-10 max-w-[90%]">
                                <MapPin size={18} className="flex-shrink-0" />
                                <span>8H Peace Valley Friendship St., Lahug Cebu City</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-800">
                                Frequently Asked <span className="text-[#33e407]">Questions</span>
                            </h2>
                            <p className="text-lg text-gray-600">Find answers to common questions about contacting us</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">What are your response times for inquiries?</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    We aim to respond to all inquiries within 24 business hours. For urgent matters, we recommend calling
                                    our office directly at 032-272-9019.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Do you offer on-site consultations?</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Yes, we provide on-site consultations for businesses in Cebu City and surrounding areas. Please
                                    contact us to schedule an appointment with one of our specialists.
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">How can I request a product demo?</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    You can request a product demo by filling out the contact form on this page or by emailing us directly
                                    at info@ioconnect-cbu.com with the subject line "Demo Request."
                                </p>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-lg shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Do you provide technical support for your products?</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Yes, we offer comprehensive technical support for all our products. Existing customers can reach our
                                    support team at support@ioconnect-cbu.com or through our dedicated support portal.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-br from-[rgba(51,228,7,0.9)] to-[rgba(51,228,7,0.7)] text-white text-center">
                    <div className="max-w-7xl mx-auto px-8">
                        <h2 className="text-4xl font-bold mb-4">Ready to transform your IT repair management?</h2>
                        <p className="text-lg mb-8 max-w-2xl mx-auto">Join hundreds of businesses that trust IOCONNECT for their repair workflow needs</p>
                        <a
                            href="/signup"
                            className="bg-white text-[#33e407] py-4 px-10 rounded-md font-semibold inline-block transition-all hover:bg-white/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10"
                        >
                            Get Started Now
                        </a>
                    </div>
                </section>
            </main>

            {/* Footer would be imported here */}
            <Footer />
        </div>
    )
}

export default ContactPage