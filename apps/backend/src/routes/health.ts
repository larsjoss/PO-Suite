import { Router } from 'express';
import { prisma } from '../shared/prisma';

const router = Router();
const startTime = Date.now();

router.get('/', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    db: dbStatus,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

export default router;
