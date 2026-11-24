import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-2xl bg-white/95 shadow-sm ring-1 ring-brand-200/60 transition-shadow duration-300', className)} {...rest} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: 'default' | 'brand';
}

export function CardHeader({ title, description, icon, actions, tone = 'default' }: CardHeaderProps) {
  const isBrand = tone === 'brand';
  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 rounded-t-2xl border-b px-5 py-4 sm:px-6',
        isBrand ? 'border-brand-800 bg-brand-800' : 'border-slate-100',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div
            className={clsx(
              'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[18px]',
              isBrand ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-700',
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className={clsx('text-sm font-semibold sm:text-base', isBrand ? 'text-white' : 'text-brand-950')}>{title}</h2>
          {description && <p className={clsx('mt-0.5 text-sm', isBrand ? 'text-brand-100' : 'text-slate-500')}>{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
