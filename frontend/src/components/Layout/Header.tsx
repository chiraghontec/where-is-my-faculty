import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, GraduationCap, LayoutDashboard, CalendarCheck, Settings } from 'lucide-react';
import { useFacultyStore } from '../../store/facultyStore';
import SyncStatus from '../Common/SyncStatus';

export default function Header() {
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useFacultyStore();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/availability', label: 'Check Availability', icon: CalendarCheck },
    { to: '/admin', label: 'Admin', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="Where Is My Faculty — Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">Where Is My</p>
              <p className="text-xs text-blue-600 font-semibold leading-tight">Faculty</p>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search faculty by name or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                aria-label="Search faculty"
              />
            </div>
          </div>

          {/* Sync status */}
          <div className="hidden md:flex shrink-0">
            <SyncStatus />
          </div>
        </div>

        {/* Nav row */}
        <nav className="flex items-center gap-1 -mb-px pb-0" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={15} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
