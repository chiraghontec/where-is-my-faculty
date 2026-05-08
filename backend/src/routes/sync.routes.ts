import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const router = Router();

// POST /api/sync/trigger
router.post('/trigger', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Manual sync triggered for all faculty');
    // In production: trigger CalendarSyncJob.run()
    // Simulate async sync
    await new Promise((r) => setTimeout(r, 500));
    res.json({ success: true, data: { synced: 10, message: 'Calendar sync initiated for all active faculty' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/sync/trigger/:facultyId
router.post('/trigger/:facultyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facultyId } = req.params;
    logger.info('Manual sync triggered', { facultyId });
    await new Promise((r) => setTimeout(r, 300));
    res.json({ success: true, data: { synced: 1, facultyId, message: 'Calendar sync complete' } });
  } catch (err) {
    next(err);
  }
});

// GET /api/sync/status
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        syncIntervalMinutes: 5,
        activeFaculty: 10,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
