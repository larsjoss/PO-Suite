import { useEffect, useRef, useState } from 'react';
import type { UploadedFile } from '../../types';

interface Props {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ScreenshotUpload({ files, onChange, disabled, maxFiles = 3 }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke alle preview-URLs beim Unmount (Memory-Leak-Prevention)
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFiles(incoming: FileList | File[]) {
    setError(null);
    const fileArray = Array.from(incoming);

    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      setError(`Maximal ${maxFiles} Screenshots erlaubt.`);
      return;
    }

    const toProcess = fileArray.slice(0, remaining);

    const oversized = toProcess.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Datei zu gross (max. 5 MB): ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }

    const nonImage = toProcess.filter((f) => !f.type.startsWith('image/'));
    if (nonImage.length > 0) {
      setError('Nur Bilddateien erlaubt (PNG, JPG, WebP).');
      return;
    }

    try {
      const uploaded = await Promise.all(
        toProcess.map(async (file): Promise<UploadedFile> => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          base64: await readFileAsBase64(file),
        })),
      );
      onChange([...files, ...uploaded]);
    } catch {
      setError('Fehler beim Verarbeiten der Dateien. Bitte erneut versuchen.');
    }
  }

  function removeFile(id: string) {
    const target = files.find((f) => f.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(files.filter((f) => f.id !== id));
    setError(null);
  }

  const canAddMore = files.length < maxFiles;

  return (
    <div role="group" aria-labelledby="screenshot-upload-label" className="flex flex-col gap-2">
      <span id="screenshot-upload-label" className="text-sm font-medium text-ink">
        Screenshots{' '}
        <span className="font-normal text-ink-tertiary">(optional, max. {maxFiles})</span>
      </span>

      {canAddMore && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Screenshot hochladen — Datei hierher ziehen oder klicken"
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
          className={[
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-edge-2',
            dragOver ? 'border-brand bg-brand-light' : 'border-edge',
          ].join(' ')}
        >
          <svg
            className="w-8 h-8 text-ink-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-ink-secondary">
            Datei hierher ziehen oder{' '}
            <span className="text-brand font-medium">auswählen</span>
          </span>
          <span className="text-xs text-ink-tertiary">PNG, JPG, WebP — max. 5 MB pro Datei</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-3" aria-label="Hochgeladene Screenshots">
          {files.map((f) => (
            <li key={f.id} className="relative group">
              <img
                src={f.previewUrl}
                alt={f.file.name}
                className="w-20 h-20 object-cover rounded-lg border border-edge"
              />
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                disabled={disabled}
                aria-label={`${f.file.name} entfernen`}
                className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 flex items-start gap-1.5">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
