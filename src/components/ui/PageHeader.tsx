import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && <div className="mb-2">{back}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 border-l-4 border-brand-700 pl-3">
          <h1 className="text-xl font-bold text-brand-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
