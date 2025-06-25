import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/SideBar/Sidebar.jsx";
import api from "../../services/api.jsx";
import Spinner from "../../components/Spinner/Spinner.jsx";
import { Package } from "lucide-react";

const QuotationViewer = () => {
  const { ticketNumber } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/quotation/getQuotationByRepairTicketNumber/${ticketNumber}`);
        if (!data || data.length === 0) {
          setError("No quotation found for this ticket");
          setLoading(false);
          return;
        }
        const q = data[0];
        setQuotation(q);
        const partResponses = await Promise.all(q.partIds.map(id => api.get(`/part/getPartById/${id}`)));
        setParts(partResponses.map(r => r.data));
      } catch (e) {
        setError("Failed to load quotation");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center"><Spinner size="large"/></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-['Poppins',sans-serif]">
      <Sidebar />
      <div className="flex-1 p-8 ml-[250px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Quotation Details</h1>
            <p className="text-sm text-gray-500">Repair Ticket <span className="font-medium text-gray-700">{ticketNumber}</span></p>
          </div>
          {quotation?.status && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${(() => {
                switch (quotation.status.toUpperCase()) {
                  case "APPROVED":
                    return "bg-green-100 text-green-700";
                  case "REJECTED":
                    return "bg-red-100 text-red-700";
                  case "EXPIRED":
                    return "bg-gray-100 text-gray-600";
                  default:
                    return "bg-yellow-100 text-yellow-700"; // PENDING
                }
              })()}`}
            >
              {quotation.status}
            </span>
          )}
        </div>

        {/* Parts List */}
        <div className="space-y-4">
          {parts.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-md">
                <Package size={20} className="text-blue-500" />
              </div>
              <div className="flex-1 grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Part Name</div>
                  <div className="font-medium text-gray-800 truncate">{p.name}</div>
                </div>
                <div>
                  <div className="text-gray-500">SKU</div>
                  <div className="font-medium text-gray-800">{p.partNumber}</div>
                </div>
                <div>
                  <div className="text-gray-500">Serial Number</div>
                  <div className="font-medium text-gray-800 truncate">{p.serialNumber || "-"}</div>
                </div>
                <div>
                  <div className="text-gray-500">Price</div>
                  <div className="font-medium text-gray-800">₱{p.unitCost?.toFixed(2) || "-"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Description Section */}
        {parts.some(p => p.description) && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Part Descriptions</h2>
            <div className="space-y-3">
              {parts.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-md p-3">
                  <div className="font-medium text-gray-700 mb-1">{p.name}</div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{p.description || "No description provided."}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Summary */}
        <div className="mt-10 flex flex-col items-end text-sm">
          <div className="font-medium text-gray-700">Labor Cost: ₱{quotation?.laborCost?.toFixed(2)}</div>
          <div className="font-bold text-lg text-gray-900">Total: ₱{quotation?.totalCost?.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default QuotationViewer; 