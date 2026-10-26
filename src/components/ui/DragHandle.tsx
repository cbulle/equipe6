import clsx from 'clsx';
import { GripVertical } from 'lucide-react';
import type { HTMLAttributes } from 'react';

interface DragHandleProps extends HTMLAttributes<HTMLButtonElement> {
  label: string;
  /** `inverted` for a handle placed on a dark background. */
  tone?: 'default' | 'inverted';
}

/** Grip used with `useSortableList`: drag it with the mouse or a finger, or focus it and use the arrow keys. */
export function DragHandle({ label, tone = 'default', className, ...rest }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg transition-colors select-none active:cursor-grabbing',
        tone === 'inverted'
          ? 'text-white/60 hover:bg-white/10 hover:text-white'
          : 'text-slate-400 hover:bg-brand-100 hover:text-brand-800',
        className,
      )}
      {...rest}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
