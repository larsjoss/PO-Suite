import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Snackbar } from '../Snackbar';

describe('Snackbar', () => {
  it('zeigt Nachricht an', () => {
    render(<Snackbar variant="success" message="Gespeichert!" />);
    expect(screen.getByText('Gespeichert!')).toBeInTheDocument();
  });

  it('hat role="alert" bei error', () => {
    render(<Snackbar variant="error" message="Fehler aufgetreten" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('hat role="status" bei success', () => {
    render(<Snackbar variant="success" message="Erfolgreich" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('hat role="status" bei info', () => {
    render(<Snackbar variant="info" message="Hinweis" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('zeigt Schliessen-Button wenn onDismiss übergeben', () => {
    render(<Snackbar variant="info" message="Test" onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: /schließen/i })).toBeInTheDocument();
  });

  it('zeigt keinen Schliessen-Button ohne onDismiss', () => {
    render(<Snackbar variant="info" message="Test" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ruft onDismiss auf Klick', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Snackbar variant="success" message="OK" onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /schließen/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
