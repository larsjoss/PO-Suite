import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../shared/prisma';

import storiesRouter from './stories';

function createApp() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use('/api/stories', storiesRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}

function authHeader(): string {
  const token = jwt.sign({ userId: 'u1', email: 'u1@test.com' }, 'test-secret');
  return `Bearer ${token}`;
}

const fakeStory = {
  id: 'story-1',
  userId: 'u1',
  title: 'Beispiel-Story',
  rawInput: 'Eingabe',
  generatedStory: 'Generierte Story',
  refinementHints: 'Hinweise',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Stories-Routen', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/stories', () => {
    it('liefert 401 ohne Authorization-Header', async () => {
      const app = createApp();

      const response = await request(app).get('/api/stories');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: 'Nicht authentifiziert' });
    });

    it('liefert 200 mit stories und total bei valider Auth', async () => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([fakeStory] as never);

      const app = createApp();

      const response = await request(app)
        .get('/api/stories')
        .set('Authorization', authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stories');
      expect(response.body).toHaveProperty('total', 1);
      expect(Array.isArray(response.body.stories)).toBe(true);
    });

    it('reicht den Query-Parameter q als Filter an prisma.story.findMany durch', async () => {
      vi.mocked(prisma.story.findMany).mockResolvedValue([] as never);

      const app = createApp();

      await request(app)
        .get('/api/stories?q=foo')
        .set('Authorization', authHeader());

      expect(prisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'u1',
            OR: [
              { title: { contains: 'foo', mode: 'insensitive' } },
              { rawInput: { contains: 'foo', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('liefert 500 mit internalError-Message wenn Prisma wirft', async () => {
      vi.mocked(prisma.story.findMany).mockRejectedValue(new Error('Datenbank-Crash'));

      const app = createApp();

      const response = await request(app)
        .get('/api/stories')
        .set('Authorization', authHeader());

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/stories/:id', () => {
    it('liefert 404 wenn die Story nicht existiert', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(null);

      const app = createApp();

      const response = await request(app)
        .get('/api/stories/unbekannt')
        .set('Authorization', authHeader());

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: 'Story nicht gefunden' });
    });

    it('liefert 200 mit story und refinements bei Treffer', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(fakeStory as never);
      vi.mocked(prisma.refinement.findMany).mockResolvedValue([] as never);

      const app = createApp();

      const response = await request(app)
        .get('/api/stories/story-1')
        .set('Authorization', authHeader());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('story');
      expect(response.body).toHaveProperty('refinements');
      expect(response.body.story).toMatchObject({ id: 'story-1' });
      expect(Array.isArray(response.body.refinements)).toBe(true);
    });

    it('liefert 500 wenn Prisma wirft', async () => {
      vi.mocked(prisma.story.findFirst).mockRejectedValue(new Error('Datenbank-Crash'));

      const app = createApp();

      const response = await request(app)
        .get('/api/stories/story-1')
        .set('Authorization', authHeader());

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/stories/:id', () => {
    it('liefert 404 wenn die Story nicht existiert', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(null);

      const app = createApp();

      const response = await request(app)
        .delete('/api/stories/unbekannt')
        .set('Authorization', authHeader());

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: 'Story nicht gefunden' });
      expect(prisma.story.delete).not.toHaveBeenCalled();
    });

    it('liefert 204 und ruft prisma.story.delete bei Erfolg', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(fakeStory as never);
      vi.mocked(prisma.story.delete).mockResolvedValue(fakeStory as never);

      const app = createApp();

      const response = await request(app)
        .delete('/api/stories/story-1')
        .set('Authorization', authHeader());

      expect(response.status).toBe(204);
      expect(prisma.story.delete).toHaveBeenCalledWith({ where: { id: 'story-1' } });
    });

    it('liefert 500 wenn Prisma beim Löschen wirft', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(fakeStory as never);
      vi.mocked(prisma.story.delete).mockRejectedValue(new Error('Datenbank-Crash'));

      const app = createApp();

      const response = await request(app)
        .delete('/api/stories/story-1')
        .set('Authorization', authHeader());

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PATCH /api/stories/:id', () => {
    it('liefert 400 bei fehlendem generatedStory', async () => {
      const app = createApp();

      const response = await request(app)
        .patch('/api/stories/story-1')
        .set('Authorization', authHeader())
        .send({ refinementHints: 'h', title: 't' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 400 bei leerem title', async () => {
      const app = createApp();

      const response = await request(app)
        .patch('/api/stories/story-1')
        .set('Authorization', authHeader())
        .send({ generatedStory: 'g', refinementHints: 'h', title: '' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 404 wenn die Story nicht existiert', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(null);

      const app = createApp();

      const response = await request(app)
        .patch('/api/stories/unbekannt')
        .set('Authorization', authHeader())
        .send({ generatedStory: 'g', refinementHints: 'h', title: 't' });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: 'Story nicht gefunden' });
      expect(prisma.story.update).not.toHaveBeenCalled();
    });

    it('liefert 200 mit aktualisierter Story bei Erfolg', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(fakeStory as never);
      const updated = { ...fakeStory, title: 'Neuer Titel', generatedStory: 'Neu', refinementHints: 'NeuHints' };
      vi.mocked(prisma.story.update).mockResolvedValue(updated as never);

      const app = createApp();

      const response = await request(app)
        .patch('/api/stories/story-1')
        .set('Authorization', authHeader())
        .send({ generatedStory: 'Neu', refinementHints: 'NeuHints', title: 'Neuer Titel' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: 'story-1', title: 'Neuer Titel' });
      expect(prisma.story.update).toHaveBeenCalledWith({
        where: { id: 'story-1' },
        data: {
          generatedStory: 'Neu',
          refinementHints: 'NeuHints',
          title: 'Neuer Titel',
        },
      });
    });

    it('liefert 500 wenn Prisma beim Update wirft', async () => {
      vi.mocked(prisma.story.findFirst).mockResolvedValue(fakeStory as never);
      vi.mocked(prisma.story.update).mockRejectedValue(new Error('Datenbank-Crash'));

      const app = createApp();

      const response = await request(app)
        .patch('/api/stories/story-1')
        .set('Authorization', authHeader())
        .send({ generatedStory: 'Neu', refinementHints: 'NeuHints', title: 'Neuer Titel' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
