import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolishText } from '../hooks/useTextPolisher';
import { useSessionState } from '../hooks/useSessionState';
import type { UseCase, Tone } from '../types';
import { TextPolisherInputPanel } from '../components/text-polisher/TextPolisherInputPanel';
import { TextPolisherOutputPanel } from '../components/text-polisher/TextPolisherOutputPanel';
import { CoachPanel, ConfirmDialog } from '../shared/components';
import { useCoachVisibility } from '../shared/hooks/useCoachVisibility';
import { POLISH_COACH_CONFIG } from '../shared/config/coachConfig';

type PendingConfirm = { title: string; message: string; onConfirm: () => void } | null;

/*
 * Layout: Split-View.
 * Desktop (lg+): Input links | Output rechts, je 50%, unabhängig scrollbar.
 * Mobile: Input oben (immer), Output erscheint darunter erst nach Generierung.
 * ProtectedLayout stellt flex-1 bereit; TextPolisherPage füllt diesen Bereich.
 *
 * Zustand (useCase, tone, input, output) wird in sessionStorage persistiert,
 * sodass ein Tool-Wechsel und Rückkehr den letzten Stand wiederherstellt.
 */
export function TextPolisherPage() {
  const navigate = useNavigate();
  const [useCase, setUseCase] = useSessionState<UseCase>('tp_use_case', 'email');
  const [tone, setTone] = useSessionState<Tone>('tp_tone', 'formell');
  const [input, setInput] = useSessionState<string>('tp_input', '');
  const [output, setOutput] = useSessionState<string | undefined>('tp_output', undefined);
  const polishMutation = usePolishText();

  const outputRef = useRef<HTMLDivElement>(null);
  const wasLoading = useRef(false);
  const { isVisible: coachVisible, showCoach, dismiss: dismissCoach, dismissForever } = useCoachVisibility();
  const [toggledSteps, setToggledSteps] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const dismissConfirm = useCallback(() => setConfirm(null), []);

  const hasOutput = !!output;
  const isLoading = polishMutation.isPending;

  // Persist API result to sessionStorage so it survives navigation.
  useEffect(() => {
    if (polishMutation.data) {
      setOutput(polishMutation.data);
      showCoach();
    }
  }, [polishMutation.data, setOutput]); // eslint-disable-line react-hooks/exhaustive-deps

  // WCAG 2.4.3 – Focus Order: nach erfolgreicher Generierung Fokus auf Output-Panel.
  useEffect(() => {
    if (wasLoading.current && !isLoading && polishMutation.data) {
      outputRef.current?.focus();
    }
    wasLoading.current = isLoading;
  }, [isLoading, polishMutation.data]);

  const handleUseCaseChange = (newCase: UseCase) => {
    if (newCase === useCase) return;
    if (!hasOutput) {
      polishMutation.reset();
      setUseCase(newCase);
      setTone('formell');
      setOutput(undefined);
      return;
    }
    setConfirm({
      title: 'Use Case wechseln?',
      message: 'Beim Wechsel des Use Cases wird der aktuelle Output gelöscht.',
      onConfirm: () => {
        polishMutation.reset();
        setUseCase(newCase);
        setTone('formell');
        setOutput(undefined);
        setConfirm(null);
      },
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    polishMutation.mutate({ input: input.trim(), useCase, tone });
  };

  const handleClear = () => {
    setInput('');
    setOutput(undefined);
    polishMutation.reset();
  };

  const showOutputMobile = hasOutput || isLoading;

  return (
    /*
     * WCAG 2.4.1 – id="main-content" als Ziel des Skip-Links aus App.tsx.
     * WCAG 1.3.6 – <main> als Hauptinhalt-Landmark.
     */
    <main
      id="main-content"
      className="flex-1 overflow-auto lg:overflow-hidden flex flex-col lg:flex-row bg-canvas"
    >
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={confirm?.onConfirm ?? dismissConfirm}
        onCancel={dismissConfirm}
      />
      <div className="flex flex-col lg:flex-1 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-edge">
        <TextPolisherInputPanel
          useCase={useCase}
          tone={tone}
          input={input}
          isLoading={isLoading}
          error={polishMutation.error instanceof Error ? polishMutation.error : null}
          onUseCaseChange={handleUseCaseChange}
          onToneChange={setTone}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      </div>

      <div
        className={`flex flex-col lg:flex-1 lg:overflow-y-auto ${!showOutputMobile ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}
      >
        <TextPolisherOutputPanel
          useCase={useCase}
          output={output}
          isLoading={isLoading}
          contentRef={outputRef}
        />
        {coachVisible && (
          <div className="px-6 pb-6">
            <CoachPanel
              config={POLISH_COACH_CONFIG}
              onDismiss={dismissCoach}
              onDismissForever={dismissForever}
              onNavigate={navigate}
              onStepToggle={(id) =>
                setToggledSteps((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                })
              }
              toggledSteps={toggledSteps}
            />
          </div>
        )}
      </div>
    </main>
  );
}
