import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, UserCheck, UserX, Clock } from 'lucide-react';
import { useAvailabilityCheck } from '../../hooks/useAvailability';
import { useDepartments } from '../../hooks/useFaculty';
import AvailabilityBadge from '../Common/AvailabilityBadge';
import LoadingSpinner from '../Common/LoadingSpinner';
import type { AvailabilityCheckParams } from '../../types';

export default function AvailabilityChecker() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [departmentId, setDepartmentId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: departments = [] } = useDepartments();

  const params: AvailabilityCheckParams | null = submitted
    ? { date, startTime, endTime, departmentId: departmentId || undefined }
    : null;

  const { data: results, isLoading } = useAvailabilityCheck(params);

  const availableCount = results?.filter((r) => r.available).length ?? 0;
  const unavailableCount = (results?.length ?? 0) - availableCount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Check form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Search size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Check Faculty Availability</h2>
            <p className="text-xs text-gray-500">Find out who's free for a meeting</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="check-date">
              Date
            </label>
            <input
              id="check-date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => { setDate(e.target.value); setSubmitted(false); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="check-start">
              From
            </label>
            <input
              id="check-start"
              type="time"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); setSubmitted(false); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="check-end">
              To
            </label>
            <input
              id="check-end"
              type="time"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); setSubmitted(false); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="check-dept">
              Department
            </label>
            <select
              id="check-dept"
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setSubmitted(false); }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Check Availability
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" label="Checking schedules..." />
        </div>
      )}

      {results && !isLoading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <UserCheck size={18} className="text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-600">Available</p>
                <p className="text-2xl font-bold text-emerald-700 leading-tight">{availableCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <UserX size={18} className="text-red-500" />
              <div>
                <p className="text-xs text-red-500">Unavailable</p>
                <p className="text-2xl font-bold text-red-600 leading-tight">{unavailableCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Clock size={18} className="text-blue-500" />
              <div>
                <p className="text-xs text-blue-500">Time slot</p>
                <p className="text-sm font-semibold text-blue-700 leading-tight">
                  {format(new Date(`${date}T${startTime}`), 'h:mm a')} – {format(new Date(`${date}T${endTime}`), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Faculty list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results
              .sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1))
              .map(({ faculty, available, conflictingEvents }) => (
                <div
                  key={faculty.id}
                  className={`bg-white rounded-xl border-2 p-4 ${
                    available ? 'border-emerald-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${available ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                      {faculty.name.split(' ').filter((p) => p.length > 1).slice(0, 2).map((p) => p[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{faculty.name}</p>
                      <p className="text-xs text-gray-500">{faculty.designation}</p>
                      <p className="text-xs text-blue-600 font-medium">{faculty.department.code}</p>
                    </div>
                    <AvailabilityBadge
                      status={available ? 'available' : faculty.availability.status}
                      size="sm"
                    />
                  </div>
                  {!available && conflictingEvents.length > 0 && (
                    <div className="mt-2 pl-13">
                      {conflictingEvents.map((ev) => (
                        <p key={ev.id} className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {ev.isPrivate ? 'Private event' : (ev.subject ?? 'Busy')}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
