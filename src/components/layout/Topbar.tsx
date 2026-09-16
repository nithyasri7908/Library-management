import React from 'react';
import { Menu, Bell, Search, Activity } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  serverConnected: boolean;
  pageTitle: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, serverConnected, pageTitle }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Backend Connection Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
          <div className="relative flex h-2 w-2">
            {serverConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                serverConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></span>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {serverConnected ? 'Django API Connected' : 'API Disconnected'}
          </span>
        </div>

        {/* Global Search Mockup */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-400">
          <Search className="w-4 h-4" />
          <span className="text-sm">Search (Cmd+K)</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
};
