import Sidebar from "../../components/SideBar/Sidebar.jsx"
import KanbanBoard from "./TechnicianKanban/KanbanBoard.jsx"
import {User, Search, CheckCircle, X, Clock, Plus, AlertTriangle} from "lucide-react"
import NotificationBell from "../../components/Notifications/NotificationBell.jsx";
import { useEffect, useState } from "react"
import {Link, useNavigate} from "react-router-dom";
import api from '../../config/ApiConfig';

const TechnicianDashboard = () => {
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
        devicesInRepair: 87,
        warrantyRequests: 32,
        satisfactionRate: "94%",
    });
    // State for inventory data
    const [inventoryData, setInventoryData] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [inventoryError, setInventoryError] = useState(null);

    // Modal state for description
    const [modalData, setModalData] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Recent quotation responses
    const [recentQuotations, setRecentQuotations] = useState([]);

    // New state for low stock
    const [lowStock, setLowStock] = useState([]);

    const navigate = useNavigate();

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

    // Add useEffect to fetch user count from the backend
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error("No auth token found");
                    return;
                }

                const response = await fetch(`${window.__API_BASE__}/user/getUserCount`, {
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

                const response = await fetch(`${window.__API_BASE__}/part/getAllParts`, {
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

    // fetch latest quotations (paginated)
    useEffect(() => {
        const fetchQuotations = async () => {
            try {
                const { data } = await api.get("/quotation/getAllQuotationPaginated", { params: { page: 0, size: 5, sort: "respondedAt,desc" } });
                setRecentQuotations(data.content || []);
            } catch (err) {
                console.error("Failed to fetch quotations", err);
            }
        };
        fetchQuotations();
    }, []);

    // Fetch low stock summaries
    useEffect(() => {
        const fetchLowStock = async () => {
            try {
                const { data } = await api.get("/part/stock/lowStockPartNumbers");
                setLowStock(data || []);
            } catch (err) {
                console.error("Failed to fetch low stock parts", err);
            }
        };
        fetchLowStock();
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
    };

    return (
        <div className="flex min-h-screen">
            {/* Custom Sidebar Component */}

            <div className="w-60 bg-gray-50 shadow-md">
                <Sidebar  activePage={'dashboard'}/>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 bg-gray-50 overflow-x-auto">
                {/* Header with Search and User Menu */}
                <div className="bg-white px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 gap-4">
                    <div className="flex-shrink-0">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Hello, {userData.firstName}</h2>
                    </div>
                    <div className="flex-1 max-w-md mx-0 md:mx-8 w-full md:w-auto">
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <NotificationBell />
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <User className="h-5 w-5 text-gray-600" />
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-4 md:p-8 max-w-full">
                    {/*<h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">My Tasks Today</h1>*/}


                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">My Tasks Today</h1>

                            <Link to="/newrepair">
                                <button className="flex items-center bg-[#25D482] text-white px-4 py-2 rounded-lg hover:bg-[#1fab6b] transition">
                                    <Plus className="w-5 h-5 mr-1" />
                                    Add Ticket
                                </button>
                            </Link>
                        </div>



                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">New Tickets</div>
                            <div className="text-2xl font-bold text-gray-800">3</div>
                            <div className="text-xs text-gray-500 mt-1">Assigned today</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">In Progress</div>
                            <div className="text-2xl font-bold text-gray-800">5</div>
                            <div className="text-xs text-gray-500 mt-1">Currently working</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Awaiting Parts</div>
                            <div className="text-2xl font-bold text-gray-800">2</div>
                            <div className="text-xs text-gray-500 mt-1">Parts ordered</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Ready for Pickup</div>
                            <div className="text-2xl font-bold text-gray-800">4</div>
                            <div className="text-xs text-gray-500 mt-1">Completed repairs</div>
                        </div>
                    </div>

                    {/* Kanban Board with Drag and Drop */}
                    <KanbanBoard />

                    {/* Charts and Customer Responses */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-600" /> Low-Stock Parts</h3>
                            {lowStock.length === 0 ? (
                                <div className="text-sm text-gray-500">All parts are above threshold.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-left">
                                                <th className="px-3 py-2">Part Number</th>
                                                <th className="px-3 py-2">Name</th>
                                                <th className="px-3 py-2">Available</th>
                                                <th className="px-3 py-2">Threshold</th>
                                                <th className="px-3 py-2">Priority</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {lowStock.slice(0,5).map(item => (
                                                <tr key={item.partNumber} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/inventory?search=${encodeURIComponent(item.partNumber)}`)}>
                                                    <td className="px-3 py-2 font-medium text-gray-800">{item.partNumber}</td>
                                                    <td className="px-3 py-2 text-gray-700">{item.partName}</td>
                                                    <td className="px-3 py-2 text-gray-700">{item.currentAvailableStock}</td>
                                                    <td className="px-3 py-2 text-gray-700">{item.lowStockThreshold}</td>
                                                    <td className="px-3 py-2 text-gray-700">{item.priorityLevel}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Responses</h3>
                            {recentQuotations.length === 0 ? (
                                <div className="text-sm text-gray-500">No recent responses.</div>
                            ) : (
                                <div className="space-y-4">
                                    {recentQuotations.map(q => {
                                        const status = (q.status || "").toUpperCase();
                                        let icon = <Clock className="h-4 w-4 text-amber-600" />;
                                        let bg = "bg-amber-100";
                                        let textColor = "text-amber-600";
                                        if (status === "APPROVED") { icon = <CheckCircle className="h-4 w-4 text-green-600" />; bg = "bg-green-100"; textColor = "text-green-600"; }
                                        else if (status === "REJECTED") { icon = <X className="h-4 w-4 text-red-600" />; bg = "bg-red-100"; textColor = "text-red-600"; }

                                        const created = q.respondedAt || q.createdAt;
                                        const timeStr = created ? new Date(created).toLocaleString(undefined, { month: "short", day: "numeric" }) : "";

                                        return (
                                            <button key={q.quotationId} onClick={() => navigate(`/quotationviewer/${encodeURIComponent(q.repairTicketNumber)}`)} className="flex items-center w-full text-left">
                                                <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center mr-3`}>{icon}</div>
                                                <div>
                                                    <div className="font-medium">Quote for {q.repairTicketNumber} {status.charAt(0) + status.slice(1).toLowerCase()}</div>
                                                    <div className="text-xs text-gray-500">{timeStr}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TechnicianDashboard