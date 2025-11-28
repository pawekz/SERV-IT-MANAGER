import { CheckCircle } from "lucide-react";

export default function TOCModal() {
    return (
        <div className="font-sans text-gray-800 bg-white px-4 py-6 sm:px-6 lg:px-8">
            <main className="mx-auto max-w-2xl space-y-4">
                <div className="space-y-6">
                    {/* Introduction */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-[#33e407]/5 p-6 shadow-sm">
                        <p className="text-gray-700 leading-relaxed">
                            Welcome to <span className="font-semibold text-[#33e407]">IOCONNECT</span>, an IT repair management system that automates repair tracking, enhances customer communication, and improves service efficiency for IT service providers. Please read these Terms of Service carefully before using our platform.
                        </p>
                    </section>
                    {/* 1. Acceptance of Terms */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">1.</span>
                            <span className="uppercase">Acceptance of Terms</span>
                        </h2>
                        <p className="mb-4 text-gray-600 leading-relaxed">
                            By using this platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
                        </p>
                        <div className="pl-4 border-l-2 border-dashed border-[#33e407]/40">
                            <p className="italic text-gray-500 leading-relaxed">
                                Your continued use of IOCONNECT Manager constitutes your acceptance of any updates or modifications to these Terms of Service.
                            </p>
                        </div>
                    </section>
                    {/* 2. Service Description */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">2.</span>
                            <span className="uppercase">Service Description</span>
                        </h2>
                        <ul className="grid grid-cols-1 gap-3">
                            <li className="flex items-start gap-3 rounded-xl border border-[#33e407]/10 bg-white px-4 py-3">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5" />
                                <span>Automated repair tracking system for efficient management of IT service requests</span>
                            </li>
                            <li className="flex items-start gap-3 rounded-xl border border-[#33e407]/10 bg-white px-4 py-3">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5" />
                                <span>Enhanced customer communication tools to keep clients informed throughout the repair process</span>
                            </li>
                            <li className="flex items-start gap-3 rounded-xl border border-[#33e407]/10 bg-white px-4 py-3">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5" />
                                <span>Workflow optimization features to improve service efficiency and reduce turnaround time</span>
                            </li>
                            <li className="flex items-start gap-3 rounded-xl border border-[#33e407]/10 bg-white px-4 py-3">
                                <CheckCircle className="h-5 w-5 text-[#33e407] mt-0.5" />
                                <span>Reporting and analytics tools to monitor performance and identify areas for improvement</span>
                            </li>
                        </ul>
                    </section>
                    {/* 3. User Responsibilities */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">3.</span>
                            <span className="uppercase">User Responsibilities</span>
                        </h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex gap-3">
                                <span className="text-[#33e407] font-semibold">•</span>
                                <span>Provide accurate and complete information when using the platform.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#33e407] font-semibold">•</span>
                                <span>Maintain the confidentiality of your account credentials.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#33e407] font-semibold">•</span>
                                <span>Comply with all applicable laws and regulations.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-[#33e407] font-semibold">•</span>
                                <span>Do not misuse the platform or attempt unauthorized access.</span>
                            </li>
                        </ul>
                    </section>
                    {/* 4. Data Privacy */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">4.</span>
                            <span className="uppercase">Data Privacy</span>
                        </h2>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            We are committed to protecting your privacy. Your personal information will only be used for the purposes of providing and improving our services, and will not be shared with third parties except as required by law.
                        </p>
                        <div className="bg-[#33e407]/5 rounded-xl p-4 border border-dashed border-[#33e407]/40">
                            <p className="italic text-gray-500 leading-relaxed">
                                For more details, please refer to our Privacy Policy.
                            </p>
                        </div>
                    </section>
                    {/* 5. Limitation of Liability */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">5.</span>
                            <span className="uppercase">Limitation of Liability</span>
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            IOCONNECT and its affiliates are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. The platform is provided "as is" without warranties of any kind.
                        </p>
                    </section>
                    {/* 6. Modifications to Terms */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">6.</span>
                            <span className="uppercase">Modifications to Terms</span>
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to update or modify these Terms of Service at any time. Changes will be effective immediately upon posting. Continued use of the platform constitutes acceptance of the revised terms.
                        </p>
                    </section>
                    {/* 7. Termination */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">7.</span>
                            <span className="uppercase">Termination</span>
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may suspend or terminate your access to the platform at our discretion, without notice, for conduct that violates these Terms of Service or is otherwise harmful to other users or the platform.
                        </p>
                    </section>
                    {/* 8. Contact Us */}
                    <section className="rounded-2xl border border-[#33e407]/10 bg-white/80 p-6 shadow-sm backdrop-blur">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 tracking-wide">
                            <span className="text-[#33e407] text-sm font-bold">8.</span>
                            <span className="uppercase">Contact Us</span>
                        </h2>
                        <div className="rounded-xl border border-[#33e407]/15 bg-white px-5 py-4 flex flex-col gap-1">
                            <p className="font-semibold text-gray-900">IOCONNECT</p>
                            <p className="text-gray-600">Email: info@ioconnect-cbu.com</p>
                            <p className="text-gray-600">Phone: 032-272-9019</p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}