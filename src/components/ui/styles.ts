import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'fire';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'bg-white text-brand-800 ring-1 ring-inset ring-slate-300 hover:bg-brand-50 hover:ring-brand-400',
  ghost: 'text-brand-700 hover:bg-brand-100',
  danger: 'bg-white text-fire-700 ring-1 ring-inset ring-fire-200 hover:bg-fire-50',
  fire: 'bg-fire-600 text-white hover:bg-fire-700',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export const buttonClassName = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md') =>
  clsx(
    'inline-flex items-center justify-center rounded-sm font-semibold transition-colors whitespace-nowrap',
    'disabled:cursor-not-allowed disabled:opacity-50',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
  );

export const inputClassName = clsx(
  'block w-full rounded-sm border-0 bg-white px-3 py-2 text-sm text-slate-900',
  'ring-1 ring-inset ring-slate-300 placeholder:text-slate-400',
  'focus:ring-2 focus:ring-brand-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500',
);
