import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-sm bg-white ring-1 ring-brand-200', className)} {...rest} />;
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ title, description, icon, actions }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-200 bg-brand-100/60 px-4 py-2.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand-700 text-white [&_svg]:size-4">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-bold text-brand-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
