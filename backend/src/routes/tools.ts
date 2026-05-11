import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { logger } from '../shared/logger';
import { prisma } from '../shared/prisma';
import { generateStory, refineStoryWithHints, refineStory, extractTitle } from '../services/claude';
import { polishText } from '../services/textPolisher';
import { generateTestCases } from '../services/testCaseGenerator';
import { generateDoc } from '../services/docGenerator';
import { generateGoals, refineGoal } from '../services/goalGenerator';
import { internalError } from '../shared/errors';

const router = Router();

router.use(authenticate);

// Per-user sliding-window rate limiter: 20 requests/min (no extra dep)
const userRequestLog = new Map<string, number[]>();
function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (userRequestLog.get(userId) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= 20) return false;
  timestamps.push(now);
  userRequestLog.set(userId, timestamps);
  return true;
}

// ─── Shared Schemas ────────────────────────────────────────────────────────────

const ImageInputSchema = z.object({
  base64: z.string().min(1),
  mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
});

// ─── Story Generator ──────────────────────────────────────────────────────────

const GenerateStoryBody = z.object({
  rawInput: z.string().min(1),
});

router.post('/story/generate', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = GenerateStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'rawInput ist erforderlich' });
    return;
  }

  const start = Date.now();
  try {
    const result = await generateStory(parsed.data.rawInput);
    const title = extractTitle(result.generatedStory, parsed.data.rawInput);

    const story = await prisma.story.create({
      data: {
        userId,
        title,
        rawInput: parsed.data.rawInput,
        generatedStory: result.generatedStory,
        refinementHints: result.refinementHints,
      },
    });

    logger.info({ userId, tool: 'story/generate', latency_ms: Date.now() - start, status: 201 });
    res.status(201).json(story);
  } catch (err) {
    logger.error({ userId, tool: 'story/generate', err });
    res.status(500).json({ error: internalError(err) });
  }
});

const RefineWithHintsBody = z.object({
  currentStory: z.string().min(1),
  hintAnswers: z.array(z.object({ hint: z.string(), answer: z.string() })),
  storyId: z.string().uuid().optional(),
});

router.post('/story/refine-hints', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = RefineWithHintsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  const start = Date.now();
  try {
    const result = await refineStoryWithHints(parsed.data.currentStory, parsed.data.hintAnswers);

    if (parsed.data.storyId) {
      const story = await prisma.story.findFirst({ where: { id: parsed.data.storyId, userId } });
      if (story) {
        const title = extractTitle(result.generatedStory, story.rawInput);
        await prisma.story.update({
          where: { id: parsed.data.storyId },
          data: { generatedStory: result.generatedStory, refinementHints: result.refinementHints, title },
        });
        await prisma.refinement.create({
          data: {
            storyId: parsed.data.storyId,
            instruction: `Refinement Hints beantwortet: ${parsed.data.hintAnswers.length} Hinweise`,
            resultStory: result.generatedStory,
          },
        });
      }
    }

    logger.info({ userId, tool: 'story/refine-hints', latency_ms: Date.now() - start, status: 200 });
    res.json(result);
  } catch (err) {
    logger.error({ userId, tool: 'story/refine-hints', err });
    res.status(500).json({ error: internalError(err) });
  }
});

const RefineStoryBody = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  storyId: z.string().uuid().optional(),
  instruction: z.string().optional(),
});

router.post('/story/refine', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = RefineStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  const start = Date.now();
  try {
    const result = await refineStory(parsed.data.conversationHistory);

    if (parsed.data.storyId) {
      const story = await prisma.story.findFirst({ where: { id: parsed.data.storyId, userId } });
      if (story) {
        const title = extractTitle(result.generatedStory, story.rawInput);
        await prisma.story.update({
          where: { id: parsed.data.storyId },
          data: { generatedStory: result.generatedStory, refinementHints: result.refinementHints, title },
        });
        if (parsed.data.instruction) {
          await prisma.refinement.create({
            data: {
              storyId: parsed.data.storyId,
              instruction: parsed.data.instruction,
              resultStory: result.generatedStory,
            },
          });
        }
      }
    }

    logger.info({ userId, tool: 'story/refine', latency_ms: Date.now() - start, status: 200 });
    res.json(result);
  } catch (err) {
    logger.error({ userId, tool: 'story/refine', err });
    res.status(500).json({ error: internalError(err) });
  }
});

// ─── Text Polisher ────────────────────────────────────────────────────────────

const PolishTextBody = z.object({
  input: z.string().min(1),
  useCase: z.enum(['email', 'meeting', 'freetext']),
  tone: z.enum(['formell', 'neutral', 'informell']).optional(),
});

