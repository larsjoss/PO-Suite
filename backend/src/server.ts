import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { logger } from './shared/logger';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import storiesRouter from './routes/stories';
import toolsRouter from './routes/tools';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// ─── CORS ─────────────────────────────────────────────────────────────────────

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// ─── Body Parser ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: '25mb' }));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? 'error' : 'info'),
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} ${res.statusCode}`,
    redact: ['req.headers.authorization'],
  }),
);

// ─── Global Rate Limit (IP-based) ─────────────────────────────────────────────

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Zu viele Anfragen. Bitte warte eine Minute.' },
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/tools', toolsRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route nicht gefunden' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Interner Serverfehler' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'PO Suite Backend started');
});

export default app;
