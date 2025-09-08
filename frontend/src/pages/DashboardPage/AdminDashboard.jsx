import Sidebar from "../../components/SideBar/Sidebar.jsx"
import { Link } from 'react-router-dom';
import {
    Bell, Plus,
    User,
} from "lucide-react"
import {useEffect, useState} from "react";
import api, { parseJwt } from '../../config/ApiConfig.jsx';

const AdminDashboard = () => {
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber:'',
        password: '********', // Placeholder for security
        role: '' // Added role field
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // State for dashboard statistics
    const [stats, setStats] = useState({
        users: 0,
        usersAddedThisWeek: 0,
        openTickets: 0,
        pendingApprovals: 0,
        lowStockItems: 0,
        devicesInRepair: 87,
        warrantyRequests: 32,
        satisfactionRate: "0%",
    });

    // Initialize with zeros instead of dummy data
    const [ratingDistribution, setRatingDistribution] = useState({
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0
    });

    // State for total number of ratings
    const [totalRatings, setTotalRatings] = useState(0);

    // State for tracking errors specifically for weekly user stats
    const [statsErrors, setStatsErrors] = useState({
        usersAddedThisWeek: false
    });
    // State for inventory data
    const [inventoryData, setInventoryData] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);

    // State for repair tickets
    const [repairTickets, setRepairTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [ticketsError, setTicketsError] = useState(null);

    // New state for tracking ticket changes
    const [ticketChanges, setTicketChanges] = useState({
        value: 0,
        isIncrease: false,
        lastUpdated: null
    });

    // State for feedback data
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbacksLoading, setFeedbacksLoading] = useState(true);
    const [feedbacksError, setFeedbacksError] = useState(null);

    // State for technician workload
    const [technicianWorkload, setTechnicianWorkload] = useState([]);
    const [techWorkloadLoading, setTechWorkloadLoading] = useState(true);
    const [techWorkloadError, setTechWorkloadError] = useState(null);

    // Modal state for description
    const [modalData, setModalData] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Function to show the description modal
    const showDescriptionModal = (item) => {
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
                    setError("Not authenticated. Please log in.");
                    setLoading(false);
                    return;
                }

                // Try to parse token to get user info
                const decodedToken = parseJwt(token);

                if (decodedToken) {
                    const userData = {
                        firstName: decodedToken.firstName || '',
                        lastName: decodedToken.lastName || '',
                        username: decodedToken.username || '',
                        email: decodedToken.email || '',
                        phoneNumber: decodedToken.phoneNumber || '',
                        password: '********', // For security, never display actual password
                        role: decodedToken.role || ''
                    };

                    setUserData(userData);

                    // Cache the data in sessionStorage
                    sessionStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    setError("Invalid token format");
                    setLoading(false);
                    return;
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

    // Add useEffect to fetch user count from the backend
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await api.get('/user/getUserCount');
                setStats(prevStats => ({
                    ...prevStats,
                    users: response.data
                }));
            } catch (err) {
                console.error("Error fetching user count:", err);
            }
        };
        fetchUserCount();
    }, []);

    // Add useEffect to fetch users added this week with improved error handling
    useEffect(() => {
        const fetchUsersAddedThisWeek = async () => {
            try {
                const response = await api.get('/user/getWeeklyUsers');
                const data = response.data;
                const count = Array.isArray(data) ? data.length : data;
                setStats(prevStats => ({
                    ...prevStats,
                    usersAddedThisWeek: count
                }));
                setStatsErrors(prev => ({...prev, usersAddedThisWeek: false}));
            } catch (err) {
                console.error("Error fetching users added this week:", err);
                setStatsErrors(prev => ({...prev, usersAddedThisWeek: true}));
                setStats(prevStats => ({
                    ...prevStats,
                    usersAddedThisWeek: 0
                }));
            }
        };
        fetchUsersAddedThisWeek();
        const intervalId = setInterval(fetchUsersAddedThisWeek, 60000);
        return () => clearInterval(intervalId);
    }, []);

    // Fetch active repair tickets from backend with change tracking and persistence
    useEffect(() => {
        const savedTicketChanges = localStorage.getItem('ticketChanges');
        if (savedTicketChanges) {
            setTicketChanges(JSON.parse(savedTicketChanges));
        }
        const fetchActiveRepairTickets = async () => {
            try {
                const response = await api.get('/repairTicket/getActiveRepairTickets');
                const data = response.data;
                const newCount = data.totalElements || 0;
                const prevCountData = localStorage.getItem('previousTicketCount');
                let prevCount = 0;
                let shouldUpdateChanges = false;
                if (prevCountData) {
                    prevCount = JSON.parse(prevCountData).count;
                    const change = newCount - prevCount;
                    if (change !== 0) {
                        const currentChange = ticketChanges.value;
                        if (change !== currentChange) {
                            setTicketChanges({
                                value: change,
                                isIncrease: change > 0,
                                lastUpdated: new Date().toISOString()
                            });
                            const newTicketChanges = {
                                value: change,
                                isIncrease: change > 0,
                                lastUpdated: new Date().toISOString()
                            };
                            localStorage.setItem('ticketChanges', JSON.stringify(newTicketChanges));
                            shouldUpdateChanges = true;
                        }
                    }
                }
                if (shouldUpdateChanges || !prevCountData) {
                    localStorage.setItem('previousTicketCount', JSON.stringify({
                        count: newCount,
                        timestamp: new Date().toISOString()
                    }));
                }
                setStats(prevStats => ({
                    ...prevStats,
                    openTickets: newCount
                }));
            } catch (err) {
                console.error("Error fetching active repair tickets:", err);
                setStats(prevStats => ({
                    ...prevStats,
                    openTickets: prevStats.openTickets || 0
                }));
            }
        };
        fetchActiveRepairTickets();
        const intervalId = setInterval(fetchActiveRepairTickets, 120000);
        return () => clearInterval(intervalId);
    }, []);

    // Fetch repair tickets from backend
    useEffect(() => {
        const fetchRepairTickets = async () => {
            try {
                setTicketsLoading(true);
                const response = await api.get('/repairTicket/getAllRepairTickets');
                setRepairTickets(response.data);
                setTicketsError(null);
            } catch (err) {
                console.error("Error fetching repair tickets:", err);
                setTicketsError("Failed to load ticket data");
            } finally {
                setTicketsLoading(false);
            }
        };
        fetchRepairTickets();
    }, []);

    // Add useEffect to fetch inventory data from the backend
    useEffect(() => {
        const fetchInventoryData = async () => {
            try {
                setInventoryLoading(true);
                const response = await api.get('/part/getAllParts');
                const data = response.data;
                setInventoryData(data);
                const lowStockCount = data.filter(item => item.currentStock <= 5).length;
                setStats(prevStats => ({
                    ...prevStats,
                    lowStockItems: lowStockCount
                }));
                setInventoryError(null);
            } catch (err) {
                console.error("Error fetching inventory data:", err);
                setInventoryError("Failed to load inventory data");
            } finally {
                setInventoryLoading(false);
            }
        };
        fetchInventoryData();
    }, []);

    // Add useEffect to fetch feedback data from the backend with auto-refresh
    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                setFeedbacksLoading(true);
                const response = await api.get('/feedback/getAllFeedback');
                const data = response.data;
                const sortedData = [...data].sort((a, b) => {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });
                setFeedbacks(sortedData);
                setFeedbacksError(null);
            } catch (err) {
                console.error("Error fetching feedback:", err);
                setFeedbacksError("Failed to load feedback data");
            } finally {
                setFeedbacksLoading(false);
            }
        };
        fetchFeedbacks();
        const intervalId = setInterval(fetchFeedbacks, 60000);
        return () => clearInterval(intervalId);
    }, []);

    // Add useEffect to fetch technician workload data
    useEffect(() => {
        const fetchTechnicianWorkload = async () => {
            try {
                setTechWorkloadLoading(true);
                const response = await api.get('/user/getTopTechniciansByWorkload');
                setTechnicianWorkload(response.data);
                setTechWorkloadError(null);
            } catch (err) {
                console.error("Error fetching technician workload:", err);
                setTechWorkloadError("Failed to load technician data");
            } finally {
                setTechWorkloadLoading(false);
            }
        };
        fetchTechnicianWorkload();
        const intervalId = setInterval(fetchTechnicianWorkload, 300000);
        return () => clearInterval(intervalId);
    }, []);

    // Updated useEffect to fetch satisfaction ratings from the backend
    useEffect(() => {
        const fetchSatisfactionRate = async () => {
            try {
                const response = await api.get('/feedback/getAllRatings');
                const data = response.data;
                if (data && Object.keys(data).length > 0) {
                    const totalCount = Object.values(data).reduce((sum, count) => sum + count, 0);
                    setTotalRatings(totalCount);
                    const maxCount = Math.max(...Object.values(data));
                    const distribution = {};
                    let weightedSum = 0;
                    for (let i = 1; i <= 5; i++) {
                        const count = data[i] || 0;
                        distribution[i] = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                        weightedSum += i * count;
                    }
                    const averageRating = totalCount > 0 ? weightedSum / totalCount : 0;
                    const satisfactionPercentage = Math.round(averageRating * 20);
                    setRatingDistribution(distribution);
                    setStats(prevStats => ({
                        ...prevStats,
                        satisfactionRate: satisfactionPercentage + "%"
                    }));
                } else {
                    setRatingDistribution({
                        '5': 0,
                        '4': 0,
                        '3': 0,
                        '2': 0,
                        '1': 0
                    });
                    setTotalRatings(0);
                }
            } catch (err) {
                console.error("Error fetching satisfaction ratings:", err);
                setRatingDistribution({
                    '5': 0,
                    '4': 0,
                    '3': 0,
                    '2': 0,
                    '1': 0
                });
                setTotalRatings(0);
                setStats(prevStats => ({
                    ...prevStats,
                    satisfactionRate: "0%"
                }));
            }
        };
        fetchSatisfactionRate();
        const intervalId = setInterval(fetchSatisfactionRate, 300000);
        return () => clearInterval(intervalId);
    }, []);

    // Fetch pending approvals
    useEffect(() => {
        const fetchPendingApprovals = async () => {
            try {
                const response = await api.get('/approval/getPendingApprovalsCount');
                setStats(prevStats => ({
                    ...prevStats,
                    pendingApprovals: response.data
                }));
            } catch (err) {
                console.error("Error fetching pending approvals:", err);
                setStats(prevStats => ({
                    ...prevStats,
                    pendingApprovals: 3 // fallback value
                }));
            }
        };
        fetchPendingApprovals();
    }, []);

    // Chart data
    const chartData = {
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        values: [5, 8, 12, 9, 11, 14],
    }

    // Calendar data
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleString("default", { month: "long" })
    const currentYear = currentDate.getFullYear()
    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay()

    // Generate calendar days
    const calendarDays = []
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null) // Empty cells for days before the 1st of the month
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i)
    }

    // Get current inventory items for pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = inventoryData.slice(indexOfFirstItem, indexOfLastItem);

    // Calculate total pages
    const totalPages = Math.ceil(inventoryData.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Previous page
    const goToPreviousPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    // Next page
    const goToNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    }

    return (
        <div className="flex min-h-screen">
            {/* Custom Sidebar Component */}
            <Sidebar  activePage={'dashboard'}/>


            {/*to seperate the sidebar and the main content*/}
            <div className="w-60  bg-gray-50 shadow-md">
            </div>


            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50">
                {/* Header with Search and User Menu */}
                <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Hello, {userData.firstName}</h2>
                    </div>
                    <div className="flex-1 max-w-md mx-8">

                    </div>
                    <div className="flex items-center space-x-5">
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

                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

                        <Link to="/newrepair">
                            <button className="flex items-center bg-[#25D482] text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
                                <Plus className="w-5 h-5 mr-1" />
                                Add Ticket
                            </button>
                        </Link>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Total Users</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.users}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {statsErrors.usersAddedThisWeek ? (
                                    "Unable to track new users"
                                ) : (
                                    <>
                                        <span className="text-green-500 font-medium">+{stats.usersAddedThisWeek}</span> this week
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Open Tickets</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.openTickets}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {ticketChanges.value > 0 ? (
                                    <>
                                        {ticketChanges.isIncrease ? (
                                            <span className="text-green-500 font-medium">+{ticketChanges.value}</span>
                                        ) : (
                                            <span className="text-green-500 font-medium">{ticketChanges.value}</span>
                                        )}
                                        <span> since last check</span>
                                    </>
                                ) : (
                                    "No recent changes"
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Pending Approvals</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</div>
                            <div className="text-xs text-gray-500 mt-1">Requires attention</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Low Stock Items</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.lowStockItems}</div>
                            <div className="text-xs text-gray-500 mt-1">Needs reordering</div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Pie Chart Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Repair Status Distribution</h3>
                            <div className="flex flex-col items-center">
                                <div className="relative w-44 h-44 mb-5">
                                    <div
                                        className="w-full h-full rounded-full"
                                        style={{
                                            background: `conic-gradient(
                        #2196f3 0% 25%,
                        #ffb300 25% 65%,
                        #9c27b0 65% 80%,
                        #4caf50 80% 90%,
                        #f44336 90% 100%
                      )`,
                                        }}
                                    >
                                        <div className="absolute w-24 h-24 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                                        <span className="text-sm">New (25%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-amber-400 rounded-sm mr-2"></div>
                                        <span className="text-sm">In Progress (40%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-purple-600 rounded-sm mr-2"></div>
                                        <span className="text-sm">Awaiting Parts (15%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                                        <span className="text-sm">Ready (10%)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
                                        <span className="text-sm">Delayed (10%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart Card - Now using dynamic data */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Technician Workload</h3>
                            {techWorkloadLoading ? (
                                <div className="h-48 flex items-center justify-center">
                                    <p>Loading technician data...</p>
                                </div>
                            ) : techWorkloadError ? (
                                <div className="h-48 flex items-center justify-center text-red-500">
                                    <p>{techWorkloadError}</p>
                                </div>
                            ) : technicianWorkload.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-gray-500">
                                    <p>No technician workload data available</p>
                                </div>
                            ) : (
                                <div className="h-48 flex items-end justify-around pt-5">
                                    {technicianWorkload.slice(0, 5).map((tech, index) => {
                                        // Find the maximum workload to calculate relative height
                                        const maxWorkload = Math.max(...technicianWorkload.map(t => t.ticketCount));
                                        // Calculate height percentage (minimum 10% for visibility)
                                        const heightPercentage = Math.max(10, (tech.ticketCount / maxWorkload) * 100);

                                        return (
                                            <div key={index} className="flex flex-col items-center">
                                                <div
                                                    className="w-12 bg-blue-500 rounded-t-sm"
                                                    style={{ height: `${heightPercentage}%` }}
                                                ></div>
                                                <div className="mt-2 text-xs">{tech.firstName || "Tech"}</div>
                                                <div className="text-xs text-gray-500">{tech.ticketCount}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Satisfaction */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Satisfaction Ratings */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Customer Satisfaction Ratings
                            </h3>
                            <div className="space-y-4">
                                {[5, 4, 3, 2, 1].map(star => (
                                    <div key={star} className="flex items-center">
                                        <div className="w-20 text-sm">{star} Star{star !== 1 ? 's' : ''}</div>
                                        <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mx-3">
                                            <div
                                                className={`h-full ${
                                                    star >= 4 ? 'bg-green-500' :
                                                        star === 3 ? 'bg-yellow-400' :
                                                            'bg-red-500'
                                                }`}
                                                style={{ width: `${ratingDistribution[star]}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-10 text-sm font-bold text-right">{ratingDistribution[star]}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Feedbacks */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Customer Feedback</h3>
                            <div className="space-y-4">
                                {feedbacksLoading ? (
                                    <div className="text-center py-4">Loading feedback...</div>
                                ) : feedbacksError ? (
                                    <div className="text-center text-red-500 py-4">{feedbacksError}</div>
                                ) : feedbacks.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">No feedback available</div>
                                ) : (
                                    feedbacks.map((feedback, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                            <div className={`flex ${feedback.anonymous ? "justify-end" : "justify-between"} items-center mb-2`}>
                                                {!feedback.anonymous && (
                                                    <div className="font-medium">
                                                        {feedback.repairTicketNumber || "Repair Ticket"}
                                                    </div>
                                                )}
                                                <div className="text-yellow-500">
                                                    {Array(feedback.overallSatisfactionRating || 5).fill('★').join('')}
                                                    {Array(5 - (feedback.overallSatisfactionRating || 5)).fill('☆').join('')}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                "{feedback.comments || "No comments provided"}"
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {feedback.anonymous ? "Anonymous" : feedback.customerName || userData.firstName || "Customer"}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard

