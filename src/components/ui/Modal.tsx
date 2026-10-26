import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useId, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  /** When provided, the modal body is wrapped in a form (Enter submits). */
  onSubmit?: () => void;
}

export function Modal({ open, title, description, onClose, children, footer, size = 'md', onSubmit }: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  const content = (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-brand-200 bg-brand-50 px-5 py-3 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={clsx(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-sm bg-white shadow-xl ring-1 ring-brand-300 sm:rounded-sm',
          size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-brand-700 bg-brand-100/60 px-5 py-3">
          <div>
            <h2 id={titleId} className="text-base font-bold text-brand-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>
        {onSubmit ? (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            {content}
          </form>
        ) : (
          content
        )}
      </div>
    </div>,
    document.body,
  );
}
