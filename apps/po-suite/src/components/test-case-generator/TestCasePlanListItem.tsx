import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { StoredTestPlan } from '../../types';
import { useDeleteTestPlan } from '../../hooks/useTestCasePlans';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

interface Props {
  plan: StoredTestPlan;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Heute, ${time}`;
  if (diffDays === 1) return `Gestern, ${time}`;
  if (diffDays < 7) return `vor ${diffDays} Tagen, ${time}`;
  return `${date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}, ${time}`;
}

export function TestCasePlanListItem({ plan }: Props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const deletePlan = useDeleteTestPlan();
  const isActive = id === plan.id;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    deletePlan.mutate(plan.id, {
      onSuccess: () => {
        if (isActive) navigate('/tools/test-case-generator');
      },
    });
  };

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => navigate(`/tools/test-case-generator/${plan.id}`)}
          aria-label={`Testplan öffnen: ${plan.story_title}`}
          aria-current={isActive ? 'page' : undefined}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors pr-9 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-inset ${
            isActive ? 'bg-brand-light text-brand' : 'hover:bg-edge-2 text-ink'
          }`}
        >
          <span className="text-sm font-medium line-clamp-2 block leading-snug">{plan.story_title}</span>
          <p className="text-xs text-ink-tertiary mt-1">{formatDate(plan.createdAt)}</p>
        </button>

        <button
          onClick={handleDeleteClick}
          aria-label={`Testplan löschen: ${plan.story_title}`}
          className="
            absolute right-1.5 top-1/2 -translate-y-1/2
            opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100
            p-1.5 rounded
            text-ink-tertiary hover:text-red-600
            transition-all
            focus:outline-none focus:ring-2 focus:ring-red-400
          "
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Testplan löschen"
        message={`Soll der Testplan „${plan.story_title}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
