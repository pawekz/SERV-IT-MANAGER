import { useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    Monitor,
    MessageCircle,
    Clock,
    AlertCircle,
    Shield,
    Zap,
    Users,
    Phone,
    Mail,
    Search
} from "lucide-react";

const Button = ({ children, variant = "default", className = "", onClick, disabled, ...props }) => {
    const baseStyles =
        "px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        default: "bg-[#33e407] text-white hover:bg-[#28b905] focus:ring-[#33e407]",
        outline: "border border-[#33e407] text-[#33e407] hover:bg-[#33e407] hover:text-white focus:ring-[#33e407]"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

const Input = ({ className = "", ...props }) => (
    <input
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-[#33e407] ${className}`}
        {...props}
    />
);

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }) => <div className={`px-4 sm:px-5 py-3 ${className}`}>{children}</div>;

const CardTitle = ({ children, className = "" }) => <h3 className={`text-base font-semibold ${className}`}>{children}</h3>;

const CardContent = ({ children, className = "" }) => <div className={`px-4 sm:px-5 pb-4 ${className}`}>{children}</div>;

const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-gray-100 text-gray-700",
        secondary: "bg-white/20 text-white"
    };
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
        >
            {children}
        </span>
    );
};

const faqCategories = [
    {
        title: "Getting Started",
        icon: <Zap className="w-5 h-5" />,
        questions: [
            {
                question: "How do I submit a repair request?",
                answer:
                    "To submit a repair request, log into your IOCONNECT portal and click 'New Repair Request'. Fill out the device information, describe the issue in detail, and attach any relevant photos. You'll receive a confirmation email with your ticket number within minutes."
            },
            {
                question: "What information do I need to provide when submitting a request?",
                answer:
                    "Please provide: Device make and model, serial number (if available), detailed description of the issue, when the problem started, any error messages, and your preferred contact method. The more details you provide, the faster we can diagnose and resolve your issue."
            },
            {
                question: "How do I create an account?",
                answer:
                    "Click 'Sign Up' on the login page, enter your business information, email address, and create a secure password. You'll receive a verification email to activate your account. Once verified, you can immediately start submitting repair requests."
            }
        ]
    },
    {
        title: "Tracking & Status",
        icon: <Monitor className="w-5 h-5" />,
        questions: [
            {
                question: "How do I check my repair status?",
                answer:
                    "Log into your IOCONNECT dashboard and navigate to 'My Repairs'. You'll see all your active and completed repairs with real-time status updates. You can also click on any repair for detailed progress information and technician notes."
            },
            {
                question: "What do the different status indicators mean?",
                answer:
                    "• Submitted: Request received and queued • In Progress: Technician is working on your device • Awaiting Parts: Waiting for replacement components • Testing: Device is being tested after repair • Ready for Pickup: Repair completed, ready for collection • Completed: Device has been returned to customer"
            },
            {
                question: "How often is the status updated?",
                answer:
                    "Status updates occur in real-time as technicians progress through repairs. You'll receive automatic email notifications for major status changes, and you can check the portal anytime for the most current information."
            },
            {
                question: "Can I track multiple devices at once?",
                answer:
                    "Yes! Your dashboard displays all your devices in one convenient view. You can filter by status, date, device type, or search by ticket number. Each device has its own tracking timeline and status indicator."
            }
        ]
    },
    {
        title: "Communication & Notifications",
        icon: <MessageCircle className="w-5 h-5" />,
        questions: [
            {
                question: "How will I be notified about updates?",
                answer:
                    "IOCONNECT sends automatic notifications via email and SMS (if enabled) for status changes, completion notices, and important updates. You can customize your notification preferences in your account settings."
            },
            {
                question: "Can I communicate directly with the technician?",
                answer:
                    "Yes! Each repair ticket includes a secure messaging system where you can ask questions, provide additional information, or clarify requirements directly with the assigned technician."
            },
            {
                question: "What if I need to provide additional information after submitting?",
                answer:
                    "You can add comments, upload additional photos, or provide more details through the ticket messaging system. Simply log in, find your repair, and use the 'Add Comment' or 'Upload Files' options."
            }
        ]
    },
    {
        title: "Service & Pricing",
        icon: <Clock className="w-5 h-5" />,
        questions: [
            {
                question: "How long do repairs typically take?",
                answer:
                    "Repair times vary by complexity: Simple software issues (1-2 days), Hardware replacements (3-5 days), Complex motherboard repairs (5-10 days). You'll receive an estimated completion time after initial diagnosis."
            },
            {
                question: "How do I get a quote for my repair?",
                answer:
                    "After submitting your repair request, our technicians will perform a free diagnostic and provide a detailed quote within 24 hours. You'll receive the quote via email and can approve or decline through your portal."
            },
            {
                question: "What payment methods do you accept?",
                answer:
                    "We accept all major credit cards, bank transfers, and business accounts. Payment is processed securely through our portal once you approve the repair quote. Invoices are automatically generated for your records."
            },
            {
                question: "Do you offer warranty on repairs?",
                answer:
                    "Yes! All repairs come with a 90-day warranty on parts and labor. If the same issue occurs within the warranty period, we'll fix it at no additional charge. Warranty details are included with your completed repair documentation."
            }
        ]
    },
    {
        title: "Account & Security",
        icon: <Shield className="w-5 h-5" />,
        questions: [
            {
                question: "How secure is my data?",
                answer:
                    "IOCONNECT uses enterprise-grade security with 256-bit SSL encryption, secure data centers, and strict access controls. We're SOC 2 compliant and follow industry best practices for data protection. Your information is never shared with third parties."
            },
            {
                question: "Can I manage multiple locations or users?",
                answer:
                    "Yes! Business accounts can add multiple users, set permissions, and manage repairs across different locations. Administrators can view all repairs, generate reports, and manage team access through the admin panel."
            },
            {
                question: "How do I reset my password?",
                answer:
                    "Click 'Forgot Password' on the login page, enter your email address, and you'll receive a secure reset link. Follow the instructions in the email to create a new password. For security, reset links expire after 24 hours."
            }
        ]
    },
    {
        title: "Troubleshooting",
        icon: <AlertCircle className="w-5 h-5" />,
        questions: [
            {
                question: "I can't log into my account. What should I do?",
                answer:
                    "First, try resetting your password. If that doesn't work, check if your account email is correct and ensure your internet connection is stable. Clear your browser cache or try a different browser. If issues persist, contact our support team."
            },
            {
                question: "Why can't I upload photos to my repair request?",
                answer:
                    "Ensure your photos are under 10MB each and in JPG, PNG, or PDF format. Check your internet connection and try refreshing the page. If using mobile, ensure the app has camera permissions. Contact support if problems continue."
            },
            {
                question: "The status hasn't updated in several days. Is this normal?",
                answer:
                    "Some complex repairs may have longer periods between updates, especially when waiting for parts. If there's no update for more than 3 business days, use the messaging system to request a status update from your technician."
            }
        ]
    }
];

