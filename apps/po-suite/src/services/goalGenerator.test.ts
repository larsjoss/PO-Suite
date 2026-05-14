import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SprintGoalInput, PiObjectiveInput, UploadedFile } from '../types';

const messagesCreateMock = vi.fn();

vi.mock('../shared/services/apiClient', async () => {
  const actual =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    await vi.importActual<typeof import('../shared/services/apiClient')>(
      '../shared/services/apiClient',
    );
  return {
    ...actual,
    getApiClient: () => ({
      messages: { create: messagesCreateMock },
    }),
  };
});

import { generateGoals, refineGoal, parseVariants, parseRefinedVariant } from './goalGenerator';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeSprintInput = (idea = 'Bessere Search-UX'): SprintGoalInput => ({ idea });

const makePiInput = (overrides: Partial<PiObjectiveInput> = {}): PiObjectiveInput => ({
  featureTitle: 'Document Upload Center',
  featureDescription: 'Zentraler Upload für alle Dokumenten-Workflows',
  jiraReference: '',
  acceptedBy: '',
  acceptanceDate: '',
  acceptanceLevel: '',
  ...overrides,
});

const makeScreenshot = (mediaType = 'image/png'): UploadedFile => ({
  id: 'sc-1',
  file: new File(['x'], 'screen.png', { type: mediaType }),
  previewUrl: 'blob:mock',
  base64: 'BASE64',
});

const mockTextResponse = (text: string) => ({ content: [{ type: 'text', text }] });

beforeEach(() => {
  messagesCreateMock.mockReset();
});

// ─── parseVariants ────────────────────────────────────────────────────────────

describe('parseVariants', () => {
  it('teilt drei Varianten am "Variante N"-Header auf', () => {
    const raw = `**Variante 1**
Goal eins.
Qualitätsbegründung: Begründung eins.

**Variante 2**
Goal zwei.
Qualitätsbegründung: Begründung zwei.

**Variante 3**
Goal drei.
Qualitätsbegründung: Begründung drei.`;

    const variants = parseVariants(raw);
    expect(variants).toHaveLength(3);
    expect(variants[0].text).toContain('Goal eins.');
    expect(variants[0].rationale).toContain('Begründung eins.');
  });

  it('extrahiert die optionale Schwachstelle', () => {
    const raw = `Variante 1
Goal eins.
Qualitätsbegründung: Begründung.
Schwachstelle: Könnte präziser sein.`;

    const [variant] = parseVariants(raw);
    expect(variant.weakness).toBe('Könnte präziser sein.');
  });

  it('lässt weakness undefined, wenn keine Schwachstelle vorhanden', () => {
    const raw = `Variante 1
Goal eins.
Qualitätsbegründung: Begründung.`;

    const [variant] = parseVariants(raw);
    expect(variant.weakness).toBeUndefined();
  });

  it('fällt auf einzelne Variante zurück, wenn kein "Variante N"-Header gefunden wird', () => {
    const variants = parseVariants('Just a single text without headers');
    expect(variants).toHaveLength(1);
    expect(variants[0].text).toBe('Just a single text without headers');
  });

  it('verarbeitet PI-Objective-Format mit --- Separator', () => {
    const raw = `**Variante 1**
**Document Upload**
Lieferung: Es wurden xyz...

* Punkt 1
* Punkt 2

Outcome-Paragraph.

---
Qualitätsbegründung: Outcome ist klar.
Schwachstelle: Bullet 2 könnte konkreter sein.`;

    const [variant] = parseVariants(raw);
    expect(variant.text).toContain('Outcome-Paragraph.');
    expect(variant.text).not.toContain('Qualitätsbegründung');
    expect(variant.rationale).toContain('Outcome ist klar.');
    expect(variant.weakness).toContain('Bullet 2');
  });
});

describe('parseRefinedVariant', () => {
  it('parst eine einzelne verfeinerte Variante (kein Header)', () => {
    const raw = `Goal verfeinert.
Qualitätsbegründung: Schärfer fokussiert.
Schwachstelle: Noch zu generisch.`;
    const variant = parseRefinedVariant(raw);
    expect(variant.text).toBe('Goal verfeinert.');
    expect(variant.rationale).toBe('Schärfer fokussiert.');
    expect(variant.weakness).toBe('Noch zu generisch.');
  });
});

// ─── generateGoals — Mode-Routing ─────────────────────────────────────────────

