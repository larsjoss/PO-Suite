import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoachPanel } from '../CoachPanel';
import { STORY_COACH_CONFIG, POLISH_COACH_CONFIG } from '../../config/coachConfig';

function renderCoach(props?: Partial<React.ComponentProps<typeof CoachPanel>>) {
  const onDismiss = vi.fn();
  const onDismissForever = vi.fn();
  const onStepToggle = vi.fn();
  const onNavigate = vi.fn();
  render(
    <CoachPanel
      config={STORY_COACH_CONFIG}
      onDismiss={onDismiss}
      onDismissForever={onDismissForever}
      onStepToggle={onStepToggle}
      onNavigate={onNavigate}
      {...props}
    />,
  );
  return { onDismiss, onDismissForever, onStepToggle, onNavigate };
}

describe('CoachPanel — Render', () => {
  it('zeigt Überschrift «Nächste Schritte»', () => {
    renderCoach();
    expect(screen.getByText('Nächste Schritte')).toBeInTheDocument();
  });

  it('zeigt erledigte Schritte', () => {
    renderCoach();
    expect(screen.getByText('User Story geschrieben')).toBeInTheDocument();
  });

  it('zeigt max. 3 Empfehlungen', () => {
    renderCoach();
    expect(screen.getByText('Testfälle erstellen')).toBeInTheDocument();
    expect(screen.getByText('Confluence-Doku generieren')).toBeInTheDocument();
    expect(screen.getByText('Sprint Goal formulieren')).toBeInTheDocument();
  });

  it('zeigt Sprint-Kontext-Accordion wenn nicht leer', () => {
    renderCoach();
    expect(screen.getByText('Sprint-Kontext')).toBeInTheDocument();
  });

  it('zeigt kein Sprint-Kontext-Accordion wenn sprintContextText leer', () => {
    renderCoach({ config: POLISH_COACH_CONFIG });
    expect(screen.queryByText('Sprint-Kontext')).not.toBeInTheDocument();
  });
});

describe('CoachPanel — Dismiss', () => {
  it('ruft onDismiss bei [X] auf', async () => {
    const user = userEvent.setup();
    const { onDismiss } = renderCoach();
    await user.click(screen.getByRole('button', { name: /Coach ausblenden/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('zeigt Inline-Bestätigung bei «Immer ausblenden»', async () => {
    const user = userEvent.setup();
    renderCoach();
    await user.click(screen.getByRole('button', { name: /Immer ausblenden/i }));
    expect(screen.getByText('Wirklich immer ausblenden?')).toBeInTheDocument();
  });

  it('ruft onDismissForever bei Bestätigung auf', async () => {
    const user = userEvent.setup();
    const { onDismissForever } = renderCoach();
    await user.click(screen.getByRole('button', { name: /Immer ausblenden/i }));
    await user.click(screen.getByRole('button', { name: 'Ja' }));
    expect(onDismissForever).toHaveBeenCalled();
  });

  it('bricht Bestätigung bei «Nein» ab', async () => {
    const user = userEvent.setup();
    const { onDismissForever } = renderCoach();
    await user.click(screen.getByRole('button', { name: /Immer ausblenden/i }));
    await user.click(screen.getByRole('button', { name: 'Nein' }));
    expect(onDismissForever).not.toHaveBeenCalled();
    expect(screen.queryByText('Wirklich immer ausblenden?')).not.toBeInTheDocument();
  });
});

describe('CoachPanel — Schritte togglen', () => {
  it('ruft onStepToggle bei manueller Checkbox auf', async () => {
    const user = userEvent.setup();
    const { onStepToggle } = renderCoach();
    const checkbox = screen.getByRole('checkbox', { name: /mit Team besprochen/i });
    await user.click(checkbox);
    expect(onStepToggle).toHaveBeenCalledWith('story-refined');
  });
});
