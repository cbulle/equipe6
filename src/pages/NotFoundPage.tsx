import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buttonClassName } from '@/components/ui/styles';
import { EmptyState } from '@/components/ui/Feedback';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Compass className="size-6" />}
      title={t('notFound.title')}
      description={t('notFound.description')}
      action={
        <Link to="/" className={buttonClassName('primary')}>
          {t('notFound.backHome')}
        </Link>
      }
    />
  );
}
