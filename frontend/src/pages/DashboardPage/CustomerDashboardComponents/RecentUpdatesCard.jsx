import { Clock } from 'lucide-react';

const RecentUpdatesCard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Updates</h3>
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">Part ordered</div>
            <div className="text-xs text-gray-500">1h ago • #RT-2023-0042</div>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">Diagnosis complete</div>
            <div className="text-xs text-gray-500">1d ago • #RT-2023-0042</div>
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mr-3">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">Ticket created</div>
            <div className="text-xs text-gray-500">2d ago • #RT-2023-0042</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentUpdatesCard; 