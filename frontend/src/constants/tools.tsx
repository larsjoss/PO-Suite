import type { FC } from 'react';

export type ToolCategory = 'concept' | 'quality' | 'docs' | 'polish';

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  concept: 'Anforderung & Konzept',
  quality: 'Qualität & Test',
  docs: 'Dokumentation',
  polish: 'Sprache & Form',
};

export const CATEGORY_CHIP_LABELS: Record<ToolCategory, string> = {
  concept: 'Konzept',
  quality: 'Qualität',
  docs: 'Doku',
  polish: 'Form',
};

export const CATEGORY_ORDER: ToolCategory[] = ['concept', 'quality', 'docs', 'polish'];

export interface ToolDef {
  id: string;
  path: string;
  navLabel: string;
  title: string;
  description: string;
  Icon: FC<{ className?: string }>;
  category: ToolCategory;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function StoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TextPolisherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TestCaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2zm5-16v4a1 1 0 001 1h4M9 13h6M9 17h4" />
    </svg>
  );
}

function GoalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="5" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="1.5" strokeWidth={1.5} />
    </svg>
  );
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export const TOOLS: ToolDef[] = [
  {
    id: 'story-generator',
    path: '/tools/story-generator',
    navLabel: 'Story',
    title: 'Story Generator',
    description:
      'Wandelt Anforderungen in strukturierte Storys mit Akzeptanzkriterien um und liefert Hinweise fürs Refinement.',
    Icon: StoryIcon,
    category: 'concept',
  },
  {
    id: 'goal-generator',
    path: '/tools/goal-generator',
    navLabel: 'Goal',
    title: 'Goal Generator',
    description:
      'Outcome-orientierte Sprint Goals und PI Objectives formulieren – mit Qualitätsbegründung und Verfeinerungsloop.',
    Icon: GoalIcon,
    category: 'concept',
  },
  {
    id: 'test-case-generator',
    path: '/tools/test-case-generator',
    navLabel: 'Test Case',
    title: 'Test Case Generator',
    description:
      'Erstellt strukturierte Testpläne mit AK-Coverage aus User Stories — optional mit UI-Screenshots.',
    Icon: TestCaseIcon,
    category: 'quality',
  },
  {
    id: 'doc-generator',
    path: '/tools/doc-generator',
    navLabel: 'Doc',
    title: 'Doc Generator',
    description:
      'Fachtechnische Dokumentation aus User Stories und Features für Confluence generieren.',
    Icon: DocIcon,
    category: 'docs',
  },
  {
    id: 'text-polisher',
    path: '/tools/text-polisher',
    navLabel: 'Polisher',
    title: 'Text Polisher',
    description:
      'Bereitet Texte, Meetingnotizen & E-Mail Entwürfe sprachlich und strukturell auf.',
    Icon: TextPolisherIcon,
    category: 'polish',
  },
];
