import { useTranslation } from 'react-i18next';

export function AppLogo({ inverted = false }: { inverted?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className="block leading-tight">
      <span
        className={
          inverted
            ? 'block text-sm font-semibold tracking-tight text-white'
            : 'block text-sm font-semibold tracking-tight text-brand-900'
        }
      >
        {t('app.name')}
      </span>
    </span>
  );
}
