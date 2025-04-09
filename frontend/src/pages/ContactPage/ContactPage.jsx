import Navbar from "../../components/Navbar/Navbar"
import Footer from "../../components/Footer/Footer"
import styles from "./ContactPage.module.css"
import { MapPin, Phone, Mail, Clock, MessageSquare, Send } from "lucide-react"

const ContactPage = () => {
    return (
        <div className={styles.contactPage}>
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div className={styles.container}>
                        <div className={styles.heroContent}>
                            <h1>
                                Get in <span>Touch</span>
                            </h1>
                            <p>We'd love to hear from you. Reach out to our team with any questions or inquiries.</p>
                        </div>
                    </div>
                </section>

                {/* Contact Info & Form Section */}
                <section className={styles.contactSection}>
                    <div className={styles.container}>
                        <div className={styles.contactWrapper}>
                            <div className={styles.contactInfo}>
                                <h2>Contact Information</h2>
                                <p>Reach out to us through any of these channels and we'll respond as soon as possible.</p>

                                <div className={styles.infoItems}>
                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}>
                                            <MapPin size={24} />
                                        </div>
                                        <div className={styles.infoContent}>
                                            <h3>Our Location</h3>
                                            <p>8H Peace Valley Friendship St., Lahug Cebu City</p>
                                        </div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}>
                                            <Phone size={24} />
                                        </div>
                                        <div className={styles.infoContent}>
                                            <h3>Phone Number</h3>
                                            <p>032-272-9019</p>
                                        </div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}>
                                            <Mail size={24} />
                                        </div>
                                        <div className={styles.infoContent}>
                                            <h3>Email Address</h3>
                                            <p>info@ioconnect-cbu.com</p>
                                        </div>
                                    </div>

                                    <div className={styles.infoItem}>
                                        <div className={styles.infoIcon}>
                                            <Clock size={24} />
                                        </div>
                                        <div className={styles.infoContent}>
                                            <h3>Business Hours</h3>
                                            <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                                            <p>Saturday: 9:00 AM - 1:00 PM</p>
                                            <p>Sunday: Closed</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.socialLinks}>
                                    <h3>Connect With Us</h3>
                                    <div className={styles.socialIcons}>
                                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
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
                                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
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
                                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
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
                                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
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
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.contactForm}>
                                <div className={styles.formHeader}>
                                    <MessageSquare size={28} />
                                    <h2>Send Us a Message</h2>
                                </div>
                                <form>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="name">Full Name</label>
                                            <input type="text" id="name" name="name" placeholder="Enter your full name" required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="email">Email Address</label>
                                            <input type="email" id="email" name="email" placeholder="Enter your email address" required />
                                        </div>
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="phone">Phone Number</label>
                                            <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="subject">Subject</label>
                                            <input type="text" id="subject" name="subject" placeholder="What is this regarding?" required />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="message">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows="6"
                                            placeholder="How can we help you?"
                                            required
                                        ></textarea>
                                    </div>
                                    <button type="submit" className={styles.submitBtn}>
                                        <Send size={18} />
                                        <span>Send Message</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Map Section */}
                <section className={styles.mapSection}>
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                Our <span>Location</span>
                            </h2>
                            <p>Visit our office in Cebu City</p>
                        </div>
                        <div className={styles.mapContainer}>
                            <div className={styles.mapWrapper}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15695.521165383631!2d123.88999!3d10.33999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a9994347e0fc8f%3A0xd3caa399f8e51ce0!2sLahug%2C%20Cebu%20City%2C%20Cebu!5e0!3m2!1sen!2sph!4v1712677618!5m2!1sen!2sph"
                                    width="100%"
                                    height="450"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="IOCONNECT Office Location"
                                    className={styles.googleMap}
                                ></iframe>
                            </div>
                            <div className={styles.mapAddressBar}>
                                <MapPin size={18} />
                                <span>8H Peace Valley Friendship St., Lahug Cebu City</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className={styles.faqSection}>
                    <div className={styles.container}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                Frequently Asked <span>Questions</span>
                            </h2>
                            <p>Find answers to common questions about contacting us</p>
                        </div>

                        <div className={styles.faqContainer}>
                            <div className={styles.faqItem}>
                                <h3>What are your response times for inquiries?</h3>
                                <p>
                                    We aim to respond to all inquiries within 24 business hours. For urgent matters, we recommend calling
                                    our office directly at 032-272-9019.
                                </p>
                            </div>

                            <div className={styles.faqItem}>
                                <h3>Do you offer on-site consultations?</h3>
                                <p>
                                    Yes, we provide on-site consultations for businesses in Cebu City and surrounding areas. Please
                                    contact us to schedule an appointment with one of our specialists.
                                </p>
                            </div>

                            <div className={styles.faqItem}>
                                <h3>How can I request a product demo?</h3>
                                <p>
                                    You can request a product demo by filling out the contact form on this page or by emailing us directly
                                    at info@ioconnect-cbu.com with the subject line "Demo Request."
                                </p>
                            </div>

                            <div className={styles.faqItem}>
                                <h3>Do you provide technical support for your products?</h3>
                                <p>
                                    Yes, we offer comprehensive technical support for all our products. Existing customers can reach our
                                    support team at support@ioconnect-cbu.com or through our dedicated support portal.
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
                        <a href="/signup" className={styles.ctaButton}>
                            Get Started Now
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}

export default ContactPage
