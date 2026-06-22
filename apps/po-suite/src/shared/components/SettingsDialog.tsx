import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeamContext } from '../hooks/useTeamContext';
import { Alert } from './Alert';
import { Button } from './Button';
import { FormField } from './FormField';
import { Input } from './Input';
import { RevealButton } from './RevealButton';
import { TextArea } from './TextArea';
import { Toggle } from './Toggle';
import { COACH_DISMISSED_KEY } from '../services/storageKeys';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: Props) {
  const { apiKey, setApiKey } = useAuth();
  const { teamContext, setTeamContext } = useTeamContext();
  const [value, setValue] = useState('');
  const [contextValue, setContextValue] = useState('');
  const [coachEnabled, setCoachEnabled] = useState(
    () => localStorage.getItem(COACH_DISMISSED_KEY) !== 'true',
  );
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setValue(apiKey ?? '');
      setContextValue(teamContext);
      setShowKey(false);
      setCoachEnabled(localStorage.getItem(COACH_DISMISSED_KEY) !== 'true');
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (dialog.open) {
      dialog.close();
    }
    // teamContext intentionally excluded: we only snapshot it when the dialog opens,
    // not on every keystroke in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setTeamContext(contextValue.trim());
    if (coachEnabled) {
      localStorage.removeItem(COACH_DISMISSED_KEY);
    } else {
      localStorage.setItem(COACH_DISMISSED_KEY, 'true');
    }
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
      className="m-auto rounded-xl shadow-xl border border-edge bg-surface p-0 w-full max-w-md backdrop:bg-ink/40"
    >
      <div className="p-5 space-y-5">
        <h2 id="settings-dialog-title" className="font-serif text-base font-semibold text-ink">
          Einstellungen
        </h2>

        <FormField htmlFor="settings-apikey" label="Anthropic API-Key">
          <Input
            id="settings-apikey"
            label="Anthropic API-Key"
            hideLabel
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={setValue}
            placeholder="sk-ant-…"
            autoComplete="off"
            inputRef={inputRef}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            suffix={
              <RevealButton
                show={showKey}
                onToggle={() => setShowKey((v) => !v)}
                label={showKey ? 'API-Key verbergen' : 'API-Key anzeigen'}
              />
            }
          />
          <Alert variant="info">
            Dein API-Key verlässt diesen Tab nicht — er wird beim Schliessen des Browser-Tabs automatisch gelöscht.
          </Alert>
        </FormField>

        <FormField
          htmlFor="settings-teamcontext"
          label="Team-Kontext (optional)"
          description={
            <span className="flex justify-between gap-2">
              <span>Wird automatisch bei jedem Tool-Aufruf mitgegeben — einmal eintippen, nie wieder.</span>
              <span className="whitespace-nowrap shrink-0">{contextValue.length} / 800</span>
            </span>
          }
        >
          <TextArea
            id="settings-teamcontext"
            label="Team-Kontext"
            hideLabel
            value={contextValue}
            onChange={(v) => setContextValue(v.slice(0, 800))}
            placeholder="z.B. Grosse Schweizer Versicherung, B2C Self-Service, Mobile-First, WCAG 2.1 AA, Datenschutz nach DSG/DSGVO. Kürzel: AK = Akzeptanzkriterium."
            rows={4}
          />
        </FormField>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">PO-Coach anzeigen</span>
          <Toggle
            checked={coachEnabled}
            onChange={setCoachEnabled}
            aria-label="PO-Coach anzeigen"
          />
        </div>

        <div className="flex gap-2 pt-1">
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
