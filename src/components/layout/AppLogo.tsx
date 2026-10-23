import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AppLogo({ inverted = false }: { inverted?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-fire-600 text-white shadow-sm">
        <Flame className="size-5" />
      </span>
      <span className="leading-tight">
        <span className={inverted ? 'block font-bold text-white' : 'block font-bold text-brand-900'}>
          {t('app.name')}
        </span>
        <span className={inverted ? 'block text-xs text-brand-200' : 'block text-xs text-slate-500'}>
          {t('app.tagline')}
        </span>
      </span>
    </div>
  );
}
