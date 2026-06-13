import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogOut, Activity, Bot } from 'lucide-react';
import { apiRequest } from '../services/api';

interface NavbarProps {
  onOpenAiAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiAssistant }) => {
  const { user, logout } = useAuth();
  const [sosStatus, setSosStatus] = useState<'IDLE' | 'TRIGGERED' | 'FAILED'>('IDLE');

  const triggerSos = async () => {
    if (!window.confirm('Are you sure you want to trigger the emergency SOS? Wardens and security will be alerted immediately.')) {
      return;
    }
    setSosStatus('TRIGGERED');
    try {
      await apiRequest('/api/sos/trigger', { method: 'POST' });
      alert('🚨 SOS Alert Dispatched! Help is on the way.');
    } catch (err: any) {
      alert('Failed to dispatch SOS: ' + err.message);
      setSosStatus('FAILED');
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200 py-3.5 px-6 md:px-12 flex justify-between items-center transition-all shadow-sm">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-600/20">
          <Activity size={20} className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-slate-950 flex items-center space-x-1.5">
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">SmartHostel</span>
            <span className="text-[10px] text-blue-600 font-extrabold px-1.5 py-0.5 rounded-md border border-blue-200 bg-blue-50/50">OS</span>
          </h1>
        </div>
      </div>

      {/* Nav Elements */}
      <div className="flex items-center space-x-4">
        {/* AI Assistant Button */}
        {onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-xs hover:bg-blue-100/80 active:scale-95 transition-all duration-200"
          >
            <Bot size={16} />
            <span className="hidden sm:inline font-bold">AI Assistant</span>
          </button>
        )}

        {/* SOS Emergency button (Students only) */}
        {user?.role === 'STUDENT' && (
          <button
            onClick={triggerSos}
            disabled={sosStatus === 'TRIGGERED'}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all duration-300 ${
              sosStatus === 'TRIGGERED'
                ? 'bg-red-700 cursor-not-allowed animate-ping'
                : 'bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 sos-pulse-animation'
            }`}
          >
            <ShieldAlert size={16} />
            <span>SOS</span>
          </button>
        )}

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{user.role}</p>
            </div>
            
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
