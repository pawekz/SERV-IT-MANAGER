import Sidebar from "../../components/SideBar/Sidebar.jsx"

import { Link } from 'react-router-dom';

import {
    Bell,
    User,
} from "lucide-react"
import {useEffect, useState} from "react";

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
        satisfactionRate: "94%",
    });
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

    // Modal state for description
    const [modalData, setModalData] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

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
                    throw new Error("Not authenticated. Please log in.");
                }

                // Try to parse token to get user info
                const decodedToken = parseJwt(token);

                if (decodedToken) {
                    const userData = {
                        firstName: decodedToken.firstName || 'User',
                        lastName: decodedToken.lastName || '',
                        username: decodedToken.sub || 'username',
                        email: decodedToken.email || 'email@example.com',
                        phoneNumber: decodedToken.phoneNumber || '',
                        password: '********', // Placeholder for security
                        role: decodedToken.role || 'ROLE_USER'
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

    // Add useEffect to fetch user count from the backend
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                const response = await fetch('http://localhost:8080/user/getUserCount', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error fetching user count: ${response.status}`);
                }

                const count = await response.json();
                setStats(prevStats => ({
                    ...prevStats,
                    users: count
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
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                // Use the getWeeklyUsers endpoint
                const response = await fetch('http://localhost:8080/user/getWeeklyUsers', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch weekly users: ${response.statusText}`);
                }

                const data = await response.json();
                // Handle the case where response is an array of objects
                const count = Array.isArray(data) ? data.length : data;

                setStats(prevStats => ({
                    ...prevStats,
                    usersAddedThisWeek: count
                }));

                // Reset error state
                setStatsErrors(prev => ({...prev, usersAddedThisWeek: false}));
            } catch (err) {
                console.error("Error fetching users added this week:", err);
                setStatsErrors(prev => ({...prev, usersAddedThisWeek: true}));

                // Set fallback value
                setStats(prevStats => ({
                    ...prevStats,
                    usersAddedThisWeek: 0
                }));
            }
        };

        fetchUsersAddedThisWeek();

        // Set up polling to refresh the count periodically
        const intervalId = setInterval(fetchUsersAddedThisWeek, 60000); // Refresh every minute

        return () => clearInterval(intervalId);
    }, []);

    // Fetch active repair tickets from backend with change tracking and persistence
    useEffect(() => {
        // First, load any saved ticket changes from localStorage
        const savedTicketChanges = localStorage.getItem('ticketChanges');
        if (savedTicketChanges) {
            setTicketChanges(JSON.parse(savedTicketChanges));
        }

        const fetchActiveRepairTickets = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                const response = await fetch('http://localhost:8080/repairTicket/getActiveRepairTickets', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error fetching active repair tickets: ${response.status}`);
                }

                const data = await response.json();
                const newCount = data.totalElements || 0;

                // Get previous count from localStorage
                const prevCountData = localStorage.getItem('previousTicketCount');
                let prevCount = 0;
                let shouldUpdateChanges = false;

                if (prevCountData) {
                    prevCount = JSON.parse(prevCountData).count;

                    // Calculate change
                    const change = newCount - prevCount;

                    // Only update if there's a NEW change - different from what we're already showing
                    if (change !== 0) {
                        // Check if this is different from what we're currently showing
                        const currentChange = ticketChanges.value * (ticketChanges.isIncrease ? 1 : -1);
                        if (change !== currentChange) {
                            shouldUpdateChanges = true;
                            const newTicketChanges = {
                                value: Math.abs(change),
                                isIncrease: change > 0,
                                lastUpdated: new Date().toISOString()
                            };

                            setTicketChanges(newTicketChanges);

                            // Save ticket changes to localStorage
                            localStorage.setItem('ticketChanges', JSON.stringify(newTicketChanges));
                        }
                    }
                }

                // Only update the count in localStorage if we found a new change
                // or if this is the first time we're checking
                if (shouldUpdateChanges || !prevCountData) {
                    localStorage.setItem('previousTicketCount', JSON.stringify({
                        count: newCount,
                        timestamp: new Date().toISOString()
                    }));
                }

                // Always update the current open tickets count
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

        // Set up polling to refresh active tickets count every 2 minutes
        const intervalId = setInterval(fetchActiveRepairTickets, 120000);

        return () => clearInterval(intervalId);
    }, []);

    // Fetch repair tickets from backend
    useEffect(() => {
        const fetchRepairTickets = async () => {
            try {
                setTicketsLoading(true);
                const token = localStorage.getItem('authToken');

                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                const response = await fetch('http://localhost:8080/repairTicket/getAllRepairTickets', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error fetching repair tickets: ${response.status}`);
                }

                const data = await response.json();
                setRepairTickets(data);

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
                const token = localStorage.getItem('authToken');

                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                const response = await fetch('http://localhost:8080/part/getAllParts', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error fetching inventory: ${response.status}`);
                }

                const data = await response.json();
                setInventoryData(data);

                // Count low stock items (assuming items with quantity <= 5 are considered low stock)
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

    // Fetch pending approvals
    useEffect(() => {
        const fetchPendingApprovals = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                // Assuming there's an endpoint for pending approvals
                const response = await fetch('http://localhost:8080/repairTicket/getPendingApprovals', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    // If endpoint doesn't exist or returns error, use default value
                    setStats(prevStats => ({
                        ...prevStats,
                        pendingApprovals: 3
                    }));
                    return;
                }

                const count = await response.json();
                setStats(prevStats => ({
                    ...prevStats,
                    pendingApprovals: count
                }));
            } catch (err) {
                console.error("Error fetching pending approvals:", err);
                // Fallback to default value if error occurs
                setStats(prevStats => ({
                    ...prevStats,
                    pendingApprovals: 3
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
            <Sidebar />

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
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Total Users</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.users}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {statsErrors.usersAddedThisWeek ? (
                                    "Unable to track new users"
                                ) : (
                                    `+${stats.usersAddedThisWeek} this week`
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Open Tickets</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.openTickets}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {ticketChanges.value > 0 ? (
                                    ticketChanges.isIncrease ?
                                        `+${ticketChanges.value} ticket${ticketChanges.value !== 1 ? 's' : ''} since last check` :
                                        `-${ticketChanges.value} ticket${ticketChanges.value !== 1 ? 's' : ''} since last check`
                                ) : (
                                    "No change in ticket count"
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
                                        className="w-full h-full rounded-full relative"
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

                        {/* Bar Chart Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Technician Workload</h3>
                            <div className="h-48 flex items-end justify-around pt-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-blue-900 rounded-t relative" style={{ height: "40%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">8</div>
                                    </div>
                                    <div className="text-xs mt-2">John</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-blue-900 rounded-t relative" style={{ height: "60%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">12</div>
                                    </div>
                                    <div className="text-xs mt-2">Sarah</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-blue-900 rounded-t relative" style={{ height: "25%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">5</div>
                                    </div>
                                    <div className="text-xs mt-2">Mike</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-blue-900 rounded-t relative" style={{ height: "45%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">9</div>
                                    </div>
                                    <div className="text-xs mt-2">Lisa</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-blue-900 rounded-t relative" style={{ height: "35%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">7</div>
                                    </div>
                                    <div className="text-xs mt-2">David</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Satisfaction */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Satisfaction Ratings */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Satisfaction Ratings</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="w-20 text-sm">5 Stars</div>
                                    <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                                    </div>
                                    <div className="w-10 text-sm font-bold text-right">65%</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-20 text-sm">4 Stars</div>
                                    <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-green-400 rounded-full" style={{ width: "20%" }}></div>
                                    </div>
                                    <div className="w-10 text-sm font-bold text-right">20%</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-20 text-sm">3 Stars</div>
                                    <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: "10%" }}></div>
                                    </div>
                                    <div className="w-10 text-sm font-bold text-right">10%</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-20 text-sm">2 Stars</div>
                                    <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: "3%" }}></div>
                                    </div>
                                    <div className="w-10 text-sm font-bold text-right">3%</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-20 text-sm">1 Star</div>
                                    <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden mx-3">
                                        <div className="h-full bg-red-500 rounded-full" style={{ width: "2%" }}></div>
                                    </div>
                                    <div className="w-10 text-sm font-bold text-right">2%</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Feedback */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Customer Feedback</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium">iPhone 13 Screen Repair</div>
                                        <div className="text-yellow-500">★★★★★</div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        "Excellent service! My phone was fixed in less than 2 hours and works perfectly now."
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium">MacBook Battery Replacement</div>
                                        <div className="text-yellow-500">★★★★☆</div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        "Good service, but took a day longer than estimated. Battery life is great now."
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-medium">iPad Screen Repair</div>
                                        <div className="text-yellow-500">★★★★★</div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        "Very professional technician. Fixed my cracked screen and it looks brand new!"
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
//
export default AdminDashboard