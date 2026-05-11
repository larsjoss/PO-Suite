import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { prisma } from '../shared/prisma';

vi.mock('bcrypt');
import bcrypt from 'bcrypt';

import authRouter from './auth';

// Hilfsfunktion: minimale Express-App mit Auth-Router und generischem Fehlerhandler
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  // Generischer Fehlerhandler, damit unbehandelte Promise-Fehler als 500 zurückkommen
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}

// Testnutzer entsprechend dem Prisma-Schema (User-Modell)
const fakeUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  createdAt: new Date(),
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // JWT_SECRET für die meisten Tests setzen
    process.env.JWT_SECRET = 'test-secret-fuer-vitest';
  });

  describe('Eingabevalidierung', () => {
    it('gibt 400 zurück, wenn E-Mail und Passwort fehlen', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'E-Mail und Passwort sind erforderlich' });
    });

    it('gibt 400 zurück, wenn die E-Mail fehlt', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'geheimesPasswort' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'E-Mail und Passwort sind erforderlich' });
    });

    it('gibt 400 zurück, wenn das Passwort fehlt', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'E-Mail und Passwort sind erforderlich' });
    });

    it('gibt 400 zurück, wenn die E-Mail kein gültiges Format hat', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'keine-gueltige-email', password: 'passwort123' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'E-Mail und Passwort sind erforderlich' });
    });

    it('gibt 400 zurück, wenn das Passwort ein leerer String ist', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'E-Mail und Passwort sind erforderlich' });
    });
  });

  describe('Authentifizierungsfehler', () => {
    it('gibt 401 zurück, wenn der Nutzer nicht gefunden wird', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unbekannt@example.com', password: 'passwort123' });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: 'Ungültige E-Mail-Adresse oder Passwort' });
    });

    it('gibt 401 zurück, wenn das Passwort falsch ist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'falschesPasswort' });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: 'Ungültige E-Mail-Adresse oder Passwort' });
    });

    it('unterscheidet nicht zwischen unbekanntem Nutzer und falschem Passwort (gleiche Fehlermeldung)', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const app = createApp();
      const responseUnbekannt = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unbekannt@example.com', password: 'passwort123' });

      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const responseFalschesPasswort = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'falschesPasswort' });

      expect(responseUnbekannt.body.error).toBe(responseFalschesPasswort.body.error);
    });
  });

  describe('Serverkonfigurationsfehler', () => {
    it('gibt 500 zurück, wenn JWT_SECRET nicht gesetzt ist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'richtigesPasswort' });

      process.env.JWT_SECRET = originalSecret;

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: 'Server-Konfigurationsfehler' });
    });
  });

  describe('Erfolgreiche Anmeldung', () => {
    it('gibt 200 mit token und user zurück, wenn die Anmeldedaten korrekt sind', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'richtigesPasswort' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    it('gibt das user-Objekt ohne passwordHash zurück', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'richtigesPasswort' });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: fakeUser.id,
        email: fakeUser.email,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('gibt einen gültigen JWT zurück, der userId und email enthält', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'richtigesPasswort' });

      expect(response.status).toBe(200);

      // JWT besteht aus drei Base64url-Teilen getrennt durch Punkte
      const parts = response.body.token.split('.');
      expect(parts).toHaveLength(3);

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      expect(payload.userId).toBe(fakeUser.id);
      expect(payload.email).toBe(fakeUser.email);
    });

    it('ruft prisma.user.findUnique mit der korrekten E-Mail auf', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const app = createApp();

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'richtigesPasswort' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('ruft bcrypt.compare mit dem übergebenen Passwort und dem gespeicherten Hash auf', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(fakeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const app = createApp();

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'richtigesPasswort' });

      expect(bcrypt.compare).toHaveBeenCalledWith('richtigesPasswort', fakeUser.passwordHash);
    });
  });
});
