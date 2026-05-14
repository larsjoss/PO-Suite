import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard';

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('useCopyToClipboard', () => {
  it('starts with copied = false', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);
  });

  it('sets copied to true after successful copy', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy('Hallo Welt');
    });
    expect(result.current.copied).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hallo Welt');
  });

  it('resets copied to false after timeout', async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000));
    await act(async () => {
      await result.current.copy('Text');
    });
    expect(result.current.copied).toBe(true);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current.copied).toBe(false);
  });

  it('calls alert when clipboard write fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useCopyToClipboard());
    await act(async () => {
      await result.current.copy('Text');
    });
    expect(window.alert).toHaveBeenCalledWith(
      'Kopieren fehlgeschlagen. Bitte manuell kopieren.',
    );
    expect(result.current.copied).toBe(false);
  });
});
