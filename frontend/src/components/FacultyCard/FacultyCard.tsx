import React from 'react';
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Faculty } from '../../types';
import AvailabilityBadge from '../Common/AvailabilityBadge';
import { useFacultyStore } from '../../store/facultyStore';

interface Props {
  faculty: Faculty;
}

function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow"
      />
    );
  }
  const initials = name
    .split(' ')
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  const colours = [
    'from-blue-500 to-blue-600',
    'from-violet-500 to-violet-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ];
  const colour = colours[name.charCodeAt(0) % colours.length];
  return (
    <div
      className={`w-14 h-14 rounded-full bg-gradient-to-br ${colour} flex items-center justify-center ring-2 ring-white shadow`}
      aria-hidden="true"
    >
      <span className="text-white text-lg font-bold">{initials}</span>
    </div>
  );
}

export default function FacultyCard({ faculty }: Props) {
  const setSelectedFacultyId = useFacultyStore((s) => s.setSelectedFacultyId);
  const { availability } = faculty;

  const borderColour = {
    available: 'border-emerald-200 hover:border-emerald-400',
    in_meeting: 'border-amber-200 hover:border-amber-400',
    busy: 'border-red-200 hover:border-red-400',
    on_leave: 'border-violet-200 hover:border-violet-400',
    out_of_office: 'border-purple-200 hover:border-purple-400',
    offline: 'border-gray-200 hover:border-gray-300',
    unknown: 'border-blue-200 hover:border-blue-300',
  }[availability.status];

  function formatTime(iso: string) {
    try {
      return format(parseISO(iso), 'h:mm a');
    } catch {
      return '';
    }
  }

  function getSubline() {
    if (availability.status === 'available' && availability.nextEvent) {
      return `Free until ${formatTime(availability.nextEvent.startTime)}`;
    }
    if (availability.status === 'available') {
      return 'Free for rest of day';
    }
    if (availability.status === 'in_meeting' || availability.status === 'busy') {
      if (availability.busyUntil) return `Until ${formatTime(availability.busyUntil)}`;
      if (availability.currentEvent?.subject) return availability.currentEvent.subject;
    }
    if (availability.status === 'on_leave') {
      return 'On approved leave';
    }
    if (availability.status === 'out_of_office') {
      return 'Out of office (auto-reply on)';
    }
    if (availability.status === 'offline') {
      return 'Outside working hours';
    }
    return '';
  }

  return (
    <button
      onClick={() => setSelectedFacultyId(faculty.id)}
      className={`w-full text-left bg-white rounded-xl border-2 ${borderColour} p-4 shadow-sm hover:shadow-md transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      aria-label={`View schedule for ${faculty.name}, ${availability.statusLabel}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0">
          <Avatar name={faculty.name} url={faculty.avatarUrl} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-blue-700 transition-colors">
            {faculty.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{faculty.designation}</p>
          <p className="text-xs text-blue-600 font-medium mt-0.5 truncate">{faculty.department.code}</p>
        </div>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 mt-0.5"
          aria-hidden="true"
        />
      </div>

      {/* Status badge */}
      <div className="mb-3">
        <AvailabilityBadge status={availability.status} size="sm" showPulse />
      </div>

      {/* Subline */}
      {getSubline() && (
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <Clock size={11} aria-hidden="true" />
          {getSubline()}
        </p>
      )}

      {/* Meta */}
      <div className="space-y-1">
        <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
          <MapPin size={11} className="shrink-0" aria-hidden="true" />
          {faculty.officeLocation}
        </p>
        {faculty.phone && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Phone size={11} className="shrink-0" aria-hidden="true" />
            {faculty.phone}
          </p>
        )}
      </div>
    </button>
  );
}
