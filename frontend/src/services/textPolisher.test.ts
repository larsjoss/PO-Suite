import { describe, it, expect, vi, beforeEach } from 'vitest';

const messagesCreateMock = vi.fn();

vi.mock('../shared/services/apiClient', async () => {
  const actual =
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

import { polishText } from './textPolisher';

const mockTextResponse = (text: string) => ({ content: [{ type: 'text', text }] });

beforeEach(() => {
  messagesCreateMock.mockReset();
});

// ─── Email Use Case ───────────────────────────────────────────────────────────

describe('polishText — email', () => {
  it('returns polished email text starting with Betreff:', async () => {
    const emailText = 'Betreff: Projekt-Update\n\nSehr geehrte Damen und Herren,\n\n...';
    messagesCreateMock.mockResolvedValue(mockTextResponse(emailText));

    const result = await polishText('roher Email-Text', 'email', 'formell');

    expect(result).toBe(emailText);
    expect(messagesCreateMock).toHaveBeenCalledTimes(1);
    expect(messagesCreateMock.mock.calls[0][0]).toMatchObject({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: 'roher Email-Text' }],
    });
  });

  it('passes tone parameter to email prompt', async () => {
    messagesCreateMock.mockResolvedValue(mockTextResponse('Betreff: Test\n\nBody'));

    await polishText('text', 'email', 'informell');

    const { system } = messagesCreateMock.mock.calls[0][0] as { system: string };
    expect(system).toBeTruthy();
  });

  it('uses formell as default tone', async () => {
    messagesCreateMock.mockResolvedValue(mockTextResponse('Betreff: Test\n\nBody'));

    await polishText('text', 'email');

    expect(messagesCreateMock).toHaveBeenCalledTimes(1);
  });

  it('throws when email response does not start with Betreff:', async () => {
    messagesCreateMock.mockResolvedValue(mockTextResponse('Liebe Damen und Herren...'));

    await expect(polishText('text', 'email', 'formell')).rejects.toThrow(
      'Unerwartetes E-Mail-Format',
    );
  });


});

// ─── Meeting Use Case ─────────────────────────────────────────────────────────

describe('polishText — meeting', () => {
  it('returns polished meeting minutes', async () => {
    const meetingText = '**Datum:** 2025-01-01\n**Teilnehmer:** Alice, Bob';
    messagesCreateMock.mockResolvedValue(mockTextResponse(meetingText));

    const result = await polishText('rohe Notizen', 'meeting');

    expect(result).toBe(meetingText);
    expect(messagesCreateMock.mock.calls[0][0]).toMatchObject({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: 'rohe Notizen' }],
    });
  });

  it('does not validate Betreff: format for meeting', async () => {
    messagesCreateMock.mockResolvedValue(mockTextResponse('Keine Betreff-Zeile nötig'));

    const result = await polishText('text', 'meeting');

    expect(result).toBe('Keine Betreff-Zeile nötig');
  });
});

// ─── Freetext Use Case ────────────────────────────────────────────────────────

describe('polishText — freetext', () => {
  it('returns polished freetext', async () => {
    const freeText = '• Punkt eins\n\n• Punkt zwei';
    messagesCreateMock.mockResolvedValue(mockTextResponse(freeText));

    const result = await polishText('roher Text', 'freetext');

    expect(result).toBe(freeText);
    expect(messagesCreateMock.mock.calls[0][0]).toMatchObject({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
    });
  });
});

// ─── API Errors ───────────────────────────────────────────────────────────────

describe('polishText — API errors', () => {
  it('propagates network errors', async () => {
    messagesCreateMock.mockRejectedValue(new Error('Network error'));

    await expect(polishText('text', 'freetext')).rejects.toThrow('Network error');
  });

  it('propagates authentication errors', async () => {
    messagesCreateMock.mockRejectedValue(new Error('401 Unauthorized'));

    await expect(polishText('text', 'email')).rejects.toThrow('401 Unauthorized');
  });
});
