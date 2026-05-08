import React from 'react';
import { useFacultyList } from '../hooks/useFaculty';
import FacultyGrid from '../components/Dashboard/FacultyGrid';
import DashboardFilters from '../components/Dashboard/DashboardFilters';
import FacultyDetailModal from '../components/FacultyDetail/FacultyDetailModal';
import { useFacultyStore } from '../store/facultyStore';

export default function DashboardPage() {
  const { data, isLoading, error } = useFacultyList();
  const { selectedFacultyId } = useFacultyStore();

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faculty Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time status synced from Microsoft Outlook calendars
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters />

      {/* Grid */}
      <FacultyGrid
        faculty={data}
        isLoading={isLoading}
        error={error as Error | null}
      />

      {/* Detail modal */}
      {selectedFacultyId && <FacultyDetailModal />}
    </div>
  );
}
