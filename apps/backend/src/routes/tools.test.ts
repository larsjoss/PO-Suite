import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../shared/prisma';

vi.mock('../services/claude', () => ({
  generateStory: vi.fn(),
  refineStoryWithHints: vi.fn(),
  refineStory: vi.fn(),
  extractTitle: vi.fn().mockReturnValue('Test-Titel'),
}));
vi.mock('../services/textPolisher', () => ({ polishText: vi.fn() }));
vi.mock('../services/testCaseGenerator', () => ({ generateTestCases: vi.fn() }));
vi.mock('../services/docGenerator', () => ({ generateDoc: vi.fn() }));
vi.mock('../services/goalGenerator', () => ({
  generateGoals: vi.fn(),
  refineGoal: vi.fn(),
}));

import { generateStory, refineStoryWithHints, refineStory } from '../services/claude';
import { polishText } from '../services/textPolisher';
import { generateTestCases } from '../services/testCaseGenerator';
import { generateDoc } from '../services/docGenerator';
import { generateGoals, refineGoal } from '../services/goalGenerator';

import toolsRouter from './tools';

function createApp() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use('/api/tools', toolsRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Interner Serverfehler' });
  });

  return app;
}

function authHeader(userId = 'u1'): string {
  const token = jwt.sign({ userId, email: `${userId}@test.com` }, 'test-secret');
  return `Bearer ${token}`;
}

