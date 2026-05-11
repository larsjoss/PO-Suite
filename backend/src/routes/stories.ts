import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../shared/prisma';
import { internalError } from '../shared/errors';

const router = Router();

router.use(authenticate);

// GET /api/stories?q=
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const userId = req.user!.userId;

  const where = {
    userId,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { rawInput: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  try {
    const stories = await prisma.story.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        rawInput: true,
        generatedStory: true,
        refinementHints: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ stories, total: stories.length });
  } catch (err) {
    res.status(500).json({ error: internalError(err) });
  }
});

// GET /api/stories/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const story = await prisma.story.findFirst({
      where: { id, userId },
    });

    if (!story) {
      res.status(404).json({ error: 'Story nicht gefunden' });
      return;
    }

    const refinements = await prisma.refinement.findMany({
      where: { storyId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ story, refinements });
  } catch (err) {
    res.status(500).json({ error: internalError(err) });
  }
});

// DELETE /api/stories/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const story = await prisma.story.findFirst({ where: { id, userId } });
    if (!story) {
      res.status(404).json({ error: 'Story nicht gefunden' });
      return;
    }

    await prisma.story.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: internalError(err) });
  }
});

// PATCH /api/stories/:id
const UpdateStoryBody = z.object({
  generatedStory: z.string().min(1),
  refinementHints: z.string(),
  title: z.string().min(1),
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const parsed = UpdateStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  try {
    const story = await prisma.story.findFirst({ where: { id, userId } });
    if (!story) {
      res.status(404).json({ error: 'Story nicht gefunden' });
      return;
    }

    const updated = await prisma.story.update({
      where: { id },
      data: {
        generatedStory: parsed.data.generatedStory,
        refinementHints: parsed.data.refinementHints,
        title: parsed.data.title,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: internalError(err) });
  }
});

export default router;
