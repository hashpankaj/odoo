import React from 'react';
import { Home, Plus, Settings, BarChart3 } from 'lucide-react';
import { useRules } from '../../context/RulesContext';
import { useChromeExtension } from '../../hooks/useChromeExtension';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { isExtension, openInNewTab } = useChromeExtension();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'rules', label: 'Rules', icon: BarChart3 },
    { id: 'create', label: 'Create Rule', icon: Plus },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isExtension) {
    return (
      <div className="bg-gray-900 text-white p-2">
        <nav className="flex items-center justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                  currentView === item.id
                    ? 'text-purple-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-purple-400">RequestPro</h1>
        <p className="text-gray-400 text-sm mt-1">Advanced Request Modifier</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {isExtension && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button 
            onClick={openInNewTab}
            className="w-full text-xs text-gray-400 hover:text-gray-300 transition-colors">
            Open in New Tab
          </button>
        </div>
      )}
    </div>
  );
}