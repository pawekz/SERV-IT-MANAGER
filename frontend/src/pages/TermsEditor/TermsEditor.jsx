import { Link } from "react-router-dom"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function TermsEditor() {
    return (
        <div className="">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            </div>
            <main className="container mx-auto max-w-4xl">
                <div className="prose max-w-none">
                    <div className="bg-gradient-to-r from-[#33e407]/10 to-transparent p-4 rounded-lg mb-8">
                        <p className="text-gray-700">
                            Welcome to IOCONNECT, an IT repair management system that automates repair tracking,
                            enhances customer communication, and improves service efficiency for IT service providers. Please read
                            these Terms of Service carefully before using our platform.
                        </p>
                    </div>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">1.</span> Acceptance of Terms
                        </h2>
                        <p className="mb-4">
                             you agree to be bound by these Terms of Service and all applicable
                            laws and regulations. If you do not agree with any of these terms, you are prohibited from using or
                            accessing this platform.
                        </p>
                        <div className="pl-6 border-l-4 border-[#33e407]/30">
                            <p className="italic text-gray-600">
                                Your continued use of IOCONNECT Manager constitutes your acceptance of any updates or modifications to
                                these Terms of Service.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">2.</span> Service Description
                        </h2>
                        <p className="mb-4">
                            IOCONNECT Manager provides a platform for IT service providers to manage repair services, track repair
                            status, communicate with customers, and improve overall service efficiency.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm">
                                        Automated repair tracking system for efficient management of IT service requests
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm">
                                        Enhanced customer communication tools to keep clients informed throughout the repair process
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm">
                                        Workflow optimization features to improve service efficiency and reduce turnaround time
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2 flex-shrink-0" />
                                    <p className="text-sm">
                                        Reporting and analytics tools to monitor performance and identify areas for improvement
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">3.</span> Customer Responsibilities
                        </h2>
                        <p className="mb-4=">
                            • Provide accurate information about the device and the issues requiring service <br/>
                            • Back up all data before submitting devices for repair <br/>
                            • Remove any accessories not required for the repair <br/>
                            • Disable any security features that might prevent access to the device <br/>
                        </p>

                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">4.</span> Data Privacy and Security
                        </h2>
                        <p className="mb-4">
                            We take the privacy and security of your data seriously. Our collection, use, and processing of personal
                            information is governed by our Privacy Policy, which is incorporated into these Terms of Service by
                            reference.
                        </p>
                        <p className="mb-4">
                            You acknowledge that you have read and understand our Privacy Policy, and agree that we may collect, use,
                            and disclose your information as described therein.
                        </p>
                        <div className="bg-[#33e407]/5 p-4 rounded-lg border border-[#33e407]/20 my-4">
                            <p className="text-sm font-medium">
                                IOCONNECT implements industry-standard security measures to protect your data, but no method of
                                transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially
                                acceptable means to protect your personal information, we cannot guarantee its absolute security.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">5.</span> Subscription and Billing
                        </h2>
                        <p className="mb-4">
                            IOCONNECT Manager offers various subscription plans. By selecting a subscription plan, you agree to pay the
                            subscription fees as described at the time of purchase. Subscription fees are billed in advance on a
                            recurring basis based on your selected billing cycle.
                        </p>
                        <p className="mb-4">
                            You may cancel your subscription at any time, but no refunds will be provided for any unused portion of
                            your current billing period. Upon cancellation, your access to IOCONNECT Manager will continue until the end
                            of your current billing period.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">6.</span> Warranty
                        </h2>
                        <p className="mb-4">
                            All repairs come with a 90-day warranty covering parts and labor for the specific repair performed. This warranty does not cover:
                        </p>
                        <p className="mb-4">
                            • Damage caused by accidents, misuse, or abuse after the repair <br/>
                            • Water or liquid damage <br/>
                            • Issues unrelated to the original repair<br/>
                        </p>
                    </section>


                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">7.</span> Limitation of Liability
                        </h2>
                        <p className="mb-4">
                            IOCONNECT is not responsible for data loss during the repair process.
                            We strongly recommend backing up all data before submitting devices for repair.
                            Our maximum liability is limited to the cost of the repair service provided.
                        </p>

                    </section>



                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center">
                            <span className="text-[#33e407] mr-2">8.</span> Contact Us
                        </h2>
                        <p className="mb-4">If you have any questions about these Terms, please contact us at:</p>
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <p className="font-medium mb-1">IOCONNECT</p>
                            <p className="mb-1">Email: info@ioconnect-cbu.com</p>
                            <p className="mb-1">Phone: 032-272-9019</p>
                            {/*<p>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</p>*/}
                        </div>
                    </section>
                </div>
            </main>


        </div>
    )
}
