import Sidebar from "../../components/SideBar/Sidebar.jsx"
import {
    HelpCircle,
    Bell,
    User,
    Clock,
    Calendar,
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    FileText,
    MessageSquare,
    Phone,
    Mail,
    HandHelpingIcon as HelpIcon,
} from "lucide-react"

import { Link } from 'react-router-dom';
import { useEffect, useState } from "react";

const CustomerDashboard = () => {
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '********', // Placeholder for security
        role: '' // Added role field
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for customer-specific statistics
    const [stats, setStats] = useState({
        activeRepairs: 1,
        completedRepairs: 5,
        warrantyItems: 2,
        totalSpent: "$1,249.99"
    });

    // State for repair history data
    const [repairData, setRepairData] = useState([]);
    const [repairLoading, setRepairLoading] = useState(true);
    const [repairError, setRepairError] = useState(null);

    // Modal state for repair details
    const [modalData, setModalData] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    // Function to show the repair details modal
    const showRepairDetailsModal = (item) => {
        setModalData(item);
    };

    // Function to close the modal
    const closeModal = () => {
        setModalData(null);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);

                // Check if we have cached user data in sessionStorage first
                const cachedUserData = sessionStorage.getItem('userData');
                if (cachedUserData) {
                    const parsedData = JSON.parse(cachedUserData);
                    setUserData(parsedData);
                    setLoading(false);
                    return;
                }

                // Get token from localStorage if no cached data
                const token = localStorage.getItem('authToken');

                if (!token) {
                    throw new Error("Not authenticated. Please log in.");
                }

                // Try to parse token to get user info
                const decodedToken = parseJwt(token);

                if (decodedToken) {
                    const userData = {
                        firstName: decodedToken.firstName || '',
                        lastName: decodedToken.lastName || '',
                        username: decodedToken.username || decodedToken.sub || '',
                        email: decodedToken.email || decodedToken.sub || '',
                        phoneNumber: decodedToken.phoneNumber || '',
                        password: '********', // Mask password for security
                        role: decodedToken.role || '' // Extract role from token
                    };

                    setUserData(userData);

                    // Cache the user data in sessionStorage for persistence across refreshes
                    sessionStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    // If token can't be decoded, could attempt API call to get user data
                    throw new Error("Could not retrieve user information");
                }
                setError(null);
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Failed to load account information. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Add useEffect to fetch customer repair stats
    useEffect(() => {
        // In a real application, you would fetch actual repair statistics from your backend
        const fetchRepairStats = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                // This would be replaced with an actual API call
                // Example: const response = await fetch('http://localhost:8080/repair/getCustomerStats', {
                //     method: 'GET',
                //     headers: {
                //         'Authorization': `Bearer ${token}`
                //     }
                // });

                // For now, we'll just use the default stats
                // setStats(await response.json());
            } catch (err) {
                console.error("Error fetching repair statistics:", err);
            }
        };

        fetchRepairStats();
    }, []);

    // Add useEffect to fetch repair history
    useEffect(() => {
        const fetchRepairHistory = async () => {
            try {
                setRepairLoading(true);
                const token = localStorage.getItem('authToken');

                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                // This would be replaced with an actual API call
                // Example: const response = await fetch('http://localhost:8080/repair/getCustomerRepairs', {
                //     method: 'GET',
                //     headers: {
                //         'Authorization': `Bearer ${token}`
                //     }
                // });

                // Mock data for now
                const mockRepairData = [
                    { id: 1, device: "iPhone 13", status: "In Progress", date: "May 28, 2025" },
                    { id: 2, device: "MacBook Pro", status: "Completed", date: "May 20, 2025" },
                    { id: 3, device: "iPad Pro", status: "Completed", date: "April 15, 2025" }
                ];

                setRepairData(mockRepairData);
                setRepairError(null);
            } catch (err) {
                console.error("Error fetching repair history:", err);
                setRepairError("Failed to load repair history");
            } finally {
                setRepairLoading(false);
            }
        };

        fetchRepairHistory();
    }, []);

    // Get current repair items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = repairData.slice(indexOfFirstItem, indexOfLastItem);

    // Calculate total pages
    const totalPages = Math.ceil(repairData.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Previous page
    const goToPreviousPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    // Next page
    const goToNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    return (
        <div className="flex min-h-screen">
            {/* Custom Sidebar Component */}
            <Sidebar />

            {/*to seperate the sidebar and the main content*/}
            <div className="w-60  bg-gray-50 shadow-md">
            </div>


            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50">
                {/* Header with User Menu */}
                <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Customer Portal</h2>
                    </div>
                    <div className="flex items-center space-x-5">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <HelpCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <Bell className="h-5 w-5 text-gray-600" />
                        </div>
                        <Link to="/accountinformation" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <User className="h-5 w-5 text-gray-600" />
                        </Link>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Hello {userData.firstName}</h1>

                    {/* Active Repair Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                        <div className="flex flex-col md:flex-row">
                            <div className="w-20 h-20 bg-gray-200 rounded md:mr-5 mb-4 md:mb-0 flex items-center justify-center overflow-hidden">
                                <img src="/placeholder.svg?height=80&width=80" alt="iPhone 13" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xl font-bold text-gray-800">iPhone 13 Repair</div>
                                <div className="text-gray-600 mb-3">Ticket #RT-2023-0042</div>

                                <div className="flex items-center mb-2">
                                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                    <div className="text-sm">Started: May 28, 2025</div>
                                </div>
                                <div className="flex items-center mb-4">
                                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                    <div className="text-sm">Est. Completion: June 2, 2025</div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between mb-1">
                                        <div className="text-sm">
                                            Current Status: <strong className="text-amber-500">In Progress</strong>
                                        </div>
                                        <div className="text-sm">60% complete</div>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: "60%" }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md font-medium">
                                <ClipboardList className="h-4 w-4 mr-2" />
                                View Details
                            </button>
                            <button className="flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-md font-medium">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Track Status
                            </button>
                            <button className="flex items-center px-4 py-2 bg-amber-50 text-amber-600 rounded-md font-medium">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Action Required
                            </button>
                        </div>
                    </div>

                    {/* Updates and Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Updates</h3>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Part ordered</div>
                                        <div className="text-xs text-gray-500">1h ago • #RT-2023-0042</div>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Diagnosis complete</div>
                                        <div className="text-xs text-gray-500">1d ago • #RT-2023-0042</div>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Ticket created</div>
                                        <div className="text-xs text-gray-500">2d ago • #RT-2023-0042</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Actions</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start">
                                        <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mr-3">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Approve Quotation #4432</div>
                                            <div className="text-xs text-gray-500">Expires in 6 days</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Take Action</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start">
                                        <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mr-3">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Schedule pickup #RT-0036</div>
                                            <div className="text-xs text-gray-500">Ready since May 29</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Take Action</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents and Support */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Access</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start">
                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Warranty Claim IO-RMA-000042</div>
                                            <div className="text-xs text-gray-500">May 28, 2025</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded">View</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start">
                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Repair Ticket IO-RT-000012</div>
                                            <div className="text-xs text-gray-500">May 28, 2025</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded">View</button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start">
                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Terms and Conditions</div>
                                            <div className="text-xs text-gray-500">May 28, 2025</div>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded">View</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Support Options</h3>
                            <div className="space-y-3">
                                <button className="flex items-center w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-md">
                                    <MessageSquare className="h-5 w-5 mr-3" />
                                    Live Chat with Support
                                </button>
                                <button className="flex items-center w-full px-4 py-3 bg-green-50 text-green-600 rounded-md">
                                    <Phone className="h-5 w-5 mr-3" />
                                    Call Support Center
                                </button>
                                <button className="flex items-center w-full px-4 py-3 bg-purple-50 text-purple-600 rounded-md">
                                    <Mail className="h-5 w-5 mr-3" />
                                    Email Support Team
                                </button>
                                <button className="flex items-center w-full px-4 py-3 bg-amber-50 text-amber-600 rounded-md">
                                    <HelpIcon className="h-5 w-5 mr-3" />
                                    FAQ / Help Center
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerDashboard