import {
    ClipboardList,
    ShieldCheck,
    Users,
    Search,
    Bell,
    Plus,
    CalendarIcon,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { Link } from "react-router-dom";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import {useEffect, useState} from "react";

const DashboardPage = () => {
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
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar activePage={'dashboard'}/>

            {/*Given Sidebar length*/}
            <div className="w-60  bg-gray-50 shadow-md">
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Header */}
                <header className="bg-white shadow-sm p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Good Day, {userData.firstName}</h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#33e407] focus:border-transparent"
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                            </div>
                            <button className="p-2 rounded-full hover:bg-gray-100">
                                <Bell className="w-5 h-5 text-gray-600" />
                            </button>
                            {(userData.role === 'ADMIN' || userData.role === 'TECHNICIAN') && (
                                <Link to="/newrepair">
                                    <button className="flex items-center bg-[#33e407] text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
                                        <Plus className="w-5 h-5 mr-1" />
                                        Add Ticket
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Users</p>
                                <h3 className="text-2xl font-bold">{stats.users}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Users className="w-6 h-6 text-[#33e407]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Devices in Repair</p>
                                <h3 className="text-2xl font-bold">{stats.devicesInRepair}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <ClipboardList className="w-6 h-6 text-[#33e407]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Warranty Requests</p>
                                <h3 className="text-2xl font-bold">{stats.warrantyRequests}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <ShieldCheck className="w-6 h-6 text-[#33e407]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Satisfaction Rate</p>
                                <h3 className="text-2xl font-bold">{stats.satisfactionRate}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <div className="w-6 h-6 text-[#33e407] flex items-center justify-center font-bold">★</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts and Calendar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {/* Transaction History Chart */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                        <div className="h-64 relative">
                            {/* Y-axis labels */}
                            <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
                                <span>15</span>
                                <span>12</span>
                                <span>9</span>
                                <span>6</span>
                                <span>3</span>
                                <span>0</span>
                            </div>

                            {/* Chart area */}
                            <div className="ml-10 h-full flex items-end">
                                <svg className="w-full h-full" viewBox="0 0 600 240">
                                    {/* Horizontal grid lines */}
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <line
                                            key={i}
                                            x1="0"
                                            y1={240 - i * 48}
                                            x2="600"
                                            y2={240 - i * 48}
                                            stroke="#e5e7eb"
                                            strokeWidth="1"
                                        />
                                    ))}

                                    {/* Line chart */}
                                    <polyline
                                        points={chartData.values.map((value, index) => `${index * 100 + 50},${240 - value * 16}`).join(" ")}
                                        fill="none"
                                        stroke="#33e407"
                                        strokeWidth="3"
                                    />

                                    {/* Data points */}
                                    {chartData.values.map((value, index) => (
                                        <circle key={index} cx={index * 100 + 50} cy={240 - value * 16} r="5" fill="#33e407" />
                                    ))}
                                </svg>
                            </div>

                            {/* X-axis labels */}
                            <div className="ml-10  flex justify-between text-xs text-gray-500">
                                {chartData.months.map((month, index) => (
                                    <span key={index}>{month}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <CalendarIcon className="w-5 h-5 mr-2 text-[#33e407]" />
                            {currentMonth} {currentYear}
                        </h3>
                        <div className="grid grid-cols-7 gap-1">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                    {day}
                                </div>
                            ))}
                            {calendarDays.map((day, index) => (
                                <div
                                    key={index}
                                    className={`text-center py-2 text-sm rounded-full ${
                                        day === currentDate.getDate()
                                            ? "bg-[#33e407] text-white font-bold"
                                            : day ? "hover:bg-gray-100" : ""
                                    }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="p-4">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Inventory</h3>
                        </div>
                        <div className="overflow-x-auto">
                            {inventoryLoading ? (
                                <div className="text-center py-4">Loading inventory data...</div>
                            ) : inventoryError ? (
                                <div className="text-center py-4 text-gray-500">Empty</div>
                            ) : (
                                <>
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Part Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unit Cost
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Current Stock
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {currentItems.length > 0 ? (
                                            currentItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.partNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <span className="truncate max-w-xs">{item.description?.substring(0, 50)}{item.description?.length > 50 ? '...' : ''}</span>
                                                            <button
                                                                onClick={() => showDescriptionModal(item)}
                                                                className="ml-2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ₱{item.unitCost?.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.currentStock}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            item.currentStock <= 2
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {item.currentStock <= 2 ? 'Low Stock' : 'In Stock'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No inventory items found
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>

                                    {/* Pagination Controls */}
                                    {inventoryData.length > 0 && (
                                        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                <button
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                                                        currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                                                        currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    Next
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </button>
                                            </div>
                                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-700">
                                                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                                                        <span className="font-medium">
                                                            {Math.min(indexOfLastItem, inventoryData.length)}
                                                        </span>{" "}
                                                        of <span className="font-medium">{inventoryData.length}</span> results
                                                    </p>
                                                </div>
                                                <div>
                                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                        <button
                                                            onClick={goToPreviousPage}
                                                            disabled={currentPage === 1}
                                                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                                                                currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <span className="sr-only">Previous</span>
                                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                                        </button>

                                                        {[...Array(totalPages).keys()].map((number) => (
                                                            <button
                                                                key={number + 1}
                                                                onClick={() => paginate(number + 1)}
                                                                className={`relative inline-flex items-center px-4 py-2 border ${
                                                                    currentPage === number + 1
                                                                        ? "z-10 bg-[#33e407] border-[#33e407] text-white"
                                                                        : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                                                                } text-sm font-medium`}
                                                            >
                                                                {number + 1}
                                                            </button>
                                                        ))}

                                                        <button
                                                            onClick={goToNextPage}
                                                            disabled={currentPage === totalPages}
                                                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                                                                currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            <span className="sr-only">Next</span>
                                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                                        </button>
                                                    </nav>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description Modal - Simplified to show only description */}
                {modalData && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
                        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{modalData.name} Description</h3>
                                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="whitespace-pre-wrap">{modalData.description}</p>
                            </div>
                            <div className="p-4 border-t flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DashboardPage