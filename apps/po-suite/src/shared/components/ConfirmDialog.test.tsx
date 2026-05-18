import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

const noop = () => {};

describe('ConfirmDialog', () => {
  it('rendert nichts wenn open=false', () => {
    render(
      <ConfirmDialog open={false} title="Test" message="Msg" onConfirm={noop} onCancel={noop} />,
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('rendert Dialog mit korrekten ARIA-Attributen wenn open=true', () => {
    render(
      <ConfirmDialog open title="Modus wechseln" message="Eingaben gehen verloren." onConfirm={noop} onCancel={noop} />,
    );
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-msg');
    expect(screen.getByText('Modus wechseln')).toBeInTheDocument();
    expect(screen.getByText('Eingaben gehen verloren.')).toBeInTheDocument();
  });

  it('zeigt Standard-Labels wenn keine Labels angegeben', () => {
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={noop} onCancel={noop} />,
    );
    expect(screen.getByRole('button', { name: 'Bestätigen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
  });

  it('zeigt benutzerdefinierte Button-Labels', () => {
    render(
      <ConfirmDialog
        open
        title="T"
        message="M"
        confirmLabel="Ja, löschen"
        cancelLabel="Nein, behalten"
        onConfirm={noop}
        onCancel={noop}
      />,
    );
    expect(screen.getByRole('button', { name: 'Ja, löschen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nein, behalten' })).toBeInTheDocument();
  });

  it('ruft onConfirm auf beim Klick auf Bestätigen', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={onConfirm} onCancel={noop} />,
    );
    await user.click(screen.getByRole('button', { name: 'Bestätigen' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('ruft onCancel auf beim Klick auf Abbrechen', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={noop} onCancel={onCancel} />,
    );
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('ruft onCancel auf bei Escape-Taste', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={noop} onCancel={onCancel} />,
    );
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('ruft onCancel auf beim Klick auf den Backdrop', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog open title="T" message="M" onConfirm={noop} onCancel={onCancel} />,
    );
    // Backdrop ist das äusserste div (role="presentation")
    const backdrop = container.querySelector('[role="presentation"]') as HTMLElement;
    await user.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('verhindert Klick-Propagation vom Dialog-Inhalt zum Backdrop', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open title="T" message="M" onConfirm={noop} onCancel={onCancel} />,
    );
    // Klick auf den Dialog-Inhalt selbst (nicht auf den Backdrop)
    await user.click(screen.getByRole('alertdialog'));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
