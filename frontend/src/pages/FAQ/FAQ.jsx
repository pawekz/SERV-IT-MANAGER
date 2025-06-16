"use client"

import { useState } from "react"
import {
    ChevronDown,
    ChevronUp,
    Search,
    Monitor,
    MessageCircle,
    Clock,
    CheckCircle,
    AlertCircle,
    Phone,
    Mail,
    Shield,
    Zap,
    Users,
} from "lucide-react"

import Footer from "../../components/Footer/Footer.jsx"

// Custom Button Component
const Button = ({ children, variant = "default", className = "", onClick, disabled, ...props }) => {
    const baseStyles =
        "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
    const variants = {
        default: "bg-[#33e407] text-white hover:bg-[#28b905] focus:ring-[#33e407]",
        outline: "border-2 border-current bg-transparent hover:bg-current hover:bg-opacity-10 focus:ring-current",
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}

// Custom Input Component
const Input = ({ className = "", ...props }) => {
    return (
        <input
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-[#33e407] ${className}`}
            {...props}
        />
    )
}

// Custom Card Components
const Card = ({ children, className = "" }) => {
    return <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>{children}</div>
}

const CardHeader = ({ children, className = "" }) => {
    return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

const CardTitle = ({ children, className = "" }) => {
    return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
}

const CardContent = ({ children, className = "" }) => {
    return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}

// Custom Badge Component
const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-gray-100 text-gray-800",
        secondary: "bg-gray-200 text-gray-700",
    }

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        >
      {children}
    </span>
    )
}

