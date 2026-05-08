import type { ReactNode } from 'react';

interface Props {
  title: string;
  id?: string;
  action?: ReactNode;
}

export function PanelHeader({ title, id, action }: Props) {
  return (
    <div className={`px-5 py-3.5 border-b border-edge shrink-0${action ? ' flex items-center justify-between gap-3' : ''}`}>
      <h2 id={id} className="text-xs font-semibold text-ink-secondary uppercase tracking-widest">
        {title}
      </h2>
      {action}
    </div>
  );
}
