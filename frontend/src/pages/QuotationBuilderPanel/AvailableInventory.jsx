import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronLeft, ChevronRight, Package } from "lucide-react";

const AvailableInventory = ({ inventoryItems, selectedParts, togglePartSelection, getStatusColor }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    });
  }, [inventoryItems, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div id="available-inventory" className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800">Available Inventory</h2>
        </div>
      </div>

      {/* Search */}
      <div className="p-5 border-b border-gray-100">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search parts..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="w-10 px-5 py-3"></th>
              <th className="w-16 px-5 py-3">Image</th>
              <th className="px-5 py-3">Part Details</th>
              <th className="px-5 py-3">Availability</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                    checked={selectedParts.some((part) => part.id === item.id)}
                    onChange={() => togglePartSelection(item)}
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                    {/* image placeholder */}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.availability.status)}`}>
                    {item.availability.status} {item.availability.count > 0 && `(${item.availability.count})`}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-medium text-gray-900">₱{item.price.toFixed(2)}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{item.quantity}</td>
                <td className="px-5 py-4">
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-md ${selectedParts.some((part) => part.id === item.id) ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                    onClick={() => togglePartSelection(item)}
                    disabled={item.availability.status === "OUT OF STOCK"}
                  >
                    {selectedParts.some((part) => part.id === item.id) ? "Remove" : "Add"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-md text-sm font-medium ${currentPage === page ? "bg-green-500 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailableInventory; 