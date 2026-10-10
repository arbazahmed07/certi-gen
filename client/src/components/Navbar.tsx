import React from 'react';
import { NavLink } from 'react-router-dom';
import { Award, PlusCircle, LayoutDashboard, History, Layers, Settings, FileText, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../services/api';

export const Navbar: React.FC = () => {
  const { data: health, isSuccess } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000,
  });

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/generate', label: 'Generate', icon: PlusCircle },
    { to: '/jobs', label: 'Jobs', icon: History },
    { to: '/certificates', label: 'Library', icon: Award },
    { to: '/template', label: 'Template', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 bg-clip-text text-transparent">
                CertiFlow
              </span>
              <span className="block text-[10px] font-medium tracking-wider uppercase text-indigo-600">
                Bulk Generator
              </span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* System status pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSuccess ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isSuccess ? 'Backend API Live' : 'Connecting...'}</span>
            </div>

            <NavLink
              to="/generate"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs shadow-indigo-600/30 transition-all hover:shadow-indigo-600/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Batch</span>
            </NavLink>
          </div>
        </div>
      </div>
    </header>
  );
};
