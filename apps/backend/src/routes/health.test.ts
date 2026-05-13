import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { prisma } from '../shared/prisma';

// Routers werden nach dem Setup-Mock importiert, damit der prisma-Mock greift
import healthRouter from './health';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/health', healthRouter);
  return app;
}

describe('GET /health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Standardmässig: Datenbankabfrage erfolgreich
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
  });

  it('gibt 200 mit status ok und db ok zurück, wenn die Datenbankabfrage erfolgreich ist', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      db: 'ok',
    });
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('gibt 503 mit status degraded und db error zurück, wenn die Datenbankabfrage fehlschlägt', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Datenbankverbindung fehlgeschlagen'));

    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'degraded',
      db: 'error',
    });
  });

  it('enthält keinen Stack-Trace oder interne Fehlerdetails in der Fehlerantwort', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Interner Datenbankfehler'));

    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain('stack');
    expect(JSON.stringify(response.body)).not.toContain('Interner Datenbankfehler');
  });

  it('gibt uptime als Ganzzahl zurück', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(Number.isInteger(response.body.uptime)).toBe(true);
  });
});
