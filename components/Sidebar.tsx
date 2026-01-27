import React from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  MessageCircleQuestion, 
  CalendarRange, 
  GraduationCap 
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isMobileOpen, setIsMobileOpen }) => {
  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'practice', label: 'Adaptive Practice', icon: <BrainCircuit size={20} /> },
    { id: 'doubts', label: 'Doubt Solver', icon: <MessageCircleQuestion size={20} /> },
    { id: 'planner', label: 'Study Planner', icon: <CalendarRange size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-200 w-64 z-30 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">MindSpark</h1>
            <p className="text-xs text-slate-500 font-medium">AI Learning Partner</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setIsMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <span className={`
                ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
              `}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
              ST
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Student Account</p>
              <p className="text-xs text-slate-500">Premium Plan</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