const fakeStoryRecord = {
  id: 'story-1',
  userId: 'u1',
  title: 'Test-Titel',
  rawInput: 'Eingabe',
  generatedStory: 'Generierte Story',
  refinementHints: 'Hinweise',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Tools-Routen', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/tools/story/generate', () => {
    it('liefert 401 ohne JWT', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/generate')
        .send({ rawInput: 'Eingabe' });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: 'Nicht authentifiziert' });
    });

    it('liefert 400 ohne rawInput', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/generate')
        .set('Authorization', authHeader('userA'))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'rawInput ist erforderlich' });
    });

    it('liefert 201 mit gespeicherter Story bei Erfolg', async () => {
      vi.mocked(generateStory).mockResolvedValue({
        generatedStory: 'Story-Text',
        refinementHints: 'Hint-Text',
      } as never);
      vi.mocked(prisma.story.create).mockResolvedValue(fakeStoryRecord as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/generate')
        .set('Authorization', authHeader('userB'))
        .send({ rawInput: 'Eingabetext' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ id: 'story-1', title: 'Test-Titel' });
      expect(prisma.story.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'userB',
          rawInput: 'Eingabetext',
          generatedStory: 'Story-Text',
          refinementHints: 'Hint-Text',
        }),
      });
    });

    it('liefert 500 wenn der Service wirft', async () => {
      vi.mocked(generateStory).mockRejectedValue(new Error('Anthropic-Fehler'));

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/generate')
        .set('Authorization', authHeader('userC'))
        .send({ rawInput: 'Eingabetext' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/tools/story/refine-hints', () => {
    it('liefert 400 bei invalidem Body', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/refine-hints')
        .set('Authorization', authHeader('userD'))
        .send({ currentStory: '' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 200 bei gültigem Body', async () => {
      vi.mocked(refineStoryWithHints).mockResolvedValue({
        generatedStory: 'Verfeinert',
        refinementHints: 'NeueHints',
      } as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/refine-hints')
        .set('Authorization', authHeader('userE'))
        .send({
          currentStory: 'Story',
          hintAnswers: [{ hint: 'h', answer: 'a' }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ generatedStory: 'Verfeinert' });
    });
  });

  describe('POST /api/tools/story/refine', () => {
    it('liefert 400 bei fehlendem conversationHistory', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/refine')
        .set('Authorization', authHeader('userF'))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 200 bei gültigem conversationHistory', async () => {
      vi.mocked(refineStory).mockResolvedValue({
        generatedStory: 'Refined',
        refinementHints: 'Hints',
      } as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/story/refine')
        .set('Authorization', authHeader('userG'))
        .send({
          conversationHistory: [{ role: 'user', content: 'Hallo' }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ generatedStory: 'Refined' });
    });
  });

  describe('POST /api/tools/text-polisher/polish', () => {
    it('liefert 400 bei invalidem useCase', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/text-polisher/polish')
        .set('Authorization', authHeader('userH'))
        .send({ input: 'Text', useCase: 'ungueltig' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 400 bei fehlendem input', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/text-polisher/polish')
        .set('Authorization', authHeader('userI'))
        .send({ useCase: 'email' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 200 mit result bei Erfolg', async () => {
      vi.mocked(polishText).mockResolvedValue('Geschliffener Text' as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/text-polisher/polish')
        .set('Authorization', authHeader('userJ'))
        .send({ input: 'Roher Text', useCase: 'email', tone: 'formell' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ result: 'Geschliffener Text' });
      expect(polishText).toHaveBeenCalledWith('Roher Text', 'email', 'formell');
    });
  });

  describe('POST /api/tools/test-case-generator/generate', () => {
    it('liefert 400 ohne storyText', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/test-case-generator/generate')
        .set('Authorization', authHeader('userK'))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'storyText ist erforderlich' });
    });

    it('liefert 200 bei minimal-validem Body', async () => {
      vi.mocked(generateTestCases).mockResolvedValue({ testCases: [] } as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/test-case-generator/generate')
        .set('Authorization', authHeader('userL'))
        .send({ storyText: 'Eine Story' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ testCases: [] });
    });
  });

  describe('POST /api/tools/doc-generator/generate', () => {
    it('liefert 400 wenn mode nicht in der discriminated union ist', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/doc-generator/generate')
        .set('Authorization', authHeader('userM'))
        .send({ mode: 'unknown', input: {} });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 200 bei mode=story mit gültigem Input', async () => {
      vi.mocked(generateDoc).mockResolvedValue('Doc-Text' as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/doc-generator/generate')
        .set('Authorization', authHeader('userN'))
        .send({
          mode: 'story',
          input: {
            title: 'Titel',
            description: 'Beschreibung',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ result: 'Doc-Text' });
    });

    it('liefert 200 bei mode=feature mit gültigem Input', async () => {
      vi.mocked(generateDoc).mockResolvedValue('Feature-Doc' as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/doc-generator/generate')
        .set('Authorization', authHeader('userO'))
        .send({
          mode: 'feature',
          input: {
            title: 'Titel',
            description: 'Beschreibung',
            stories: 'Story-Liste',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ result: 'Feature-Doc' });
    });
  });

  describe('POST /api/tools/goal-generator/generate', () => {
    it('liefert 400 bei invalidem mode', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/goal-generator/generate')
        .set('Authorization', authHeader('userP'))
        .send({ mode: 'unknown' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 200 bei mode=sprint-goal', async () => {
      vi.mocked(generateGoals).mockResolvedValue({ variants: [] } as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/goal-generator/generate')
        .set('Authorization', authHeader('userQ'))
        .send({
          mode: 'sprint-goal',
          input: { idea: 'Eine Idee' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ variants: [] });
    });

    it('liefert 200 bei mode=pi-objective', async () => {
      vi.mocked(generateGoals).mockResolvedValue({ objective: 'PI' } as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/goal-generator/generate')
        .set('Authorization', authHeader('userR'))
        .send({
          mode: 'pi-objective',
          input: {
            featureTitle: 'Feature',
            featureDescription: 'Beschreibung',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ objective: 'PI' });
    });
  });

  describe('POST /api/tools/goal-generator/refine', () => {
    it('liefert 400 bei invalidem Body', async () => {
      const app = createApp();

      const response = await request(app)
        .post('/api/tools/goal-generator/refine')
        .set('Authorization', authHeader('userS'))
        .send({ mode: 'sprint-goal' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: 'Ungültige Anfragedaten' });
    });

    it('liefert 200 bei gültigem Body', async () => {
      vi.mocked(refineGoal).mockResolvedValue({ variants: ['v'] } as never);

      const app = createApp();

      const response = await request(app)
        .post('/api/tools/goal-generator/refine')
        .set('Authorization', authHeader('userT'))
        .send({
          mode: 'sprint-goal',
          input: { idea: 'Idee' },
          rawInitialResponse: 'raw',
          selectedVariantText: 'gewählt',
          refinementHint: 'Hinweis',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ variants: ['v'] });
    });
  });

  describe('Rate-Limit', () => {
    it('liefert 429 beim 21. Aufruf innerhalb einer Minute', async () => {
      vi.mocked(polishText).mockResolvedValue('OK' as never);

      const app = createApp();
      const header = authHeader('rateLimitUser');

      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .post('/api/tools/text-polisher/polish')
          .set('Authorization', header)
          .send({ input: 'Text', useCase: 'email' });
        expect(response.status).toBe(200);
      }

      const response = await request(app)
        .post('/api/tools/text-polisher/polish')
        .set('Authorization', header)
        .send({ input: 'Text', useCase: 'email' });

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    });
  });
});
