import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'fire';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm shadow-brand-900/10 hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-md active:translate-y-0 active:bg-brand-900',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:ring-brand-300',
  ghost: 'text-brand-700 hover:bg-brand-100',
  danger: 'bg-white text-fire-700 ring-1 ring-inset ring-fire-200 hover:-translate-y-0.5 hover:bg-fire-50',
  fire: 'bg-fire-600 text-white shadow-sm shadow-fire-700/10 hover:-translate-y-0.5 hover:bg-fire-700 hover:shadow-md',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export const buttonClassName = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') =>
  clsx(
    'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 whitespace-nowrap',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
  );

export const inputClassName = clsx(
  'block w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3 text-sm text-slate-900 shadow-xs',
  'placeholder:text-slate-400 transition-all duration-200',
  'focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
);
