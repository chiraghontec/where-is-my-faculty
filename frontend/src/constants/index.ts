import type { AvailabilityStatus, LeaveType } from '../types';

export const STATUS_CONFIG: Record<
  AvailabilityStatus,
  { label: string; color: string; bg: string; dot: string; border: string }
> = {
  available: {
    label: 'Available',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  in_meeting: {
    label: 'In Meeting',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  busy: {
    label: 'Busy',
    color: 'text-red-700',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
  on_leave: {
    label: 'On Leave',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    dot: 'bg-violet-500',
    border: 'border-violet-200',
  },
  out_of_office: {
    label: 'Out of Office',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
    border: 'border-purple-200',
  },
  offline: {
    label: 'Offline',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
  },
  unknown: {
    label: 'Unknown',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    dot: 'bg-blue-400',
    border: 'border-blue-200',
  },
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: 'Casual Leave',
  earned: 'Earned Leave',
  medical: 'Medical Leave',
  conference: 'Conference / Workshop',
  other: 'Other',
};

export const LEAVE_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-50' },
};

export const REFETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const STALE_TIME_MS = 4 * 60 * 1000;        // 4 minutes

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
