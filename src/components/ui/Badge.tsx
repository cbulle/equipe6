import clsx from 'clsx';
import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'fire' | 'success' | 'warning' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-100 text-brand-800 ring-brand-200',
  fire: 'bg-fire-50 text-fire-700 ring-fire-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  info: 'bg-teal-50 text-teal-800 ring-teal-200',
};

interface BadgeProps {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
