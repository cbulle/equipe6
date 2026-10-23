import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: 'neutral' | 'danger';
}

export function IconButton({ label, icon, tone = 'neutral', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'danger' ? 'text-fire-600 hover:bg-fire-50' : 'text-slate-500 hover:bg-brand-100 hover:text-brand-800',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