describe('generateGoals — mode routing', () => {
  it('verwendet max_tokens 2000 im Sprint-Goal-Modus', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({
      mode: 'sprint-goal',
      input: makeSprintInput(),
      screenshot: null,
    });

    const args = messagesCreateMock.mock.calls[0][0];
    expect(args.max_tokens).toBe(2000);
    expect(args.model).toBe('claude-sonnet-4-5');
  });

  it('verwendet max_tokens 6000 im PI-Objective-Modus', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({ mode: 'pi-objective', input: makePiInput() });

    const args = messagesCreateMock.mock.calls[0][0];
    expect(args.max_tokens).toBe(6000);
  });

  it('nutzt unterschiedliche System-Prompts pro Mode', async () => {
    messagesCreateMock.mockResolvedValue(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({ mode: 'sprint-goal', input: makeSprintInput(), screenshot: null });
    const sprintPrompt = messagesCreateMock.mock.calls[0][0].system as string;

    messagesCreateMock.mockClear();
    await generateGoals({ mode: 'pi-objective', input: makePiInput() });
    const piPrompt = messagesCreateMock.mock.calls[0][0].system as string;

    expect(sprintPrompt).toContain('Sprint Goal');
    expect(piPrompt).toContain('PI Objective');
    expect(sprintPrompt).not.toBe(piPrompt);
  });
});

// ─── generateGoals — User-Message Building ────────────────────────────────────

describe('generateGoals — Sprint-Goal-Input', () => {
  it('liefert die Idee als User-Message', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({
      mode: 'sprint-goal',
      input: makeSprintInput('Onboarding für Neukunden vereinfachen'),
      screenshot: null,
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('Onboarding für Neukunden vereinfachen');
  });

  it('hängt Screenshot als image-Block an, wenn vorhanden', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({
      mode: 'sprint-goal',
      input: makeSprintInput(),
      screenshot: makeScreenshot('image/jpeg'),
    });

    const blocks = messagesCreateMock.mock.calls[0][0].messages[0].content;
    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toMatchObject({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: 'BASE64' },
    });
  });

  it('lässt image-Block weg, wenn kein Screenshot vorhanden', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({ mode: 'sprint-goal', input: makeSprintInput(), screenshot: null });

    const blocks = messagesCreateMock.mock.calls[0][0].messages[0].content;
    expect(blocks).toHaveLength(1);
  });
});

describe('generateGoals — PI-Objective-Input', () => {
  it('liefert Pflichtfelder Titel und Beschreibung', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({
      mode: 'pi-objective',
      input: makePiInput({
        featureTitle: 'Mein Feature',
        featureDescription: 'Beschreibung des Features.',
      }),
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('**ART-Feature Titel:** Mein Feature');
    expect(text).toContain('Beschreibung des Features.');
  });

  it('lässt leere optionale Felder weg', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({
      mode: 'pi-objective',
      input: makePiInput({
        jiraReference: '',
        acceptedBy: '',
        acceptanceDate: '',
        acceptanceLevel: '',
      }),
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).not.toContain('Jira-Referenz');
    expect(text).not.toContain('Abnahme durch');
    expect(text).not.toContain('Abnahme-Datum');
    expect(text).not.toContain('Abnahme-Stufe');
  });

  it('inkludiert optionale Felder, wenn gesetzt', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Variante 1\nGoal.\nQualitätsbegründung: ok.'),
    );

    await generateGoals({
      mode: 'pi-objective',
      input: makePiInput({
        jiraReference: 'PROJ-123',
        acceptedBy: 'Alice, Bob',
        acceptanceDate: '2026-04-01',
        acceptanceLevel: 'Stufe 2',
      }),
    });

    const text = messagesCreateMock.mock.calls[0][0].messages[0].content[0].text as string;
    expect(text).toContain('PROJ-123');
    expect(text).toContain('Alice, Bob');
    expect(text).toContain('2026-04-01');
    expect(text).toContain('Stufe 2');
  });
});

// ─── generateGoals — Output & Errors ──────────────────────────────────────────