const FAQModal = ({ showHeader = true, enableContactCTA = true }) => {
    const [openItems, setOpenItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const toggleItem = (index) => {
        setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
    };

    const filteredCategories = useMemo(
        () =>
            faqCategories
                .map((category) => ({
                    ...category,
                    questions: category.questions.filter(
                        (q) =>
                            q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            q.answer.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                }))
                .filter((category) => category.questions.length > 0),
        [searchTerm]
    );

    const scrollContainerClasses =
        "space-y-4 overflow-y-auto pr-1 sm:pr-2 max-h-[calc(100vh-24rem)] sm:max-h-[calc(100vh-20rem)] lg:max-h-[45vh]";

    return (
        <div className="flex flex-col gap-5 h-full">
            {showHeader && (
                <div className="space-y-3 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <div className="bg-[#33e407]/10 p-3 rounded-xl">
                                <Monitor className="w-6 h-6 text-[#33e407]" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
                                    IOCONNECT <span className="text-[#33e407]">FAQ</span>
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500">Quick answers in a clean, modern layout.</p>
                            </div>
                        </div>
                        <div className="w-full sm:w-64 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <Search className="text-gray-400 flex-shrink-0" size={16} />
                            <Input
                                type="search"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border-none focus:ring-0 focus:border-none px-0"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex-1 ${scrollContainerClasses}`}>
                {filteredCategories.map((category, categoryIndex) => (
                    <Card key={category.title} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-[#33e407] to-[#28b905] text-white">
                            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                                {category.icon}
                                <span>{category.title}</span>
                                <Badge variant="secondary">{category.questions.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 divide-y divide-gray-50">
                            {category.questions.map((faq, faqIndex) => {
                                const globalIndex = categoryIndex * 100 + faqIndex;
                                const isOpen = openItems.includes(globalIndex);
                                return (
                                    <div key={`${category.title}-${faq.question}`}>
                                        <button
                                            onClick={() => toggleItem(globalIndex)}
                                            className="w-full px-4 sm:px-5 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between gap-3"
                                            aria-expanded={isOpen}
                                        >
                                            <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                                            {isOpen ? (
                                                <ChevronUp className="w-4 h-4 text-[#33e407] flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            )}
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 sm:px-5 pb-3 text-sm text-gray-600 leading-relaxed bg-gray-50">
                                                {faq.answer.split("•").map((part, index) => {
                                                    if (index === 0) {
                                                        return (
                                                            <p key={`paragraph-${index}`} className="mb-2">
                                                                {part.trim()}
                                                            </p>
                                                        );
                                                    }
                                                    return (
                                                        <div key={`bullet-${index}`} className="flex items-start gap-2 mb-1">
                                                            <span className="text-[#33e407] font-bold mt-1">•</span>
                                                            <span>{part.trim()}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
                {filteredCategories.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                        No results found. Try another search term.
                    </div>
                )}
            </div>

            {enableContactCTA && (
                <Card className="bg-white border border-gray-100 shadow-sm">
                    <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Still need help?</h3>
                            <p className="text-sm text-gray-500">Our team usually responds within two hours.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button className="flex items-center justify-center gap-2">
                                <Phone size={15} />
                                Call
                            </Button>
                            <Button variant="outline" className="flex items-center justify-center gap-2">
                                <Mail size={15} />
                                Email
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FAQModal;

