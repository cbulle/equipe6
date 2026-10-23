import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-xl bg-white shadow-sm ring-1 ring-brand-100', className)} {...rest} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ title, description, icon, actions }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-brand-100 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-0.5 text-brand-500">{icon}</div>}
        <div className="min-w-0">
          <h2 className="font-semibold text-brand-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
