import axios from 'axios';
import type {
  ApiResponse,
  Faculty,
  FacultyDetail,
  FacultyFilters,
  Leave,
  LeaveFormData,
  Department,
  AvailabilityCheckParams,
  AvailabilityCheckResult,
} from '../types';
import {
  MOCK_FACULTY,
  MOCK_FACULTY_DETAIL,
  MOCK_LEAVES,
  MOCK_DEPARTMENTS,
} from './mockData';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Faculty API ─────────────────────────────────────────────────────────────

export async function getFaculty(filters?: FacultyFilters): Promise<ApiResponse<Faculty[]>> {
  if (USE_MOCK) {
    await delay(300);
    let data = [...MOCK_FACULTY];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.department.name.toLowerCase().includes(q) ||
          f.designation.toLowerCase().includes(q)
      );
    }
    if (filters?.departmentId) {
      data = data.filter((f) => f.department.id === filters.departmentId);
    }
    if (filters?.status?.length) {
      data = data.filter((f) => filters.status!.includes(f.availability.status));
    }
    if (filters?.sortBy === 'name') {
      data.sort((a, b) => a.name.localeCompare(b.name));
    }
    return {
      success: true,
      data,
      meta: { lastSynced: new Date().toISOString(), total: data.length },
    };
  }
  const res = await http.get<ApiResponse<Faculty[]>>('/faculty', { params: filters });
  return res.data;
}

export async function getFacultyById(id: string): Promise<ApiResponse<FacultyDetail>> {
  if (USE_MOCK) {
    await delay(250);
    const data = MOCK_FACULTY_DETAIL[id];
    if (!data) throw new Error('Faculty not found');
    return { success: true, data };
  }
  const res = await http.get<ApiResponse<FacultyDetail>>(`/faculty/${id}`);
  return res.data;
}

export async function createFaculty(payload: Partial<Faculty>): Promise<ApiResponse<Faculty>> {
  if (USE_MOCK) {
    await delay(400);
    const newFaculty: Faculty = {
      id: `f${Date.now()}`,
      name: payload.name ?? '',
      email: payload.email ?? '',
      department: payload.department ?? MOCK_DEPARTMENTS[0],
      designation: payload.designation ?? '',
      officeLocation: payload.officeLocation ?? '',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:30',
      isActive: true,
      availability: { status: 'unknown', statusLabel: 'Unknown' },
      lastSynced: new Date().toISOString(),
    };
    MOCK_FACULTY.push(newFaculty);
    return { success: true, data: newFaculty };
  }
  const res = await http.post<ApiResponse<Faculty>>('/faculty', payload);
  return res.data;
}

export async function updateFaculty(
  id: string,
  payload: Partial<Faculty>
): Promise<ApiResponse<Faculty>> {
  if (USE_MOCK) {
    await delay(300);
    const idx = MOCK_FACULTY.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Faculty not found');
    MOCK_FACULTY[idx] = { ...MOCK_FACULTY[idx], ...payload };
    return { success: true, data: MOCK_FACULTY[idx] };
  }
  const res = await http.put<ApiResponse<Faculty>>(`/faculty/${id}`, payload);
  return res.data;
}

// ─── Departments API ──────────────────────────────────────────────────────────

export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  if (USE_MOCK) {
    await delay(100);
    return { success: true, data: MOCK_DEPARTMENTS };
  }
  const res = await http.get<ApiResponse<Department[]>>('/departments');
  return res.data;
}

// ─── Availability API ─────────────────────────────────────────────────────────

export async function checkAvailability(
  params: AvailabilityCheckParams
): Promise<ApiResponse<AvailabilityCheckResult[]>> {
  if (USE_MOCK) {
    await delay(500);
    const results: AvailabilityCheckResult[] = MOCK_FACULTY
      .filter((f) => !params.departmentId || f.department.id === params.departmentId)
      .map((f) => ({
        faculty: f,
        available: f.availability.status === 'available',
        conflictingEvents: f.availability.currentEvent ? [f.availability.currentEvent] : [],
      }));
    return { success: true, data: results };
  }
  const res = await http.get<ApiResponse<AvailabilityCheckResult[]>>('/availability', {
    params,
  });
  return res.data;
}

// ─── Leaves API ───────────────────────────────────────────────────────────────

export async function getLeaves(
  facultyId?: string
): Promise<ApiResponse<Leave[]>> {
  if (USE_MOCK) {
    await delay(300);
    const data = facultyId
      ? MOCK_LEAVES.filter((l) => l.facultyId === facultyId)
      : MOCK_LEAVES;
    return { success: true, data, meta: { total: data.length } };
  }
  const res = await http.get<ApiResponse<Leave[]>>('/leaves', {
    params: facultyId ? { facultyId } : undefined,
  });
  return res.data;
}

export async function submitLeave(payload: LeaveFormData): Promise<ApiResponse<Leave>> {
  if (USE_MOCK) {
    await delay(400);
    const faculty = MOCK_FACULTY.find((f) => f.id === payload.facultyId);
    const newLeave: Leave = {
      id: `l${Date.now()}`,
      facultyId: payload.facultyId,
      facultyName: faculty?.name ?? 'Unknown',
      departmentName: faculty?.department.name ?? '',
      leaveType: payload.leaveType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      isHalfDay: payload.isHalfDay,
      halfDayPeriod: payload.halfDayPeriod,
      reason: payload.reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    MOCK_LEAVES.push(newLeave);
    return { success: true, data: newLeave };
  }
  const res = await http.post<ApiResponse<Leave>>('/leaves', payload);
  return res.data;
}

export async function reviewLeave(
  id: string,
  action: 'approve' | 'reject',
  adminNote?: string
): Promise<ApiResponse<Leave>> {
  if (USE_MOCK) {
    await delay(300);
    const idx = MOCK_LEAVES.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Leave not found');
    MOCK_LEAVES[idx] = {
      ...MOCK_LEAVES[idx],
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedBy: 'Admin',
      reviewedAt: new Date().toISOString(),
      adminNote,
    };
    return { success: true, data: MOCK_LEAVES[idx] };
  }
  const res = await http.put<ApiResponse<Leave>>(`/leaves/${id}/${action}`, { adminNote });
  return res.data;
}

export async function cancelLeave(id: string): Promise<ApiResponse<Leave>> {
  if (USE_MOCK) {
    await delay(300);
    const idx = MOCK_LEAVES.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Leave not found');
    MOCK_LEAVES[idx] = { ...MOCK_LEAVES[idx], status: 'cancelled' };
    return { success: true, data: MOCK_LEAVES[idx] };
  }
  const res = await http.delete<ApiResponse<Leave>>(`/leaves/${id}`);
  return res.data;
}

// ─── Sync API ─────────────────────────────────────────────────────────────────

export async function triggerSync(facultyId?: string): Promise<ApiResponse<{ synced: number }>> {
  if (USE_MOCK) {
    await delay(1500);
    return { success: true, data: { synced: facultyId ? 1 : MOCK_FACULTY.length } };
  }
  const url = facultyId ? `/sync/trigger/${facultyId}` : '/sync/trigger';
  const res = await http.post<ApiResponse<{ synced: number }>>(url);
  return res.data;
}
