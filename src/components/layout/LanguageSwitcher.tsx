import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={clsx('inline-flex overflow-hidden rounded-sm text-xs font-semibold ring-1 ring-current/30', className)}
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => void i18n.changeLanguage(language)}
          aria-pressed={i18n.resolvedLanguage === language}
          className={clsx(
            'px-2 py-1 uppercase transition-colors',
            i18n.resolvedLanguage === language ? 'bg-white text-brand-900' : 'text-current opacity-70 hover:opacity-100',
          )}
        >
          {language}
        </button>
      ))}
    </div>
  );
}
