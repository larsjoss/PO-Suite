import type { ReactNode } from 'react';

type CardAs = 'div' | 'article' | 'li';

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: CardAs;
  'aria-label'?: string;
}

interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', as: Tag = 'div', 'aria-label': ariaLabel }: CardProps) {
  return (
    <Tag
      className={`bg-surface border border-edge rounded-xl ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return <div className={`px-5 pt-5 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: CardSectionProps) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-5 pb-5 pt-3 border-t border-edge ${className}`}>{children}</div>
  );
}
