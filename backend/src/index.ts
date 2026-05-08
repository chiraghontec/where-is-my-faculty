import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import facultyRoutes from './routes/faculty.routes';
import leaveRoutes from './routes/leave.routes';
import availabilityRoutes from './routes/availability.routes';
import departmentRoutes from './routes/department.routes';
import syncRoutes from './routes/sync.routes';

const app = express();

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'where-is-my-faculty-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/faculty', facultyRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/sync', syncRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found', statusCode: 404 },
  });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`Where Is My Faculty API running on port ${config.port}`, {
    env: config.nodeEnv,
  });
});

export default app;
