import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { resolveAvailability } from '../utils/availability';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ─── In-memory data store (development / no-DB mode) ─────────────────────────
// In production this is replaced by Prisma queries.

const DEPARTMENTS = [
  { id: 'd1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'd2', name: 'Mathematics', code: 'MATH' },
  { id: 'd3', name: 'Physics', code: 'PHY' },
  { id: 'd4', name: 'Electronics & Communication', code: 'ECE' },
  { id: 'd5', name: 'Mechanical Engineering', code: 'MECH' },
];

const FACULTY_STORE = [
  { id: 'f1', name: 'Dr. Priya Sharma', email: 'p.sharma@university.edu', departmentId: 'd1', designation: 'Associate Professor', officeLocation: 'Block A, Room 201', workingHoursStart: '09:00', workingHoursEnd: '17:30', isActive: true },
  { id: 'f2', name: 'Prof. Rajesh Kumar', email: 'r.kumar@university.edu', departmentId: 'd2', designation: 'Professor', officeLocation: 'Block B, Room 105', workingHoursStart: '09:00', workingHoursEnd: '17:30', isActive: true },
  { id: 'f3', name: 'Dr. Anita Desai', email: 'a.desai@university.edu', departmentId: 'd1', designation: 'Assistant Professor', officeLocation: 'Block A, Room 315', workingHoursStart: '09:00', workingHoursEnd: '17:30', isActive: true },
  { id: 'f4', name: 'Prof. Suresh Mehta', email: 's.mehta@university.edu', departmentId: 'd4', designation: 'Professor & HOD', officeLocation: 'ECE Block, Room 401', workingHoursStart: '09:00', workingHoursEnd: '17:30', isActive: true },
  { id: 'f5', name: 'Dr. Kavitha Nair', email: 'k.nair@university.edu', departmentId: 'd5', designation: 'Associate Professor', officeLocation: 'MECH Block, Room 202', workingHoursStart: '09:00', workingHoursEnd: '17:30', isActive: true },
];

function getDept(id: string) {
  return DEPARTMENTS.find((d) => d.id === id);
}

function buildAvailability(facultyId: string) {
  const statuses: Record<string, string> = { f1: 'available', f2: 'in_meeting', f3: 'busy', f4: 'on_leave', f5: 'available' };
  const status = (statuses[facultyId] ?? 'unknown') as 'available' | 'in_meeting' | 'busy' | 'on_leave' | 'unknown';
  const labels: Record<string, string> = { available: 'Available', in_meeting: 'In Meeting', busy: 'Busy', on_leave: 'On Leave', unknown: 'Unknown' };
  return { status, statusLabel: labels[status] };
}

// GET /api/faculty
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, departmentId, status } = req.query as Record<string, string>;

    let data = FACULTY_STORE.filter((f) => f.isActive);

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((f) => f.name.toLowerCase().includes(q) || getDept(f.departmentId)?.name.toLowerCase().includes(q));
    }
    if (departmentId) {
      data = data.filter((f) => f.departmentId === departmentId);
    }

    const result = data.map((f) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      department: getDept(f.departmentId),
      designation: f.designation,
      officeLocation: f.officeLocation,
      workingHoursStart: f.workingHoursStart,
      workingHoursEnd: f.workingHoursEnd,
      isActive: f.isActive,
      availability: buildAvailability(f.id),
      lastSynced: new Date().toISOString(),
    }));

    const statusFilter = status?.split(',').filter(Boolean);
    const filtered = statusFilter?.length
      ? result.filter((r) => statusFilter.includes(r.availability.status))
      : result;

    res.json({
      success: true,
      data: filtered,
      meta: { total: filtered.length, lastSynced: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/faculty/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faculty = FACULTY_STORE.find((f) => f.id === req.params.id);
    if (!faculty) throw new AppError(404, 'FACULTY_NOT_FOUND', 'Faculty member not found');

    res.json({
      success: true,
      data: {
        ...faculty,
        department: getDept(faculty.departmentId),
        availability: buildAvailability(faculty.id),
        lastSynced: new Date().toISOString(),
        weekSchedule: [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/faculty
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, departmentId, designation, officeLocation } = req.body;
    if (!name || !email || !departmentId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'name, email, and departmentId are required');
    }
    const newFaculty = {
      id: `f${Date.now()}`,
      name,
      email,
      departmentId,
      designation: designation ?? '',
      officeLocation: officeLocation ?? '',
      workingHoursStart: '09:00',
      workingHoursEnd: '17:30',
      isActive: true,
    };
    FACULTY_STORE.push(newFaculty);
    res.status(201).json({ success: true, data: { ...newFaculty, department: getDept(departmentId), availability: buildAvailability(newFaculty.id), lastSynced: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/faculty/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idx = FACULTY_STORE.findIndex((f) => f.id === req.params.id);
    if (idx === -1) throw new AppError(404, 'FACULTY_NOT_FOUND', 'Faculty member not found');
    const allowed = ['name', 'email', 'departmentId', 'designation', 'officeLocation', 'workingHoursStart', 'workingHoursEnd', 'isActive'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) (FACULTY_STORE[idx] as Record<string, unknown>)[k] = req.body[k]; });
    const f = FACULTY_STORE[idx];
    res.json({ success: true, data: { ...f, department: getDept(f.departmentId), availability: buildAvailability(f.id), lastSynced: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

export default router;
