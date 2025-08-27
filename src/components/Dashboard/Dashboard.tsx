import React from 'react';
import { Activity, Shield, Zap, BarChart } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { RecentActivity } from './RecentActivity';
import { useRules } from '../../context/RulesContext';

export function Dashboard() {
  const { state, setCurrentView, importRules, exportRules } = useRules();

  const statsData = [
    {
      title: 'Total Rules',
      value: state.stats.totalRules,
      icon: BarChart,
      color: 'purple' as const,
    },
    {
      title: 'Active Rules',
      value: state.stats.activeRules,
      icon: Activity,
      color: 'green' as const,
    },
    {
      title: 'Blocked Requests',
      value: state.stats.blockedRequests,
      icon: Shield,
      color: 'orange' as const,
    },
    {
      title: 'Redirected',
      value: state.stats.redirectedRequests,
      icon: Zap,
      color: 'blue' as const,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your request modification rules and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivity />
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setCurrentView('create')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Create New Rule
            </button>
            <button 
              onClick={importRules}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Import Rules
            </button>
            <button 
              onClick={exportRules}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Export All Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}