import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { RulesList } from './components/Rules/RulesList';
import { RuleCreator } from './components/RuleCreator/RuleCreator';
import { RulesProvider } from './context/RulesContext';
import { useChromeExtension } from './hooks/useChromeExtension';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { isExtension } = useChromeExtension();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'rules':
        return <RulesList />;
      case 'create':
        return <RuleCreator onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        return (
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <RulesProvider setCurrentView={setCurrentView}>
      <div className={`flex ${isExtension ? 'flex-col' : 'min-h-screen'} bg-gray-50`}>
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </RulesProvider>
  );
}

export default App;