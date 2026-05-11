import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ENTERPRISE_JWT_KEY } from './storageKeys';

import {
  fetchApi,
  fetchApiGet,
  fetchApiDelete,
  setJwt,
  clearJwt,
  setOn401Handler,
} from './httpClient';

function makeResponse(
  status: number,
  body: unknown = undefined,
  ok?: boolean,
): Response {
  const isOk = ok ?? (status >= 200 && status < 300);
  return {
    status,
    ok: isOk,
    json: body !== undefined ? vi.fn().mockResolvedValue(body) : vi.fn().mockRejectedValue(new SyntaxError('no body')),
  } as unknown as Response;
}

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchApi', () => {
  it('sendet GET wenn kein Body übergeben wird', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { ok: true }));

    await fetchApi('/test');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('GET');
  });

  it('sendet POST wenn ein Body übergeben wird', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { ok: true }));

    await fetchApi('/test', { data: 'value' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).body).toBe(JSON.stringify({ data: 'value' }));
  });

  it('hängt Authorization-Header an wenn JWT in sessionStorage liegt', async () => {
    setJwt('mein-token');
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { ok: true }));

    await fetchApi('/secure');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer mein-token',
    });
  });

  it('sendet keinen Authorization-Header wenn kein JWT vorhanden ist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { ok: true }));

    await fetchApi('/public');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).not.toHaveProperty('Authorization');
  });

  it('gibt den geparsten JSON-Body zurück', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { result: 42 }));

    const data = await fetchApi<{ result: number }>('/data');

    expect(data).toEqual({ result: 42 });
  });
});

describe('fetchApiGet', () => {
  it('sendet immer GET', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { items: [] }));

    await fetchApiGet('/list');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('GET');
  });

  it('hängt Authorization-Header an wenn JWT in sessionStorage liegt', async () => {
    setJwt('get-token');
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(200, { items: [] }));

    await fetchApiGet('/list');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer get-token',
    });
  });
});

describe('fetchApiDelete', () => {
  it('sendet DELETE', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(204));

    await fetchApiDelete('/resource/1');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe('DELETE');
  });

  it('wirft keinen Fehler und gibt undefined zurück bei 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(204));

    const result = await fetchApiDelete('/resource/1');

    expect(result).toBeUndefined();
  });
});

describe('handleResponse — Fehlerpfade (via fetchApi)', () => {
  it('wirft "Sitzung abgelaufen" bei 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(401, {}, false));

    await expect(fetchApi('/private')).rejects.toThrow('Sitzung abgelaufen. Bitte neu anmelden.');
  });

  it('ruft den on401-Handler auf bei 401', async () => {
    const handler = vi.fn();
    setOn401Handler(handler);
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(401, {}, false));

    await fetchApi('/private').catch(() => {});

    expect(handler).toHaveBeenCalledOnce();
    setOn401Handler(() => {});
  });

  it('löscht den JWT aus sessionStorage bei 401', async () => {
    setJwt('abgelaufener-token');
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(401, {}, false));

    await fetchApi('/private').catch(() => {});

    expect(sessionStorage.getItem(ENTERPRISE_JWT_KEY)).toBeNull();
  });

  it('wirft die error-Eigenschaft aus dem Response-Body bei nicht-ok-Antwort', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeResponse(422, { error: 'Ungültige Eingabe' }, false),
    );

    await expect(fetchApi('/validate')).rejects.toThrow('Ungültige Eingabe');
  });

  it('wirft "Serverfehler (status)" wenn kein parsebarer Body vorhanden ist', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeResponse(500, undefined, false));

    await expect(fetchApi('/crash')).rejects.toThrow('Serverfehler (500)');
  });
});

describe('fetchWithTimeout — Timeout-Verhalten', () => {
  it('wandelt AbortError in deutsche Timeout-Meldung um nach 60 Sekunden', async () => {
    vi.useFakeTimers();

    vi.mocked(fetch).mockImplementationOnce((_url, init) => {
      return new Promise((_resolve, reject) => {
        (init as RequestInit).signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const promise = fetchApi('/slow');
    vi.advanceTimersByTime(60_000);

    await expect(promise).rejects.toThrow(
      'Zeitüberschreitung nach 60 Sekunden. Bitte erneut versuchen.',
    );
  });
});
