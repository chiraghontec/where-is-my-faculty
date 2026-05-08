import {
  addDays,
  format,
  setHours,
  setMinutes,
  startOfDay,
  addHours,
} from 'date-fns';
import type {
  Faculty,
  FacultyDetail,
  Department,
  Leave,
  AvailabilityStatus,
  CalendarEventSummary,
  DaySchedule,
} from '../types';

// ─── Departments ──────────────────────────────────────────────────────────────

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'd2', name: 'Mathematics', code: 'MATH' },
  { id: 'd3', name: 'Physics', code: 'PHY' },
  { id: 'd4', name: 'Electronics & Communication', code: 'ECE' },
  { id: 'd5', name: 'Mechanical Engineering', code: 'MECH' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoAt(date: Date, hours: number, minutes = 0): string {
  return setMinutes(setHours(date, hours), minutes).toISOString();
}

function makeEvent(
  id: string,
  subject: string | null,
  start: string,
  end: string,
  showAs: CalendarEventSummary['showAs'] = 'busy',
  isPrivate = false,
  location = ''
): CalendarEventSummary {
  return { id, subject, startTime: start, endTime: end, showAs, isPrivate, location };
}

// ─── Faculty ──────────────────────────────────────────────────────────────────

const now = new Date();

function generateWeekSchedule(facultyId: string): DaySchedule[] {
  const today = startOfDay(now);
  const days: DaySchedule[] = [];

  for (let i = 0; i < 5; i++) {
    const day = addDays(today, i - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayName = format(day, 'EEEE');

    const events: CalendarEventSummary[] = [];

    // Sprinkle different events per faculty for realism
    if (i === 0) {
      if (facultyId === 'f1') {
        events.push(makeEvent('e1', 'B.Tech Lecture — Data Structures', isoAt(day, 9), isoAt(day, 10), 'busy', false, 'LT-3'));
        events.push(makeEvent('e2', 'Project Review', isoAt(day, 14), isoAt(day, 15), 'busy', false, 'Room 201'));
      }
      if (facultyId === 'f2') {
        events.push(makeEvent('e3', 'Differential Equations Tutorial', isoAt(day, 10), isoAt(day, 11), 'busy', false, 'LT-1'));
        events.push(makeEvent('e4', 'Department Meeting', isoAt(day, 15), isoAt(day, 16), 'busy', false, 'Conference Room'));
      }
      if (facultyId === 'f3') {
        events.push(makeEvent('e5', null, isoAt(day, 11), isoAt(day, 12), 'busy', true));
      }
    }

    if (i === 1) {
      if (facultyId === 'f4') {
        events.push(makeEvent('e6', 'Signal Processing Lab', isoAt(day, 8, 30), isoAt(day, 10, 30), 'busy', false, 'Lab 4'));
      }
      if (facultyId === 'f5') {
        events.push(makeEvent('e7', 'Thermodynamics Lecture', isoAt(day, 9), isoAt(day, 10), 'busy', false, 'LT-2'));
        events.push(makeEvent('e8', '1-on-1 Mentoring', isoAt(day, 11), isoAt(day, 11, 30), 'tentative', false, 'Office'));
      }
    }

    if (i === 2) {
      if (facultyId === 'f1') {
        events.push(makeEvent('e9', 'PhD Thesis Review', isoAt(day, 10), isoAt(day, 12), 'busy', false, 'Board Room'));
      }
      if (facultyId === 'f6') {
        events.push(makeEvent('e10', 'Research Sync', isoAt(day, 14), isoAt(day, 15), 'busy'));
      }
    }

    days.push({ date: dateStr, dayLabel: dayName, events, isWorkingDay: true });
  }

  return days;
}

function resolveStatus(facultyId: string): { status: AvailabilityStatus; info: Faculty['availability'] } {
  const statuses: Record<string, AvailabilityStatus> = {
    f1: 'available',
    f2: 'in_meeting',
    f3: 'busy',
    f4: 'on_leave',
    f5: 'available',
    f6: 'in_meeting',
    f7: 'offline',
    f8: 'available',
    f9: 'out_of_office',
    f10: 'busy',
  };
  const status = statuses[facultyId] ?? 'unknown';
  const nextHour = addHours(now, 1).toISOString();
  const nextTwo = addHours(now, 2).toISOString();

  const info: Faculty['availability'] = {
    status,
    statusLabel:
      status === 'available' ? 'Available'
      : status === 'in_meeting' ? 'In Meeting'
      : status === 'busy' ? 'Busy'
      : status === 'on_leave' ? 'On Leave'
      : status === 'out_of_office' ? 'Out of Office'
      : status === 'offline' ? 'Offline'
      : 'Unknown',
    freeUntil: status === 'available' ? nextHour : undefined,
    busyUntil: status === 'busy' || status === 'in_meeting' ? nextHour : undefined,
    currentEvent:
      status === 'in_meeting'
        ? { id: 'curr1', subject: 'Department Meeting', startTime: now.toISOString(), endTime: nextHour, showAs: 'busy', isPrivate: false, location: 'Conference Room' }
        : status === 'busy'
        ? { id: 'curr2', subject: null, startTime: now.toISOString(), endTime: nextHour, showAs: 'busy', isPrivate: true }
        : null,
    nextEvent:
      status === 'available'
        ? { id: 'next1', subject: 'Lecture — Algorithms', startTime: nextHour, endTime: nextTwo, showAs: 'busy', isPrivate: false, location: 'LT-3' }
        : undefined,
    leaveType: status === 'on_leave' ? 'medical' : undefined,
  };

  return { status, info };
}

const FACULTY_RAW = [
  { id: 'f1', name: 'Dr. Priya Sharma', dept: 'd1', designation: 'Associate Professor', phone: '+91-9876543210', office: 'Block A, Room 201', avatar: '' },
  { id: 'f2', name: 'Prof. Rajesh Kumar', dept: 'd2', designation: 'Professor', phone: '+91-9123456789', office: 'Block B, Room 105', avatar: '' },
  { id: 'f3', name: 'Dr. Anita Desai', dept: 'd1', designation: 'Assistant Professor', phone: '+91-9988776655', office: 'Block A, Room 315', avatar: '' },
  { id: 'f4', name: 'Prof. Suresh Mehta', dept: 'd4', designation: 'Professor & HOD', phone: '+91-9871234560', office: 'ECE Block, Room 401', avatar: '' },
  { id: 'f5', name: 'Dr. Kavitha Nair', dept: 'd5', designation: 'Associate Professor', phone: '+91-9654321098', office: 'MECH Block, Room 202', avatar: '' },
  { id: 'f6', name: 'Dr. Arjun Patel', dept: 'd3', designation: 'Assistant Professor', phone: '+91-9012345678', office: 'Science Block, Room 110', avatar: '' },
  { id: 'f7', name: 'Prof. Sunita Rao', dept: 'd2', designation: 'Professor', phone: '', office: 'Block B, Room 108', avatar: '' },
  { id: 'f8', name: 'Dr. Vikram Singh', dept: 'd1', designation: 'Assistant Professor', phone: '+91-9345678901', office: 'Block A, Room 220', avatar: '' },
  { id: 'f9', name: 'Dr. Lakshmi Krishnan', dept: 'd4', designation: 'Associate Professor', phone: '+91-9456789012', office: 'ECE Block, Room 305', avatar: '' },
  { id: 'f10', name: 'Prof. Mohan Iyer', dept: 'd5', designation: 'Professor & HOD', phone: '+91-9567890123', office: 'MECH Block, Room 401', avatar: '' },
];

export const MOCK_FACULTY: Faculty[] = FACULTY_RAW.map((r) => {
  const dept = MOCK_DEPARTMENTS.find((d) => d.id === r.dept)!;
  const { info } = resolveStatus(r.id);
  return {
    id: r.id,
    name: r.name,
    email: `${r.name.toLowerCase().replace(/[^a-z]/g, '.').replace(/\.+/g, '.')}@university.edu`,
    department: dept,
    designation: r.designation,
    phone: r.phone || undefined,
    officeLocation: r.office,
    avatarUrl: r.avatar || undefined,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:30',
    isActive: true,
    availability: info,
    lastSynced: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
  };
});

export const MOCK_FACULTY_DETAIL: Record<string, FacultyDetail> = Object.fromEntries(
  MOCK_FACULTY.map((f) => [
    f.id,
    {
      ...f,
      weekSchedule: generateWeekSchedule(f.id),
    },
  ])
);

// ─── Leaves ───────────────────────────────────────────────────────────────────

export const MOCK_LEAVES: Leave[] = [
  {
    id: 'l1',
    facultyId: 'f4',
    facultyName: 'Prof. Suresh Mehta',
    departmentName: 'Electronics & Communication',
    leaveType: 'medical',
    startDate: format(now, 'yyyy-MM-dd'),
    endDate: format(addDays(now, 3), 'yyyy-MM-dd'),
    isHalfDay: false,
    reason: 'Medical procedure and recovery',
    status: 'approved',
    submittedAt: addDays(now, -2).toISOString(),
    reviewedBy: 'Admin',
    reviewedAt: addDays(now, -1).toISOString(),
  },
  {
    id: 'l2',
    facultyId: 'f9',
    facultyName: 'Dr. Lakshmi Krishnan',
    departmentName: 'Electronics & Communication',
    leaveType: 'conference',
    startDate: format(now, 'yyyy-MM-dd'),
    endDate: format(addDays(now, 2), 'yyyy-MM-dd'),
    isHalfDay: false,
    reason: 'Presenting paper at IEEE ICSE 2026',
    status: 'approved',
    submittedAt: addDays(now, -5).toISOString(),
    reviewedBy: 'Admin',
    reviewedAt: addDays(now, -4).toISOString(),
  },
  {
    id: 'l3',
    facultyId: 'f2',
    facultyName: 'Prof. Rajesh Kumar',
    departmentName: 'Mathematics',
    leaveType: 'casual',
    startDate: format(addDays(now, 3), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 3), 'yyyy-MM-dd'),
    isHalfDay: true,
    halfDayPeriod: 'afternoon',
    reason: '',
    status: 'pending',
    submittedAt: now.toISOString(),
  },
  {
    id: 'l4',
    facultyId: 'f7',
    facultyName: 'Prof. Sunita Rao',
    departmentName: 'Mathematics',
    leaveType: 'earned',
    startDate: format(addDays(now, 7), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 14), 'yyyy-MM-dd'),
    isHalfDay: false,
    reason: 'Family vacation',
    status: 'pending',
    submittedAt: now.toISOString(),
  },
];
