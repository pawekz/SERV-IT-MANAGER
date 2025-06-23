import { FileText } from 'lucide-react';

const DocumentAccessCard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Access</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Warranty Claim IO-RMA-000042</div>
              <div className="text-xs text-gray-500">May 28, 2025</div>
            </div>
          </div>
          <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded">View</button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Repair Ticket IO-RT-000012</div>
              <div className="text-xs text-gray-500">May 28, 2025</div>
            </div>
          </div>
          <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded">View</button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Terms and Conditions</div>
              <div className="text-xs text-gray-500">May 28, 2025</div>
            </div>
          </div>
          <button className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded">View</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentAccessCard; 