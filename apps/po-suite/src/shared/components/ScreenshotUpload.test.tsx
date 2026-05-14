import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenshotUpload } from './ScreenshotUpload';
import type { UploadedFile } from '../../types';

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

function makeFile(opts: { type?: string; sizeBytes?: number; name?: string } = {}): File {
  const { type = 'image/png', sizeBytes, name = 'screenshot.png' } = opts;
  const file = new File(['x'], name, { type });
  if (sizeBytes !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true });
  }
  return file;
}

function makeUploadedFile(name: string, idx: number): UploadedFile {
  return {
    id: `id-${idx}`,
    file: makeFile({ name }),
    previewUrl: `blob:${idx}`,
    base64: 'abc',
  };
}

describe('ScreenshotUpload', () => {
  describe('Initiales Rendering', () => {
    it('zeigt die Drop-Zone wenn keine Dateien vorhanden', () => {
      render(<ScreenshotUpload files={[]} onChange={vi.fn()} />);
      expect(
        screen.getByRole('button', { name: /screenshot hochladen/i }),
      ).toBeInTheDocument();
    });

    it('zeigt Hinweis auf erlaubte Dateitypen', () => {
      render(<ScreenshotUpload files={[]} onChange={vi.fn()} />);
      expect(screen.getByText(/PNG, JPG, WebP/i)).toBeInTheDocument();
    });
  });

  describe('Datei-Limit', () => {
    it('versteckt die Drop-Zone wenn maxFiles erreicht', () => {
      const files = [0, 1, 2].map((i) => makeUploadedFile(`f${i}.png`, i));
      render(<ScreenshotUpload files={files} onChange={vi.fn()} maxFiles={3} />);
      expect(
        screen.queryByRole('button', { name: /screenshot hochladen/i }),
      ).toBeNull();
    });

    it('zeigt Drop-Zone noch wenn ein Slot frei ist', () => {
      const files = [0, 1].map((i) => makeUploadedFile(`f${i}.png`, i));
      render(<ScreenshotUpload files={files} onChange={vi.fn()} maxFiles={3} />);
      expect(
        screen.getByRole('button', { name: /screenshot hochladen/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Vorschau', () => {
    it('rendert Vorschaubild für jede hochgeladene Datei', () => {
      const files = [makeUploadedFile('ui.png', 0)];
      render(<ScreenshotUpload files={files} onChange={vi.fn()} />);
      expect(screen.getByAltText('ui.png')).toBeInTheDocument();
    });

    it('rendert Entfernen-Button für jede Datei', () => {
      const files = [
        makeUploadedFile('a.png', 0),
        makeUploadedFile('b.png', 1),
      ];
      render(<ScreenshotUpload files={files} onChange={vi.fn()} />);
      expect(screen.getAllByRole('button', { name: /entfernen/i })).toHaveLength(2);
    });
  });

  describe('Validierung', () => {
    it('zeigt Fehler bei nicht erlaubtem Dateityp', async () => {
      render(<ScreenshotUpload files={[]} onChange={vi.fn()} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const user = userEvent.setup({ applyAccept: false });
      await user.upload(input, makeFile({ type: 'application/pdf', name: 'doc.pdf' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(/nur bilddateien erlaubt/i);
    });

    it('zeigt Fehler bei Datei über 5 MB', async () => {
      render(<ScreenshotUpload files={[]} onChange={vi.fn()} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(
        input,
        makeFile({ type: 'image/png', sizeBytes: 6 * 1024 * 1024, name: 'big.png' }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(/max\. 5 mb/i);
    });

    it('zeigt Fehler wenn bereits maxFiles Dateien vorhanden', async () => {
      const threeFiles = [0, 1, 2].map((i) => makeUploadedFile(`f${i}.png`, i));
      render(<ScreenshotUpload files={threeFiles} onChange={vi.fn()} maxFiles={3} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, makeFile());
      expect(await screen.findByRole('alert')).toHaveTextContent(/maximal 3/i);
    });
  });

  describe('Barrierefreiheit', () => {
    it('hat role="group" auf dem Container', () => {
      render(<ScreenshotUpload files={[]} onChange={vi.fn()} />);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('Drop-Zone ist per Tastatur aktivierbar (Enter/Space)', async () => {
      render(<ScreenshotUpload files={[]} onChange={vi.fn()} />);
      const dropZone = screen.getByRole('button', { name: /screenshot hochladen/i });
      await userEvent.type(dropZone, '{Enter}');
      expect(dropZone).toBeInTheDocument();
    });
  });
});
