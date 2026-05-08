import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { RevealButton } from './RevealButton';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: Props) {
  const { apiKey, setApiKey } = useAuth();
  const [value, setValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setValue(apiKey ?? '');
      setShowKey(false);
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, apiKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) setApiKey(trimmed);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="settings-dialog-title"
      className="m-auto rounded-xl shadow-xl border border-edge bg-surface p-0 w-full max-w-sm backdrop:bg-ink/40"
    >
      <div className="p-5">
        <h2 id="settings-dialog-title" className="font-serif text-base font-semibold text-ink mb-4">
          API-Key ändern
        </h2>

        <div>
          <label htmlFor="settings-apikey" className="block text-sm font-medium text-ink mb-1">
            Anthropic API-Key
          </label>
          <div className="flex items-center border border-edge rounded-lg bg-surface focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
            <input
              ref={inputRef}
              id="settings-apikey"
              type={showKey ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <RevealButton
              show={showKey}
              onToggle={() => setShowKey((v) => !v)}
              label={showKey ? 'API-Key verbergen' : 'API-Key anzeigen'}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-tertiary">
            Deinen API-Key findest du unter{' '}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <Button onClick={handleSave} disabled={!value.trim()} className="flex-1">
            Speichern
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
        </div>
      </div>
    </dialog>
  );
}
