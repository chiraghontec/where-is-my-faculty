import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import type { Leave } from '../utils/availability';

const router = Router();

const LEAVE_STORE: Array<{
  id: string;
  facultyId: string;
  facultyName: string;
  departmentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: string;
  reason?: string;
  status: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
}> = [
  {
    id: 'l1',
    facultyId: 'f4',
    facultyName: 'Prof. Suresh Mehta',
    departmentName: 'Electronics & Communication',
    leaveType: 'medical',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    isHalfDay: false,
    reason: 'Medical procedure and recovery',
    status: 'approved',
    submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    reviewedBy: 'Admin',
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// GET /api/leaves
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facultyId, status } = req.query as Record<string, string>;
    let data = [...LEAVE_STORE];
    if (facultyId) data = data.filter((l) => l.facultyId === facultyId);
    if (status) data = data.filter((l) => l.status === status);
    res.json({ success: true, data, meta: { total: data.length } });
  } catch (err) {
    next(err);
  }
});

// POST /api/leaves
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facultyId, leaveType, startDate, endDate, isHalfDay, halfDayPeriod, reason } = req.body;
    if (!facultyId || !leaveType || !startDate || !endDate) {
      throw new AppError(400, 'VALIDATION_ERROR', 'facultyId, leaveType, startDate, endDate are required');
    }
    const newLeave = {
      id: `l${Date.now()}`,
      facultyId,
      facultyName: 'Faculty Member',
      departmentName: '',
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      isHalfDay: !!isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    LEAVE_STORE.push(newLeave);
    res.status(201).json({ success: true, data: newLeave });
  } catch (err) {
    next(err);
  }
});

// PUT /api/leaves/:id/approve
router.put('/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idx = LEAVE_STORE.findIndex((l) => l.id === req.params.id);
    if (idx === -1) throw new AppError(404, 'LEAVE_NOT_FOUND', 'Leave request not found');
    if (LEAVE_STORE[idx].status !== 'pending') {
      throw new AppError(400, 'INVALID_STATE', 'Only pending leave requests can be approved');
    }
    LEAVE_STORE[idx].status = 'approved';
    LEAVE_STORE[idx].reviewedBy = 'Admin';
    LEAVE_STORE[idx].reviewedAt = new Date().toISOString();
    LEAVE_STORE[idx].adminNote = req.body.adminNote;
    res.json({ success: true, data: LEAVE_STORE[idx] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/leaves/:id/reject
router.put('/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idx = LEAVE_STORE.findIndex((l) => l.id === req.params.id);
    if (idx === -1) throw new AppError(404, 'LEAVE_NOT_FOUND', 'Leave request not found');
    if (LEAVE_STORE[idx].status !== 'pending') {
      throw new AppError(400, 'INVALID_STATE', 'Only pending leave requests can be rejected');
    }
    LEAVE_STORE[idx].status = 'rejected';
    LEAVE_STORE[idx].reviewedBy = 'Admin';
    LEAVE_STORE[idx].reviewedAt = new Date().toISOString();
    LEAVE_STORE[idx].adminNote = req.body.adminNote;
    res.json({ success: true, data: LEAVE_STORE[idx] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leaves/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idx = LEAVE_STORE.findIndex((l) => l.id === req.params.id);
    if (idx === -1) throw new AppError(404, 'LEAVE_NOT_FOUND', 'Leave request not found');
    LEAVE_STORE[idx].status = 'cancelled';
    res.json({ success: true, data: LEAVE_STORE[idx] });
  } catch (err) {
    next(err);
  }
});

export default router;