describe('generateGoals — Output & Errors', () => {
  it('parst die Varianten aus dem Raw-Text', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse(
        '**Variante 1**\nGoal eins.\nQualitätsbegründung: ok.\n\n**Variante 2**\nGoal zwei.\nQualitätsbegründung: ok.',
      ),
    );

    const result = await generateGoals({
      mode: 'sprint-goal',
      input: makeSprintInput(),
      screenshot: null,
    });

    expect(result.variants).toHaveLength(2);
    expect(result.rawText).toContain('Goal eins.');
  });

  it('wirft, wenn die Response leer ist', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse('   '));

    await expect(
      generateGoals({ mode: 'sprint-goal', input: makeSprintInput(), screenshot: null }),
    ).rejects.toThrow(/keine Varianten/i);
  });

  it('reicht API-Fehler durch', async () => {
    messagesCreateMock.mockRejectedValueOnce(new Error('Boom'));

    await expect(
      generateGoals({ mode: 'sprint-goal', input: makeSprintInput(), screenshot: null }),
    ).rejects.toThrow('Boom');
  });
});

// ─── refineGoal ───────────────────────────────────────────────────────────────

describe('refineGoal', () => {
  it('verwendet max_tokens 1000 im Sprint-Goal-Modus, 2000 im PI-Modus', async () => {
    messagesCreateMock.mockResolvedValue(
      mockTextResponse('Goal verfeinert.\nQualitätsbegründung: schärfer.'),
    );

    await refineGoal({
      mode: 'sprint-goal',
      input: makeSprintInput(),
      screenshot: null,
      rawInitialResponse: 'initial',
      selectedVariantText: 'gewählte Variante',
      refinementHint: 'kürzer',
      previousRefinements: [],
    });
    expect(messagesCreateMock.mock.calls[0][0].max_tokens).toBe(1000);

    messagesCreateMock.mockClear();
    await refineGoal({
      mode: 'pi-objective',
      input: makePiInput(),
      rawInitialResponse: 'initial',
      selectedVariantText: 'gewählte Variante',
      refinementHint: 'schärfer',
      previousRefinements: [],
    });
    expect(messagesCreateMock.mock.calls[0][0].max_tokens).toBe(2000);
  });

  it('baut Conversation-History korrekt auf (initial + assistant + previous + new user)', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Goal verfeinert.\nQualitätsbegründung: ok.'),
    );

    await refineGoal({
      mode: 'sprint-goal',
      input: makeSprintInput(),
      screenshot: null,
      rawInitialResponse: 'INITIAL_RESPONSE',
      selectedVariantText: 'GEWÄHLT',
      refinementHint: 'KÜRZER',
      previousRefinements: [
        { userMessage: 'PREV_USER_MSG', rawResult: 'PREV_RESULT' },
      ],
    });

    const messages = messagesCreateMock.mock.calls[0][0].messages;
    expect(messages).toHaveLength(5);
    expect(messages[0].role).toBe('user');
    expect(messages[1]).toEqual({ role: 'assistant', content: 'INITIAL_RESPONSE' });
    expect(messages[2]).toEqual({ role: 'user', content: 'PREV_USER_MSG' });
    expect(messages[3]).toEqual({ role: 'assistant', content: 'PREV_RESULT' });
    expect(messages[4].role).toBe('user');
    expect(messages[4].content).toContain('KÜRZER');
    expect(messages[4].content).toContain('GEWÄHLT');
  });

  it('liefert die geparste verfeinerte Variante zurück', async () => {
    messagesCreateMock.mockResolvedValueOnce(
      mockTextResponse('Goal verfeinert.\nQualitätsbegründung: schärfer.'),
    );

    const result = await refineGoal({
      mode: 'sprint-goal',
      input: makeSprintInput(),
      screenshot: null,
      rawInitialResponse: 'initial',
      selectedVariantText: 'gewählt',
      refinementHint: 'kürzer',
      previousRefinements: [],
    });

    expect(result.variant.text).toBe('Goal verfeinert.');
    expect(result.variant.rationale).toBe('schärfer.');
    expect(result.userMessage).toContain('kürzer');
  });

  it('wirft, wenn die Verfeinerungs-Response leer ist', async () => {
    messagesCreateMock.mockResolvedValueOnce(mockTextResponse(''));

    await expect(
      refineGoal({
        mode: 'sprint-goal',
        input: makeSprintInput(),
        screenshot: null,
        rawInitialResponse: 'initial',
        selectedVariantText: 'gewählt',
        refinementHint: 'kürzer',
        previousRefinements: [],
      }),
    ).rejects.toThrow(/Verfeinerung konnte nicht generiert/i);
  });
});
