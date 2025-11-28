import { CheckCircle } from "lucide-react";

export default function TOCModal() {
    return (
        <div className="font-sans text-gray-800">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-[#33e407]">Terms of Service</h1>
            </div>
            <main className="mx-auto max-w-3xl">
                <div className="space-y-10">
                    {/* Introduction */}
                    <section className="bg-[#33e407]/5 p-6 rounded-xl border border-[#33e407]/10">
                        <p className="text-gray-700 leading-relaxed">
                            Welcome to <span className="font-semibold text-[#33e407]">IOCONNECT</span>, an IT repair management system that automates repair tracking, enhances customer communication, and improves service efficiency for IT service providers. Please read these Terms of Service carefully before using our platform.
                        </p>
                    </section>
                    {/* 1. Acceptance of Terms */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">1.</span> Acceptance of Terms
                        </h2>
                        <p className="mb-2 text-gray-600">
                            By using this platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
                        </p>
                        <div className="pl-4 border-l-4 border-[#33e407]/30">
                            <p className="italic text-gray-500">
                                Your continued use of IOCONNECT Manager constitutes your acceptance of any updates or modifications to these Terms of Service.
                            </p>
                        </div>
                    </section>
                    {/* 2. Service Description */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">2.</span> Service Description
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <li className="bg-white p-4 rounded-lg border border-gray-100 flex items-start">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2" />
                                <span>Automated repair tracking system for efficient management of IT service requests</span>
                            </li>
                            <li className="bg-white p-4 rounded-lg border border-gray-100 flex items-start">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2" />
                                <span>Enhanced customer communication tools to keep clients informed throughout the repair process</span>
                            </li>
                            <li className="bg-white p-4 rounded-lg border border-gray-100 flex items-start">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2" />
                                <span>Workflow optimization features to improve service efficiency and reduce turnaround time</span>
                            </li>
                            <li className="bg-white p-4 rounded-lg border border-gray-100 flex items-start">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5 mr-2" />
                                <span>Reporting and analytics tools to monitor performance and identify areas for improvement</span>
                            </li>
                        </ul>
                    </section>
                    {/* 3. User Responsibilities */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">3.</span> User Responsibilities
                        </h2>
                        <ul className="list-disc pl-8 text-gray-600 space-y-2">
                            <li>Provide accurate and complete information when using the platform.</li>
                            <li>Maintain the confidentiality of your account credentials.</li>
                            <li>Comply with all applicable laws and regulations.</li>
                            <li>Do not misuse the platform or attempt unauthorized access.</li>
                        </ul>
                    </section>
                    {/* 4. Data Privacy */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">4.</span> Data Privacy
                        </h2>
                        <p className="text-gray-600 mb-2">
                            We are committed to protecting your privacy. Your personal information will only be used for the purposes of providing and improving our services, and will not be shared with third parties except as required by law.
                        </p>
                        <div className="pl-4 border-l-4 border-[#33e407]/30">
                            <p className="italic text-gray-500">
                                For more details, please refer to our Privacy Policy.
                            </p>
                        </div>
                    </section>
                    {/* 5. Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">5.</span> Limitation of Liability
                        </h2>
                        <p className="text-gray-600">
                            IOCONNECT and its affiliates are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. The platform is provided "as is" without warranties of any kind.
                        </p>
                    </section>
                    {/* 6. Modifications to Terms */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">6.</span> Modifications to Terms
                        </h2>
                        <p className="text-gray-600">
                            We reserve the right to update or modify these Terms of Service at any time. Changes will be effective immediately upon posting. Continued use of the platform constitutes acceptance of the revised terms.
                        </p>
                    </section>
                    {/* 7. Termination */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">7.</span> Termination
                        </h2>
                        <p className="text-gray-600">
                            We may suspend or terminate your access to the platform at our discretion, without notice, for conduct that violates these Terms of Service or is otherwise harmful to other users or the platform.
                        </p>
                    </section>
                    {/* 8. Contact Us */}
                    <section>
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                            <span className="text-[#33e407] mr-2">8.</span> Contact Us
                        </h2>
                        <div className="bg-white p-4 rounded-lg border border-gray-100">
                            <p className="font-medium mb-1">IOCONNECT</p>
                            <p className="mb-1">Email: info@ioconnect-cbu.com</p>
                            <p className="mb-1">Phone: 032-272-9019</p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}