import React from 'react';
import { LayoutDashboard, BookOpen, Users, ArrowRightLeft, Menu, X, Library } from 'lucide-react';

export type TabType = 'dashboard' | 'books' | 'members' | 'borrows' | 'architecture';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isMobileOpen, setIsMobileOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books Catalog', icon: BookOpen },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'borrows', label: 'Circulation', icon: ArrowRightLeft },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950/50 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
              <Library className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">LMS System</span>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id as TabType);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Footer profile/system status */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-slate-300">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin Portal</p>
              <p className="text-xs text-slate-400 truncate">University Library</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
