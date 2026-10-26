import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('size-5 animate-spin text-brand-500', className)} aria-hidden />;
}

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <Spinner className="size-8" />
      <span className="text-sm">{t('common.loading')}</span>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 rounded-sm bg-brand-100 p-3 text-brand-600">{icon}</div>}
      <p className="font-medium text-brand-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ProgressBar({ percent, tone = 'brand' }: { percent: number; tone?: 'brand' | 'success' | 'danger' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm bg-brand-100">
      <div
        className={clsx('h-full rounded-sm transition-all', { brand: 'bg-brand-600', success: 'bg-emerald-600', danger: 'bg-fire-600' }[tone])}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
