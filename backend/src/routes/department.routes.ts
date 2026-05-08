import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const DEPARTMENTS = [
  { id: 'd1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'd2', name: 'Mathematics', code: 'MATH' },
  { id: 'd3', name: 'Physics', code: 'PHY' },
  { id: 'd4', name: 'Electronics & Communication', code: 'ECE' },
  { id: 'd5', name: 'Mechanical Engineering', code: 'MECH' },
];

router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: DEPARTMENTS });
  } catch (err) {
    next(err);
  }
});

export default router;