router.post('/text-polisher/polish', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = PolishTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  const start = Date.now();
  try {
    const result = await polishText(parsed.data.input, parsed.data.useCase, parsed.data.tone);
    logger.info({ userId, tool: 'text-polisher/polish', latency_ms: Date.now() - start, status: 200 });
    res.json({ result });
  } catch (err) {
    logger.error({ userId, tool: 'text-polisher/polish', err });
    res.status(500).json({ error: internalError(err) });
  }
});

// ─── Test Case Generator ──────────────────────────────────────────────────────

const GenerateTestCasesBody = z.object({
  storyText: z.string().min(1),
  testContext: z.string().optional(),
  screenshots: z.array(ImageInputSchema).max(3).default([]),
});

router.post('/test-case-generator/generate', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = GenerateTestCasesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'storyText ist erforderlich' });
    return;
  }

  const start = Date.now();
  try {
    const result = await generateTestCases(parsed.data);
    logger.info({ userId, tool: 'test-case-generator/generate', latency_ms: Date.now() - start, status: 200 });
    res.json(result);
  } catch (err) {
    logger.error({ userId, tool: 'test-case-generator/generate', err });
    res.status(500).json({ error: internalError(err) });
  }
});

// ─── Doc Generator ────────────────────────────────────────────────────────────

const StoryDocInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  confluenceSpec: z.string().default(''),
  code: z.string().default(''),
  acceptedBy: z.string().default(''),
  deploymentDate: z.string().default(''),
});

const FeatureDocInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  stories: z.string().min(1),
  confluenceSpec: z.string().default(''),
  code: z.string().default(''),
  responsible: z.string().default(''),
  deploymentDate: z.string().default(''),
});

const GenerateDocBody = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('story'), input: StoryDocInputSchema, screenshots: z.array(ImageInputSchema).max(3).default([]) }),
  z.object({ mode: z.literal('feature'), input: FeatureDocInputSchema, screenshots: z.array(ImageInputSchema).max(1).default([]) }),
]);

router.post('/doc-generator/generate', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = GenerateDocBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  const start = Date.now();
  try {
    const result = await generateDoc(parsed.data);
    logger.info({ userId, tool: 'doc-generator/generate', latency_ms: Date.now() - start, status: 200 });
    res.json({ result });
  } catch (err) {
    logger.error({ userId, tool: 'doc-generator/generate', err });
    res.status(500).json({ error: internalError(err) });
  }
});

// ─── Goal Generator ───────────────────────────────────────────────────────────

const SprintGoalInputSchema = z.object({ idea: z.string().min(1) });
const PiObjectiveInputSchema = z.object({
  featureTitle: z.string().min(1),
  featureDescription: z.string().min(1),
  jiraReference: z.string().default(''),
  acceptedBy: z.string().default(''),
  acceptanceDate: z.string().default(''),
  acceptanceLevel: z.string().default(''),
});

const GenerateGoalsBody = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('sprint-goal'), input: SprintGoalInputSchema, screenshot: ImageInputSchema.nullable().default(null) }),
  z.object({ mode: z.literal('pi-objective'), input: PiObjectiveInputSchema }),
]);

router.post('/goal-generator/generate', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = GenerateGoalsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  const start = Date.now();
  try {
    const result = await generateGoals(parsed.data);
    logger.info({ userId, tool: 'goal-generator/generate', latency_ms: Date.now() - start, status: 200 });
    res.json(result);
  } catch (err) {
    logger.error({ userId, tool: 'goal-generator/generate', err });
    res.status(500).json({ error: internalError(err) });
  }
});

const RefineGoalParamsBaseSchema = z.object({
  rawInitialResponse: z.string(),
  selectedVariantText: z.string().min(1),
  refinementHint: z.string().min(1),
  previousRefinements: z.array(z.object({ userMessage: z.string(), rawResult: z.string() })).default([]),
});

const RefineGoalBody = z.discriminatedUnion('mode', [
  RefineGoalParamsBaseSchema.extend({
    mode: z.literal('sprint-goal'),
    input: SprintGoalInputSchema,
    screenshot: ImageInputSchema.nullable().default(null),
  }),
  RefineGoalParamsBaseSchema.extend({
    mode: z.literal('pi-objective'),
    input: PiObjectiveInputSchema,
  }),
]);

router.post('/goal-generator/refine', async (req, res) => {
  const userId = req.user!.userId;
  if (!checkUserRateLimit(userId)) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte eine Minute.' });
    return;
  }

  const parsed = RefineGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ungültige Anfragedaten' });
    return;
  }

  const start = Date.now();
  try {
    const result = await refineGoal(parsed.data);
    logger.info({ userId, tool: 'goal-generator/refine', latency_ms: Date.now() - start, status: 200 });
    res.json(result);
  } catch (err) {
    logger.error({ userId, tool: 'goal-generator/refine', err });
    res.status(500).json({ error: internalError(err) });
  }
});

export default router;
