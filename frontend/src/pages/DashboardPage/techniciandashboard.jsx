import Sidebar from "../../components/SideBar/Sidebar.jsx"
// import KanbanBoard from "./components/KanbanBoard.jsx"
import KanbanBoard from "../../components/Kanban/KanbanBoard.jsx"
import { Bell, User, Search, CheckCircle, X, Clock } from "lucide-react"

const TechnicianDashboard = () => {
    return (
        <div className="flex min-h-screen">
            {/* Custom Sidebar Component */}
            <div className="w-60 bg-gray-50 shadow-md">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 bg-gray-50 overflow-x-auto">
                {/* Header with Search and User Menu */}
                <div className="bg-white px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 gap-4">
                    <div className="flex-shrink-0">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Hello Technician's First Name</h2>
                    </div>
                    <div className="flex-1 max-w-md mx-0 md:mx-8 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickets, parts..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <Bell className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
                            <User className="h-5 w-5 text-gray-600" />
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-4 md:p-8 max-w-full">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">My Tasks Today</h1>

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
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Parts Usage Statistics</h3>
                            <div className="bg-teal-50 border-l-4 border-red-500 p-3 mb-4 rounded-r">
                                <p className="text-sm">
                                    <strong>Definition:</strong> This chart shows the frequency and quantity of replacement parts used in
                                    repairs over the past 30 days, helping identify common repair needs and inventory planning
                                    requirements.
                                </p>
                            </div>
                            <div className="h-64 flex items-end justify-around pt-5">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-teal-600 rounded-t relative" style={{ height: "60%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">12</div>
                                    </div>
                                    <div className="text-xs mt-2">Screens</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-teal-600 rounded-t relative" style={{ height: "40%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">8</div>
                                    </div>
                                    <div className="text-xs mt-2">Batteries</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-teal-600 rounded-t relative" style={{ height: "15%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">3</div>
                                    </div>
                                    <div className="text-xs mt-2">Motherboards</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-teal-600 rounded-t relative" style={{ height: "25%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">5</div>
                                    </div>
                                    <div className="text-xs mt-2">Cameras</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="w-10 bg-teal-600 rounded-t relative" style={{ height: "35%" }}>
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">7</div>
                                    </div>
                                    <div className="text-xs mt-2">Speakers</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Responses</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Quote #4432 Approved</div>
                                        <div className="text-xs text-gray-500">John Smith • 1h ago</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                        <X className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Quote #4435 Rejected</div>
                                        <div className="text-xs text-gray-500">Emma Johnson • 3h ago</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Quote #4438 Pending</div>
                                        <div className="text-xs text-gray-500">Michael Brown • 5h ago</div>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Quote #4441 Approved</div>
                                        <div className="text-xs text-gray-500">Sarah Davis • 1d ago</div>
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

export default TechnicianDashboard
