import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// GET /api/availability?date=2026-05-08&startTime=10:00&endTime=11:00&departmentId=d1
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startTime, endTime, departmentId } = req.query as Record<string, string>;

    // In production: query CalendarEvent cache for each faculty in the time window
    // and resolve availability using resolveAvailability()
    // For now: return a representative mock response
    const mockResults = [
      { facultyId: 'f1', available: true, conflictingEvents: [] },
      { facultyId: 'f2', available: false, conflictingEvents: [{ id: 'e1', subject: 'Department Meeting', startTime: `${date}T${startTime}`, endTime: `${date}T${endTime}`, showAs: 'busy', isPrivate: false }] },
      { facultyId: 'f5', available: true, conflictingEvents: [] },
    ];

    res.json({
      success: true,
      data: mockResults,
      meta: { date, startTime, endTime, departmentId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
