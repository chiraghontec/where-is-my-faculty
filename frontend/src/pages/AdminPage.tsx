import React, { useState } from 'react';
import { Users, CalendarOff, RefreshCw, BarChart3 } from 'lucide-react';
import LeaveList from '../components/LeaveManagement/LeaveList';
import { useSyncTrigger } from '../hooks/useFaculty';
import { useFacultyList } from '../hooks/useFaculty';
import AvailabilityBadge from '../components/Common/AvailabilityBadge';
import { STATUS_CONFIG } from '../constants';

type Tab = 'overview' | 'leaves' | 'faculty';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const syncMutation = useSyncTrigger();
  const { data: faculty = [] } = useFacultyList();

  const tabs: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
    { value: 'leaves', label: 'Leave Requests', icon: <CalendarOff size={15} /> },
    { value: 'faculty', label: 'Faculty', icon: <Users size={15} /> },
  ];

  const statusCounts = faculty.reduce<Record<string, number>>((acc, f) => {
    acc[f.availability.status] = (acc[f.availability.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage faculty, leaves, and calendar sync</p>
        </div>
        <button
          onClick={() => syncMutation.mutate(undefined)}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw size={15} className={syncMutation.isPending ? 'animate-spin' : ''} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync All Calendars'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === value
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-current={activeTab === value ? 'page' : undefined}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const count = statusCounts[status] ?? 0;
              if (count === 0) return null;
              return (
                <div
                  key={status}
                  className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${cfg.color}`}>{count}</p>
                  <p className={`text-xs ${cfg.color} opacity-70`}>
                    {((count / faculty.length) * 100).toFixed(0)}% of total
                  </p>
                </div>
              );
            })}
          </div>

          {/* Department breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Department Breakdown</h3>
            <div className="space-y-3">
              {Array.from(new Set(faculty.map((f) => f.department.name))).map((deptName) => {
                const deptFaculty = faculty.filter((f) => f.department.name === deptName);
                const available = deptFaculty.filter((f) => f.availability.status === 'available').length;
                const pct = Math.round((available / deptFaculty.length) * 100);
                return (
                  <div key={deptName}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{deptName}</span>
                      <span className="text-gray-500 text-xs">
                        {available}/{deptFaculty.length} available
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && <LeaveList />}

      {activeTab === 'faculty' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Office</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {faculty.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-400">{f.designation}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{f.department.code}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{f.officeLocation}</td>
                  <td className="px-4 py-3">
                    <AvailabilityBadge status={f.availability.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                    {new Date(f.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
