import { useEffect, useRef, type FormEvent } from 'react';
import { usePolishText } from '../hooks/useTextPolisher';
import { useSessionState } from '../hooks/useSessionState';
import type { UseCase, Tone } from '../hooks/useTextPolisher';
import { TextPolisherInputPanel } from '../components/text-polisher/TextPolisherInputPanel';
import { TextPolisherOutputPanel } from '../components/text-polisher/TextPolisherOutputPanel';

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
  const [useCase, setUseCase] = useSessionState<UseCase>('tp_use_case', 'email');
  const [tone, setTone] = useSessionState<Tone>('tp_tone', 'formell');
  const [input, setInput] = useSessionState<string>('tp_input', '');
  const [output, setOutput] = useSessionState<string | undefined>('tp_output', undefined);
  const polishMutation = usePolishText();

  const outputRef = useRef<HTMLDivElement>(null);
  const wasLoading = useRef(false);

  const hasOutput = !!output;
  const isLoading = polishMutation.isPending;

  // Persist API result to sessionStorage so it survives navigation.
  useEffect(() => {
    if (polishMutation.data) setOutput(polishMutation.data);
  }, [polishMutation.data, setOutput]);

  // WCAG 2.4.3 – Focus Order: nach erfolgreicher Generierung Fokus auf Output-Panel.
  useEffect(() => {
    if (wasLoading.current && !isLoading && polishMutation.data) {
      outputRef.current?.focus();
    }
    wasLoading.current = isLoading;
  }, [isLoading, polishMutation.data]);

  const handleUseCaseChange = (newCase: UseCase) => {
    if (newCase === useCase) return;
    if (
      hasOutput &&
      !window.confirm(
        'Beim Wechsel des Use Cases wird der aktuelle Output gelöscht. Fortfahren?',
      )
    ) {
      return;
    }
    polishMutation.reset();
    setUseCase(newCase);
    setTone('formell');
    setOutput(undefined);
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
      </div>
    </main>
  );
}
