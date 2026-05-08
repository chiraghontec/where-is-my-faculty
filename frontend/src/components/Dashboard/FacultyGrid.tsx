import React from 'react';
import type { Faculty } from '../../types';
import FacultyCard from '../FacultyCard/FacultyCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import { useFacultyStore } from '../../store/facultyStore';

interface Props {
  faculty: Faculty[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

function StatusSummaryBar({ faculty }: { faculty: Faculty[] }) {
  const counts = faculty.reduce<Record<string, number>>((acc, f) => {
    const s = f.availability.status;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const items = [
    { label: 'Available', count: counts['available'] ?? 0, dot: 'bg-emerald-500' },
    { label: 'In Meeting', count: counts['in_meeting'] ?? 0, dot: 'bg-amber-500' },
    { label: 'Busy', count: counts['busy'] ?? 0, dot: 'bg-red-500' },
    { label: 'On Leave', count: (counts['on_leave'] ?? 0) + (counts['out_of_office'] ?? 0), dot: 'bg-violet-500' },
    { label: 'Offline', count: counts['offline'] ?? 0, dot: 'bg-gray-400' },
  ].filter((i) => i.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
      <span className="font-medium text-gray-900">{faculty.length} faculty</span>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${item.dot}`} />
          {item.count} {item.label}
        </span>
      ))}
    </div>
  );
}

export default function FacultyGrid({ faculty, isLoading, error }: Props) {
  const clearFilters = useFacultyStore((s) => s.clearFilters);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" label="Loading faculty schedules..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">Failed to load faculty data</p>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!faculty?.length) {
    return (
      <EmptyState
        title="No faculty found"
        description="Try adjusting your search or filter criteria."
        action={
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Clear filters
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <StatusSummaryBar faculty={faculty} />
      </div>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
        role="list"
        aria-label="Faculty list"
      >
        {faculty.map((f) => (
          <div key={f.id} role="listitem">
            <FacultyCard faculty={f} />
          </div>
        ))}
      </div>
    </div>
  );
}
