import React from 'react';

// NOTE: This component contains the mock repair data and UI that were originally
// embedded in RealTimeStatus.jsx. It is kept here for reference or future use.

const repairs = [
  {
    id: "RT-8742",
    item: "Dell Laptop",
    submitted: "05/10/2025",
    status: "Repairing",
    lastUpdated: "05/12/2025",
    progress: 60,
    technician: "John Paulo",
    estimatedCompletion: "05/13/2025",
    notes: "Display and battery replaced. Testing in progress.",
  },
  {
    id: "RT-8721",
    item: "MacBook Air",
    submitted: "05/05/2025",
    status: "Ready for Pickup",
    lastUpdated: "05/11/2025",
    progress: 100,
    technician: "Reene Doe",
    estimatedCompletion: "05/11/2025",
    notes: "Keyboard replacement completed. Quality check passed.",
  },
  {
    id: "RT-8689",
    item: "HP Printer",
    submitted: "04/28/2025",
    status: "Completed",
    lastUpdated: "05/03/2025",
    progress: 100,
    technician: "Kyle Doe",
    estimatedCompletion: "05/03/2025",
    notes: "Screen repair completed. Device picked up by customer.",
  },
];

const getStatusColor = (status) => {
  switch (status) {
    case "Received":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Diagnosing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Awaiting Parts":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Repairing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Ready for Pickup":
      return "bg-green-100 text-green-800 border-green-200";
    case "Completed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getProgressColor = (progress) => {
  if (progress === 100) return "bg-[#33e407]";
  if (progress >= 60) return "bg-yellow-500";
  return "bg-blue-500";
};

const SampleRepairCards = () => (
  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
    {repairs.map((repair) => (
      <div
        key={repair.id}
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
      >
        {/* Card Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{repair.item}</h3>
              <p className="text-sm text-gray-500">Ticket #{repair.id}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                repair.status,
              )}`}
            >
              {repair.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs text-gray-500">{repair.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                  repair.progress,
                )}`}
                style={{ width: `${repair.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Submitted:</span>
              <span className="text-sm font-medium text-gray-900">{repair.submitted}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="text-sm font-medium text-gray-900">{repair.lastUpdated}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Technician:</span>
              <span className="text-sm font-medium text-gray-900">{repair.technician}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Est. Completion:</span>
              <span className="text-sm font-medium text-gray-900">{repair.estimatedCompletion}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 font-medium mb-1">Notes:</p>
            <p className="text-sm text-gray-700">{repair.notes}</p>
          </div>

          {/* Action Button */}
          <button className="w-full mt-4 px-4 py-2 bg-[#33e407] text-white rounded-md hover:bg-[#2bc406] transition-colors duration-200 font-medium">
            View Details
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default SampleRepairCards; 