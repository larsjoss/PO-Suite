import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const btnBase =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ' +
    'px-3 py-1.5 text-xs';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-msg"
        className="bg-surface rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-serif text-lg font-semibold text-ink">
          {title}
        </h2>
        <p id="confirm-msg" className="text-sm text-ink-secondary">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`${btnBase} text-ink-secondary hover:text-ink hover:bg-edge-2`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${btnBase} bg-red-600 hover:bg-red-700 text-white`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
