import React from 'react';
import { Filter, X } from 'lucide-react';
import { useFacultyStore } from '../../store/facultyStore';
import { useDepartments } from '../../hooks/useFaculty';
import { STATUS_CONFIG } from '../../constants';
import type { AvailabilityStatus } from '../../types';

const STATUS_OPTIONS: AvailabilityStatus[] = [
  'available',
  'in_meeting',
  'busy',
  'on_leave',
  'out_of_office',
  'offline',
];

export default function DashboardFilters() {
  const {
    selectedDepartmentId,
    statusFilters,
    setSelectedDepartmentId,
    toggleStatusFilter,
    clearFilters,
  } = useFacultyStore();

  const { data: departments = [] } = useDepartments();

  const hasActiveFilters = !!selectedDepartmentId || statusFilters.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Filter size={15} aria-hidden="true" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            aria-label="Clear all filters"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Department filter */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Department</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedDepartmentId(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
              !selectedDepartmentId
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            All
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() =>
                setSelectedDepartmentId(selectedDepartmentId === d.id ? null : d.id)
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                selectedDepartmentId === d.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const active = statusFilters.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  active
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
                aria-pressed={active}
              >
                <span className={`w-2 h-2 rounded-full ${active ? cfg.dot : 'bg-gray-300'}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
