import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Practice } from './components/Practice';
import { DoubtSolver } from './components/DoubtSolver';
import { Planner } from './components/Planner';
import { View } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('practice');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [viewState, setViewState] = useState<{ topic?: string; goal?: string }>({});

  const navigateTo = (view: View, state: { topic?: string; goal?: string } = {}) => {
    setCurrentView(view);
    setViewState(state);
    setIsMobileOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'practice':
        return <Practice initialTopic={viewState.topic} />;
      case 'doubts':
        return <DoubtSolver onNavigate={navigateTo} />;
      case 'planner':
        return <Planner initialGoal={viewState.goal} />;
      default:
        return <Practice initialTopic={viewState.topic} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        currentView={currentView}
        setView={(view) => navigateTo(view)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main className="flex-1 transition-all duration-300 ease-in-out md:ml-0 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="font-bold text-slate-800 text-lg">MindSpark</div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="md:p-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;