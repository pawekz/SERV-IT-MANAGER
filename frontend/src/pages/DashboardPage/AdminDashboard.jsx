import Sidebar from "../../components/SideBar/Sidebar.jsx"
import { Link, useNavigate } from 'react-router-dom';
import {
    Bell, Plus,
    Users, ClockAlert, TrendingDown
} from "lucide-react"
import {useEffect, useState, useMemo} from "react";
import api, { parseJwt } from '../../config/ApiConfig.jsx';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';


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
    // Note: removed unused loading/error state to reduce warnings
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

    // State for tracking errors specifically for weekly user stats
    const [statsErrors, setStatsErrors] = useState({
        usersAddedThisWeek: false
    });
    // State for feedback data
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbacksLoading, setFeedbacksLoading] = useState(true);
    const [feedbacksError, setFeedbacksError] = useState(null);

    // State for technician workload
    const [technicianWorkload, setTechnicianWorkload] = useState([]);
    const [techWorkloadLoading, setTechWorkloadLoading] = useState(true);
    const [techWorkloadError, setTechWorkloadError] = useState(null);

    // State for ticket change tracking (was referenced in JSX; reintroduced)
    const [ticketChanges, setTicketChanges] = useState({
        value: 0,
        isIncrease: false,
        lastUpdated: null
    });

    // totalRatings isn't used in the UI, but the code sets it in fetchSatisfactionRate.
    // Keep the setter only to avoid unused variable warnings.
    const [, setTotalRatings] = useState(0);


    // Get initials from user data
    const getInitials = () => {
        if (userData.firstName && userData.lastName) return userData.firstName[0].toUpperCase() + userData.lastName[0].toUpperCase();
        if (userData.firstName) return userData.firstName[0].toUpperCase();
        return 'U';
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Check if we have cached user data in sessionStorage first
                const cachedUserData = sessionStorage.getItem('userData');
                if (cachedUserData) {
                    const parsedData = JSON.parse(cachedUserData);
                    setUserData(parsedData);
                    return;
                }

                // Get token from localStorage if no cached data
                const token = localStorage.getItem('authToken');

                if (!token) {
                    console.warn("Not authenticated. Please log in.");
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
                    console.warn("Invalid token format");
                }
                // finished fetching user data
            } catch (err) {
                console.error("Error fetching user data:", err);
                // swallow - UI shows best-effort data from session
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

    // Fetch inventory data from the backend
    useEffect(() => {
         const fetchInventoryData = async () => {
             try {
                 const response = await api.get('/part/getAllParts');
                 const data = response.data;
                 // Normalize response to an array. Some endpoints return an array, others wrap it in { content: [...] } or { data: [...] }
                 let partsArray;
                 if (Array.isArray(data)) {
                     partsArray = data;
                 } else if (data && Array.isArray(data.content)) {
                     partsArray = data.content;
                 } else if (data && Array.isArray(data.data)) {
                     partsArray = data.data;
                 } else if (data && Array.isArray(data.parts)) {
                     partsArray = data.parts;
                 } else if (data && typeof data === 'object') {
                     const firstArray = Object.values(data).find(v => Array.isArray(v));
                     if (firstArray) {
                         partsArray = firstArray;
                         console.debug("fetchInventoryData: resolved partsArray from first array in object; sample:", partsArray.slice(0,3));
                     } else {
                         partsArray = [];
                         console.debug("fetchInventoryData: no array found in response object for /part/getAllParts", data);
                     }
                 } else {
                     partsArray = [];
                     console.debug("fetchInventoryData: unexpected response shape for /part/getAllParts", data);
                 }
                 const lowStockCount = partsArray.filter(item => (item && typeof item.currentStock === 'number' ? item.currentStock : 0) <= 5).length;
                 setStats(prevStats => ({
                     ...prevStats,
                     lowStockItems: lowStockCount
                 }));
             } catch (err) {
                 console.error("Error fetching inventory data:", err);
             } finally {
                 // finished
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

    // State for pending approvals
    useEffect(() => {
        const fetchPendingApprovals = async () => {
             try {
                 const token = localStorage.getItem('authToken');
                 const response = await fetch(`${window.__API_BASE__}/warranty/getPendingApprovals`, {
                     method: 'GET',
                     headers: {
                         'Content-Type': 'application/json',
                         ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                     },
                 });
                 if (!response.ok) {
                    console.error('Failed to fetch pending approvals, status:', response.status);
                    setStats(prev => ({ ...prev, pendingApprovals: 0 }));
                    return;
                }
                 const data = await response.json();
                 setStats(prev => ({ ...prev, pendingApprovals: data.pendingApprovals }));
             } catch (err) {
                console.error('Error fetching pending approvals', err);
                 setStats(prev => ({ ...prev, pendingApprovals: 0 }));
             } finally {
                 // done
             }
         };
         fetchPendingApprovals();
     }, []);

    // State for repair ticket status distribution
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusError, setStatusError] = useState(null);

    useEffect(() => {
        const fetchStatusDistribution = async () => {
            setStatusLoading(true);
            try {
                const response = await api.get('/repairTicket/getStatusDistribution');
                if (response.data && response.data.statusCounts) {
                    setStatusDistribution(response.data.statusCounts);
                } else {
                    setStatusDistribution([]);
                }
                setStatusError(null);
            } catch (err) {
                setStatusError('Failed to load status distribution');
                setStatusDistribution([]);
            } finally {
                setStatusLoading(false);
            }
        };
        fetchStatusDistribution();
    }, []);

    // Pie chart colors for statuses
    const STATUS_COLORS = {
        RECEIVED: '#8884d8',
        DIAGNOSING: '#82ca9d',
        AWAITING_PARTS: '#ffc658',
        REPAIRING: '#ff8042',
        READY_FOR_PICKUP: '#0088fe',
        COMPLETED: '#00c49f',
    };

    // Helper function to format status labels (replace underscores with spaces)
    const formatStatusLabel = (status) => {
        if (!status) return '';
        return status.replace(/_/g, ' ');
    };

    // Chart/calendar helper data (removed unused chart/calendar constants)


    const navigate = useNavigate();

    // Prepare chart data for technicians: sort by ticket count desc, take top 5, shorten names
    const techChartData = (Array.isArray(technicianWorkload) ? technicianWorkload.slice() : [])
        .sort((a, b) => (b.ticketCount || 0) - (a.ticketCount || 0))
        .slice(0, 5)
        .map(t => {
            const rawName = (t.firstName || t.username || 'Tech');
            const name = rawName.length > 10 ? `${rawName.slice(0, 10)}...` : rawName;
            return { name, tickets: t.ticketCount || 0 };
        });

    // Derive pie data from statusDistribution: add percentage and only include slices >= 0.1%
    const pieData = useMemo(() => {
        if (!Array.isArray(statusDistribution) || statusDistribution.length === 0) return [];
        const total = statusDistribution.reduce((s, e) => s + (e.count || 0), 0);
        if (total === 0) return [];
        return statusDistribution
            .map(e => ({ ...e, percentage: total > 0 ? ((e.count || 0) / total) * 100 : 0 }))
            .filter(e => (e.percentage || 0) >= 0.1);
    }, [statusDistribution]);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const resp = await api.get('/user/getCurrentUser');
                const merged = { ...userData, ...resp.data, password: '********' };
                setUserData(prev => ({ ...prev, ...merged }));
                sessionStorage.setItem('userData', JSON.stringify(merged));
            } catch (e) {
                console.error('Error fetching user data:', e);
            }
        };
        fetchCurrentUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const { data: profileUrl } = useProfilePhoto(userData.userId, userData.profilePictureUrl);

    return (
        <>



        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Custom Sidebar Component */}
            <div className=" w-full md:w-[250px] h-auto md:h-screen ">
                <Sidebar activePage={'dashboard'} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50 ">
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
                        <Link to="/accountinformation" className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 bg-gray-100 overflow-hidden">
                            {profileUrl ? (
                                <img src={profileUrl} alt="Profile" loading="lazy" onError={() => setProfileUrl(null)} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-semibold text-gray-600">{getInitials()}</span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">

                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>

                        <Link to="/newrepair">
                            <button className="flex items-center bg-[#2563eb] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-opacity-90 min-w-[44px] min-h-[44px] whitespace-nowrap">
                                <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="text-sm sm:text-base">Add Ticket</span>
                            </button>
                        </Link>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="flex bg-white p-6 rounded-lg shadow-sm">
                            <div className="mr-4 pt-2 text-[#2563eb]">
                                <Users size={72} />
                            </div>
                            <div>
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
                        </div>
                        <div className="flex bg-white p-6 rounded-lg shadow-sm">
                            <div className="mr-4 pt-2 text-[#2563eb]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24"
                                 fill="none" stroke="#e4a144" strokeWidth={2} strokeLinecap="round"
                                 strokeLinejoin="round"
                                 className="lucide lucide-clipboard-clock-icon lucide-clipboard-clock">
                                <path d="M16 14v2.2l1.6 1"/>
                                <path d="M16 4h2a2 2 0 0 1 2 2v.832"/>
                                <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2"/>
                                <circle cx="16" cy="16" r="6"/>
                                <rect x="8" y="2" width="8" height="4" rx="1"/>
                            </svg>
                            </div>
                            <div>
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
                        </div>
                        <div
                            className="flex bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-blue-100 transition-transform duration-200"
                            onClick={() => navigate('/warrantyrequest')}
                            title="Go to Pending Approvals">
                            <div className="mr-4 pt-2 ">
                                <ClockAlert size={72} color="#e4a144" />
                            </div>
                            <div>
                        <div className="text-gray-600 text-sm mb-2">Pending Approvals</div>
                        <div className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</div>
                        <div className="text-xs text-gray-500 mt-1">Requires attention</div>
                            </div>
                    </div>
                    <div className="flex bg-white p-6 rounded-lg shadow-sm">
                        <div className="mr-4 pt-2 text-[#2563eb]">
                        <TrendingDown size={72} color="#DC143C" />
                        </div>
                        <div>
                        <div className="text-gray-600 text-sm mb-2">Low Stock Items</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.lowStockItems}</div>
                            <div className="text-xs text-gray-500 mt-1">Needs reordering</div>
                        </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Pie Chart Card - Now with dynamic data */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Repair Status Distribution</h3>
                            <div className="flex flex-col items-center">
                                {statusLoading ? (
                                    <div className="h-48 flex items-center justify-center">
                                        <p>Loading status distribution...</p>
                                    </div>
                                ) : statusError ? (
                                    <div className="h-48 flex items-center justify-center text-red-500">
                                        <p>{statusError}</p>
                                    </div>
                                ) : statusDistribution.length === 0 ? (
                                    <div className="h-48 flex items-center justify-center text-gray-500">
                                        <p>No status distribution data available</p>
                                    </div>
                                ) : pieData.length === 0 ? (
                                    <div className="h-48 flex items-center justify-center text-gray-500">
                                        <p>No status distribution data available</p>
                                    </div>
                                ) : (
                                     <ResponsiveContainer width="100%" height={400}>
                                         <PieChart>
                                             <Pie
                                                 data={pieData}
                                                 dataKey="count"
                                                 nameKey="status"
                                                 cx="50%"
                                                 cy="50%"
                                                 outerRadius={100}
                                                 label={({ payload }) => `${formatStatusLabel(payload.status)}: ${payload.percentage.toFixed(1)}%`}
                                             >
                                                 {pieData.map((entry, index) => (
                                                     <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#ccc'} />
                                                 ))}
                                             </Pie>
                                             <Tooltip
                                                 formatter={(value, name) => [`${value} tickets`, formatStatusLabel(name)]}
                                                 contentStyle={{ fontSize: '12px', padding: '4px 8px' }}
                                                 wrapperStyle={{ zIndex: 1000 }}
                                             />
                                            <Legend formatter={(value) => formatStatusLabel(value)} />
                                         </PieChart>
                                     </ResponsiveContainer>
                                )}
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
                                // Use Recharts BarChart for a proper chart
                                <div style={{ width: '100%', height: 400 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={techChartData}
                                            margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip formatter={(value) => [`${value}`, 'Tickets']} />
                                            <Bar dataKey="tickets" fill="#2563EB" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
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
                                    feedbacks.map((feedback, index) => {
                                        const rawTicket = feedback.repairTicketNumber || feedback.ticketNumber || feedback.ticketId || feedback.repairTicketId || (feedback.repairTicket && (feedback.repairTicket.ticketNumber || feedback.repairTicket.id));

                                        let ticketLabel;
                                        if (rawTicket) {
                                            const asString = String(rawTicket);
                                            if (/^IORT-\d{1,}$/.test(asString.toUpperCase())) {
                                                ticketLabel = asString.toUpperCase();
                                            } else if (/^\d+$/.test(asString)) {
                                                ticketLabel = `Ticket #: IORT-${asString.padStart(6, '0')}`;
                                            } else {
                                                ticketLabel = asString;
                                            }
                                        } else {
                                            ticketLabel = 'Ticket #N/A';
                                        }

                                        return (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                                {!feedback.anonymous ? (
                                                    <>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-medium text-sm text-gray-700">{ticketLabel}</div>
                                                            <div className="text-yellow-500">
                                                                {Array(feedback.overallSatisfactionRating || 5).fill('★').join('')}
                                                                {Array(5 - (feedback.overallSatisfactionRating || 5)).fill('☆').join('')}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            "{feedback.comments || "No comments provided"}"
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {feedback.customerName || userData.firstName || "Customer"}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="text-sm text-gray-600">
                                                                "{feedback.comments || "No comments provided"}"
                                                            </div>
                                                            <div className="text-yellow-500">
                                                                {Array(feedback.overallSatisfactionRating || 5).fill('★').join('')}
                                                                {Array(5 - (feedback.overallSatisfactionRating || 5)).fill('☆').join('')}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Anonymous
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default AdminDashboard
