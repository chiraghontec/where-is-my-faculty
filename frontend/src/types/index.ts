// ─── Availability ────────────────────────────────────────────────────────────

export type AvailabilityStatus =
  | 'available'
  | 'in_meeting'
  | 'busy'
  | 'on_leave'
  | 'out_of_office'
  | 'offline'
  | 'unknown';

export interface AvailabilityInfo {
  status: AvailabilityStatus;
  statusLabel: string;
  freeUntil?: string;       // ISO datetime
  busyUntil?: string;       // ISO datetime
  currentEvent?: CalendarEventSummary | null;
  nextEvent?: CalendarEventSummary | null;
  leaveType?: LeaveType;
}

// ─── Department ───────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  code: string;
}

// ─── Faculty ──────────────────────────────────────────────────────────────────

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: Department;
  designation: string;
  phone?: string;
  officeLocation: string;
  avatarUrl?: string;
  workingHoursStart: string;   // "09:00"
  workingHoursEnd: string;     // "17:00"
  isActive: boolean;
  availability: AvailabilityInfo;
  lastSynced: string;          // ISO datetime
}

export interface FacultyDetail extends Faculty {
  weekSchedule: DaySchedule[];
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type ShowAs = 'free' | 'tentative' | 'busy' | 'out_of_office' | 'working_elsewhere';

export interface CalendarEventSummary {
  id: string;
  subject: string | null;
  startTime: string;
  endTime: string;
  location?: string;
  isPrivate: boolean;
  showAs: ShowAs;
}

export interface DaySchedule {
  date: string;               // ISO date "2026-05-08"
  dayLabel: string;           // "Monday"
  events: CalendarEventSummary[];
  isWorkingDay: boolean;
}

// ─── Leaves ───────────────────────────────────────────────────────────────────

export type LeaveType = 'casual' | 'earned' | 'medical' | 'conference' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Leave {
  id: string;
  facultyId: string;
  facultyName: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  reason?: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface LeaveFormData {
  facultyId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  reason?: string;
}

// ─── Availability Checker ─────────────────────────────────────────────────────

export interface AvailabilityCheckParams {
  date: string;
  startTime: string;
  endTime: string;
  departmentId?: string;
}

export interface AvailabilityCheckResult {
  faculty: Faculty;
  available: boolean;
  conflictingEvents: CalendarEventSummary[];
}

// ─── API Wrappers ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    lastSynced?: string;
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface FacultyFilters {
  search?: string;
  departmentId?: string;
  status?: AvailabilityStatus[];
  sortBy?: 'name' | 'department' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncStatus {
  facultyId: string;
  facultyName: string;
  lastSynced: string;
  status: 'success' | 'partial' | 'failed';
  eventsFetched: number;
}
