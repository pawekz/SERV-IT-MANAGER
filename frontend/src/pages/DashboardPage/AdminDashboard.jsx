import Sidebar from "../../components/SideBar/Sidebar.jsx"

const AdminDashboard = () => {
    return (
        <div className="flex min-h-screen">
            {/* Custom Sidebar Component */}
            <Sidebar />
            <div className="w-60  bg-gray-50 shadow-md">
            </div>
            {/* Main Content Area */}
            <div className="flex-1 bg-gray-50">
                {/* Header with Search and User Menu */}
                <div className="bg-white px-8 py-4 flex justify-between items-center border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Hello Administrator's First Name</h2>
                    </div>
                    <div className="flex-1 max-w-md mx-8">
                        <input
                            type="text"
                            placeholder="Search users, tickets, inventory..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center space-x-5">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            🔔
                        </div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            👤
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Active Users</div>
                            <div className="text-2xl font-bold text-gray-800">42</div>
                            <div className="text-xs text-gray-500 mt-1">+3 this week</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Open Tickets</div>
                            <div className="text-2xl font-bold text-gray-800">18</div>
                            <div className="text-xs text-gray-500 mt-1">-2 since yesterday</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Pending Approvals</div>
                            <div className="text-2xl font-bold text-gray-800">3</div>
                            <div className="text-xs text-gray-500 mt-1">Requires attention</div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="text-gray-600 text-sm mb-2">Low Stock Items</div>
                            <div className="text-2xl font-bold text-gray-800">7</div>
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

export default AdminDashboard
