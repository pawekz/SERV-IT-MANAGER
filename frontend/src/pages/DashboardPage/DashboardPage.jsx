import {
    LayoutGrid,
    ClipboardList,
    ShieldCheck,
    History,
    Users,
    Package,
    Save,
    Search,
    Bell,
    Plus,
    UserCircle,
    CalendarIcon,
} from "lucide-react"
import Sidebar from "../../components/SideBar/Sidebar.jsx";

const DashboardPage = () => {
    // Static data for the dashboard
    const stats = {
        users: 1248,
        devicesInRepair: 87,
        warrantyRequests: 32,
        satisfactionRate: "94%",
    }

    const inventoryData = [
        { id: "INV001", description: "Laptop Battery Pack", pricePerUnit: "$89.99", quantity: 45, reorderLevel: 15 },
        { id: "INV002", description: "Screen Protector", pricePerUnit: "$12.99", quantity: 120, reorderLevel: 30 },
        { id: "INV003", description: "USB-C Cable", pricePerUnit: "$8.99", quantity: 78, reorderLevel: 25 },
        { id: "INV004", description: "Wireless Mouse", pricePerUnit: "$24.99", quantity: 32, reorderLevel: 10 },
        { id: "INV005", description: "Keyboard", pricePerUnit: "$49.99", quantity: 18, reorderLevel: 8 },
    ]

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

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}

            <Sidebar/>


            {/* Main Content */}
            <div className="flex-2 overflow-auto">
                {/* Header */}
                <header className="bg-white shadow-sm p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Good Day, Kyle</h2>
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
                            <button className="flex items-center bg-[#33e407] text-white px-4 py-2 rounded-lg hover:bg-opacity-90">
                                <Plus className="w-5 h-5 mr-1" />
                                Add Ticket
                            </button>
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
                            <div className="ml-10 mt-2 flex justify-between text-xs text-gray-500">
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
                                            : day
                                                ? "hover:bg-gray-100 cursor-pointer"
                                                : ""
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
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price Per Unit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reorder Level
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {inventoryData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pricePerUnit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.quantity <= item.reorderLevel
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                            }`}
                        >
                          {item.quantity}
                        </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reorderLevel}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
