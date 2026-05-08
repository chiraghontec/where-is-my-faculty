import React, { useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
  RefreshCw,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useFacultyStore } from '../../store/facultyStore';
import { useFacultyDetail } from '../../hooks/useFaculty';
import { useSyncTrigger } from '../../hooks/useFaculty';
import AvailabilityBadge from '../Common/AvailabilityBadge';
import WeekSchedule from './WeekSchedule';
import LoadingSpinner from '../Common/LoadingSpinner';

export default function FacultyDetailModal() {
  const { selectedFacultyId, setSelectedFacultyId } = useFacultyStore();
  const { data: faculty, isLoading } = useFacultyDetail(selectedFacultyId);
  const syncMutation = useSyncTrigger();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedFacultyId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setSelectedFacultyId]);

  if (!selectedFacultyId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={() => setSelectedFacultyId(null)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={faculty ? `${faculty.name} — schedule details` : 'Loading faculty details'}
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={() => setSelectedFacultyId(null)}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close panel"
        >
          <X size={20} />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" label="Loading schedule..." />
          </div>
        ) : faculty ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-start gap-4 pr-8">
                {/* Avatar */}
                {faculty.avatarUrl ? (
                  <img
                    src={faculty.avatarUrl}
                    alt={faculty.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center ring-2 ring-white shadow-md">
                    <span className="text-white text-xl font-bold">
                      {faculty.name
                        .split(' ')
                        .filter((p) => p.length > 1)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{faculty.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{faculty.designation}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 size={12} className="text-blue-500" />
                    <p className="text-xs text-blue-600 font-medium">{faculty.department.name}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <AvailabilityBadge status={faculty.availability.status} size="md" showPulse />
                <button
                  onClick={() => syncMutation.mutate(faculty.id)}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                  aria-label="Sync this faculty's calendar"
                >
                  <RefreshCw size={12} className={syncMutation.isPending ? 'animate-spin' : ''} />
                  Sync now
                </button>
              </div>

              {/* Meta info */}
              <div className="mt-4 grid grid-cols-1 gap-1.5 text-xs text-gray-500">
                <a
                  href={`mailto:${faculty.email}`}
                  className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                >
                  <Mail size={12} className="shrink-0" />
                  {faculty.email}
                  <ExternalLink size={10} className="opacity-50" />
                </a>
                {faculty.phone && (
                  <a
                    href={`tel:${faculty.phone}`}
                    className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                  >
                    <Phone size={12} className="shrink-0" />
                    {faculty.phone}
                  </a>
                )}
                <span className="flex items-center gap-2">
                  <MapPin size={12} className="shrink-0" />
                  {faculty.officeLocation}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={12} className="shrink-0" />
                  Working hours: {faculty.workingHoursStart} – {faculty.workingHoursEnd}
                </span>
              </div>

              {/* Last synced */}
              <p className="mt-3 text-xs text-gray-400">
                Calendar last synced: {format(parseISO(faculty.lastSynced), 'MMM d, h:mm a')}
              </p>
            </div>

            {/* Schedule */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>This Week's Schedule</span>
                <span className="text-xs font-normal text-gray-400">(Mon–Fri)</span>
              </h3>
              <WeekSchedule schedule={faculty.weekSchedule} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Faculty not found
          </div>
        )}
      </div>
    </>
  );
}
