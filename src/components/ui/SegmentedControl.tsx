import clsx from 'clsx';
import type { ReactNode } from 'react';

export type SegmentTone = 'brand' | 'success' | 'danger' | 'warning' | 'info';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  tone?: SegmentTone;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  disabled?: boolean;
  /** Clicking the active option clears the value. */
  allowClear?: boolean;
  compactOnMobile?: boolean;
  ariaLabel: string;
}

const ACTIVE_TONE_CLASSES: Record<SegmentTone, string> = {
  brand: 'bg-brand-700 text-white',
  success: 'bg-emerald-600 text-white',
  danger: 'bg-fire-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-teal-700 text-white',
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  allowClear = false,
  compactOnMobile = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex divide-x divide-slate-300 overflow-hidden rounded-sm ring-1 ring-slate-300">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            title={option.label}
            disabled={disabled}
            onClick={() => onChange(isActive && allowClear ? null : option.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors',
              'disabled:cursor-not-allowed',
              isActive
                ? ACTIVE_TONE_CLASSES[option.tone ?? 'brand']
                : 'bg-white text-slate-600 enabled:hover:bg-brand-50 enabled:hover:text-slate-900',
            )}
          >
            {option.icon}
            <span className={clsx(compactOnMobile && option.icon && 'sr-only sm:not-sr-only')}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
