
import { AlertTriangle } from 'lucide-react';

const RequiredActionsCard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Required Actions</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mr-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="font-medium">Approve Quotation #4432</div>
              <div className="text-xs text-gray-500">Expires in 6 days</div>
            </div>
          </div>
          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Take Action</button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center mr-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="font-medium">Schedule pickup #RT-0036</div>
              <div className="text-xs text-gray-500">Ready since May 29</div>
            </div>
          </div>
          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">Take Action</button>
        </div>
      </div>
    </div>
  );
};

export default RequiredActionsCard; 