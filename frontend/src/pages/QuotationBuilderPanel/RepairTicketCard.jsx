import React, { useState, useEffect } from "react";
import { Wrench, User, Cuboid as Cube } from "lucide-react";
import api from '../../config/ApiConfig';

const RepairTicketCard = ({ ticketNumber, getStatusColor }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    if (!ticketNumber) return;
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/repairTicket/getRepairTicket/${ticketNumber}`);
        setTicket(data);
      } catch (err) {
        console.error("Failed to fetch ticket", err);
        setError("Failed to load repair ticket details");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6 text-gray-500">
        Loading repair ticket details...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 mb-6 p-6 text-red-600">
        {error || "Repair ticket not found."}
      </div>
    );
  }

  // Helpers to build display values
  const deviceDisplay = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || ticket.deviceType;
  const createdOn = ticket.checkInDate ? new Date(ticket.checkInDate).toLocaleDateString() : "-";

  const first = ticket.customerFirstName || '';
  const last = ticket.customerLastName || '';
  
  // Format status: replace underscores with spaces for display
  const formatStatus = (status) => {
    if (!status) return status;
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Cube size={24} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Assign Parts to Repair Ticket {ticket.ticketNumber}
            </h2>
            <p className="text-gray-600 text-sm">
              Select parts from inventory to assign to this repair ticket.
            </p>
          </div>
        </div>
      </div>

      {/* Repair and Customer Info */}
      <div className="grid md:grid-cols-2 gap-6 p-5 border-t border-gray-100">
        {/* Repair Information */}
        <div>
          <div className="flex items-center mb-4">
            <Wrench size={18} className="text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-700">Repair Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-gray-500">Ticket ID:</div>
            <div className="font-medium">{ticket.ticketNumber}</div>

            <div className="text-gray-500">Device:</div>
            <div className="font-medium">{deviceDisplay}</div>

            <div className="text-gray-500">Repair Description:</div>
            <div className="font-medium">
              {(() => {
                if (!ticket.reportedIssue) return "-";
                const maxLen = 40;
                const needsTruncate = ticket.reportedIssue.length > maxLen;
                const displayText = needsTruncate && !showFullDesc
                  ? ticket.reportedIssue.slice(0, maxLen) + "..."
                  : ticket.reportedIssue;
                return (
                  <>
                    {displayText}
                    {needsTruncate && (
                      <button
                        onClick={() => setShowFullDesc((prev) => !prev)}
                        className="ml-1 text-green-600 hover:underline text-xs"
                      >
                        {showFullDesc ? "Show less" : "Show more"}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="text-gray-500">Status:</div>
            <div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  ticket.repairStatus
                )}`}
              >
                {formatStatus(ticket.repairStatus)}
              </span>
            </div>

            <div className="text-gray-500">Technician:</div>
            <div className="font-medium">{ticket.technicianName || "-"}</div>
          </div>
        </div>

        {/* Customer Information */}
        <div>
          <div className="flex items-center mb-4">
            <User size={18} className="text-gray-500 mr-2" />
            <h3 className="font-medium text-gray-700">Customer Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-gray-500">First Name:</div>
            <div className="font-medium">{first || '—'}</div>
            <div className="text-gray-500">Last Name:</div>
            <div className="font-medium">{last || '—'}</div>
            <div className="text-gray-500">Email:</div>
            <div className="font-medium">{ticket.customerEmail}</div>
            <div className="text-gray-500">Phone:</div>
            <div className="font-medium">{ticket.customerPhoneNumber}</div>
            <div className="text-gray-500">Created On:</div>
            <div className="font-medium">{createdOn}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairTicketCard;
