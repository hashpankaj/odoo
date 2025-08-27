import React from 'react';
import { Clock, Activity } from 'lucide-react';

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      action: 'Rule activated',
      rule: 'Redirect API calls',
      time: '2 minutes ago',
      type: 'success',
    },
    {
      id: 2,
      action: 'Rule created',
      rule: 'Block tracking scripts',
      time: '1 hour ago',
      type: 'info',
    },
    {
      id: 3,
      action: 'Rule modified',
      rule: 'Custom headers',
      time: '3 hours ago',
      type: 'warning',
    },
    {
      id: 4,
      action: 'Rule deactivated',
      rule: 'Delay requests',
      time: '1 day ago',
      type: 'error',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="text-purple-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`rounded-full p-1.5 ${getTypeColor(activity.type)}`}>
              <Clock size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
              <p className="text-sm text-gray-600">{activity.rule}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium">
        View all activity
      </button>
    </div>
  );
}