export default function FAQPage() {
    const [openItems, setOpenItems] = useState([])
    const [searchTerm, setSearchTerm] = useState("")

    const toggleItem = (index) => {
        setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
    }

    const faqCategories = [
        {
            title: "Getting Started",
            icon: <Zap className="w-5 h-5" />,
            questions: [
                {
                    question: "How do I submit a repair request?",
                    answer:
                        "To submit a repair request, log into your IOCONNECT portal and click 'New Repair Request'. Fill out the device information, describe the issue in detail, and attach any relevant photos. You'll receive a confirmation email with your ticket number within minutes.",
                },
                {
                    question: "What information do I need to provide when submitting a request?",
                    answer:
                        "Please provide: Device make and model, serial number (if available), detailed description of the issue, when the problem started, any error messages, and your preferred contact method. The more details you provide, the faster we can diagnose and resolve your issue.",
                },
                {
                    question: "How do I create an account?",
                    answer:
                        "Click 'Sign Up' on the login page, enter your business information, email address, and create a secure password. You'll receive a verification email to activate your account. Once verified, you can immediately start submitting repair requests.",
                },
            ],
        },
        {
            title: "Tracking & Status",
            icon: <Monitor className="w-5 h-5" />,
            questions: [
                {
                    question: "How do I check my repair status?",
                    answer:
                        "Log into your IOCONNECT dashboard and navigate to 'My Repairs'. You'll see all your active and completed repairs with real-time status updates. You can also click on any repair for detailed progress information and technician notes.",
                },
                {
                    question: "What do the different status indicators mean?",
                    answer:
                        "• Submitted: Request received and queued • In Progress: Technician is working on your device • Awaiting Parts: Waiting for replacement components • Testing: Device is being tested after repair • Ready for Pickup: Repair completed, ready for collection • Completed: Device has been returned to customer",
                },
                {
                    question: "How often is the status updated?",
                    answer:
                        "Status updates occur in real-time as technicians progress through repairs. You'll receive automatic email notifications for major status changes, and you can check the portal anytime for the most current information.",
                },
                {
                    question: "Can I track multiple devices at once?",
                    answer:
                        "Yes! Your dashboard displays all your devices in one convenient view. You can filter by status, date, device type, or search by ticket number. Each device has its own tracking timeline and status indicator.",
                },
            ],
        },
        {
            title: "Communication & Notifications",
            icon: <MessageCircle className="w-5 h-5" />,
            questions: [
                {
                    question: "How will I be notified about updates?",
                    answer:
                        "IOCONNECT sends automatic notifications via email and SMS (if enabled) for status changes, completion notices, and important updates. You can customize your notification preferences in your account settings.",
                },
                {
                    question: "Can I communicate directly with the technician?",
                    answer:
                        "Yes! Each repair ticket includes a secure messaging system where you can ask questions, provide additional information, or clarify requirements directly with the assigned technician.",
                },
                {
                    question: "What if I need to provide additional information after submitting?",
                    answer:
                        "You can add comments, upload additional photos, or provide more details through the ticket messaging system. Simply log in, find your repair, and use the 'Add Comment' or 'Upload Files' options.",
                },
            ],
        },
        {
            title: "Service & Pricing",
            icon: <Clock className="w-5 h-5" />,
            questions: [
                {
                    question: "How long do repairs typically take?",
                    answer:
                        "Repair times vary by complexity: Simple software issues (1-2 days), Hardware replacements (3-5 days), Complex motherboard repairs (5-10 days). You'll receive an estimated completion time after initial diagnosis.",
                },
                {
                    question: "How do I get a quote for my repair?",
                    answer:
                        "After submitting your repair request, our technicians will perform a free diagnostic and provide a detailed quote within 24 hours. You'll receive the quote via email and can approve or decline through your portal.",
                },
                {
                    question: "What payment methods do you accept?",
                    answer:
                        "We accept all major credit cards, bank transfers, and business accounts. Payment is processed securely through our portal once you approve the repair quote. Invoices are automatically generated for your records.",
                },
                {
                    question: "Do you offer warranty on repairs?",
                    answer:
                        "Yes! All repairs come with a 90-day warranty on parts and labor. If the same issue occurs within the warranty period, we'll fix it at no additional charge. Warranty details are included with your completed repair documentation.",
                },
            ],
        },
        {
            title: "Account & Security",
            icon: <Shield className="w-5 h-5" />,
            questions: [
                {
                    question: "How secure is my data?",
                    answer:
                        "IOCONNECT uses enterprise-grade security with 256-bit SSL encryption, secure data centers, and strict access controls. We're SOC 2 compliant and follow industry best practices for data protection. Your information is never shared with third parties.",
                },
                {
                    question: "Can I manage multiple locations or users?",
                    answer:
                        "Yes! Business accounts can add multiple users, set permissions, and manage repairs across different locations. Administrators can view all repairs, generate reports, and manage team access through the admin panel.",
                },
                {
                    question: "How do I reset my password?",
                    answer:
                        "Click 'Forgot Password' on the login page, enter your email address, and you'll receive a secure reset link. Follow the instructions in the email to create a new password. For security, reset links expire after 24 hours.",
                },
            ],
        },
        {
            title: "Troubleshooting",
            icon: <AlertCircle className="w-5 h-5" />,
            questions: [
                {
                    question: "I can't log into my account. What should I do?",
                    answer:
                        "First, try resetting your password. If that doesn't work, check if your account email is correct and ensure your internet connection is stable. Clear your browser cache or try a different browser. If issues persist, contact our support team.",
                },
                {
                    question: "Why can't I upload photos to my repair request?",
                    answer:
                        "Ensure your photos are under 10MB each and in JPG, PNG, or PDF format. Check your internet connection and try refreshing the page. If using mobile, ensure the app has camera permissions. Contact support if problems continue.",
                },
                {
                    question: "The status hasn't updated in several days. Is this normal?",
                    answer:
                        "Some complex repairs may have longer periods between updates, especially when waiting for parts. If there's no update for more than 3 business days, use the messaging system to request a status update from your technician.",
                },
            ],
        },
    ]

    const filteredCategories = faqCategories
        .map((category) => ({
            ...category,
            questions: category.questions.filter(
                (q) =>
                    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        }))
        .filter((category) => category.questions.length > 0)

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-[#33e407] bg-opacity-10 p-3 rounded-full">
                                <Monitor className="w-8 h-8 text-[#33e407]" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            IOCONNECT
                            <span className="text-[#33e407] ml-2">FAQ</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Your complete guide to using our IT repair management system. Find answers to common questions and learn
                            how to get the most out of IOCONNECT.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">




                {/* FAQ Categories */}
                <div className="space-y-8">
                    {filteredCategories.map((category, categoryIndex) => (
                        <Card key={categoryIndex} className="overflow-hidden shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-[#33e407] to-[#28b905] text-white">
                                <CardTitle className="flex items-center gap-3 text-xl">
                                    {category.icon}
                                    {category.title}
                                    <Badge variant="secondary" className="bg-white bg-opacity-20 text-white">
                                        {category.questions.length} questions
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {category.questions.map((faq, faqIndex) => {
                                    const globalIndex = categoryIndex * 100 + faqIndex
                                    const isOpen = openItems.includes(globalIndex)

                                    return (
                                        <div key={faqIndex} className="border-b border-gray-200 last:border-b-0">
                                            <button
                                                onClick={() => toggleItem(globalIndex)}
                                                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between group"
                                            >
                        <span className="font-medium text-gray-900 group-hover:text-[#33e407] transition-colors">
                          {faq.question}
                        </span>
                                                {isOpen ? (
                                                    <ChevronUp className="w-5 h-5 text-[#33e407] flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#33e407] flex-shrink-0 transition-colors" />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 pb-4 text-gray-700 leading-relaxed bg-gray-50">
                                                    {faq.answer.split("•").map((part, index) => {
                                                        if (index === 0)
                                                            return (
                                                                <p key={index} className="mb-2">
                                                                    {part}
                                                                </p>
                                                            )
                                                        return (
                                                            <div key={index} className="flex items-start gap-2 mb-1">
                                                                <span className="text-[#33e407] font-bold mt-1">•</span>
                                                                <span>{part.trim()}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Contact Support Section */}
                <Card className="mt-12 bg-gray-600 text-white">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
                            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                                Can't find what you're looking for? Our support team is available 24/7 to help you with any questions or
                                issues.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 max-w-2xl mx-auto">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#33e407] bg-opacity-20 p-3 rounded-full flex items-center justify-center">
                                        <Phone className="w-6 h-6 text-[#33e407]" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold mb-1">Phone Support</h3>
                                        <p className="text-gray-300 text-sm mb-2">Available 24/7 for urgent issues</p>
                                        <Button
                                            variant="outline"
                                            className="border-[#33e407] text-[#33e407] hover:bg-[#33e407] hover:text-white"
                                        >
                                            Call Now
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#33e407] bg-opacity-20 p-3 rounded-full flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-[#33e407]" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold mb-1">Email Support</h3>
                                        <p className="text-gray-300 text-sm mb-2">Response within 2 hours</p>
                                        <Button
                                            variant="outline"
                                            className="border-[#33e407] text-[#33e407] hover:bg-[#33e407] hover:text-white"
                                        >
                                            Send Email
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        <Footer/>
        </div>
    )
}
