import { useTranslation } from 'react-i18next';

export function AppLogo({ inverted = false }: { inverted?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className="block leading-tight">
      <span className={inverted ? 'block font-bold text-white' : 'block font-bold text-brand-900'}>{t('app.name')}</span>
      <span className={inverted ? 'block text-xs text-brand-200' : 'block text-xs text-slate-500'}>{t('app.tagline')}</span>
    </span>
  );
}
