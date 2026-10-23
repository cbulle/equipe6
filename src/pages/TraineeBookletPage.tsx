import { ArrowLeft, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { BookletView } from '@/components/booklet/BookletView';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { useUser } from '@/hooks/useAppData';

export function TraineeBookletPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { data: trainee, loading } = useUser(userId);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <Link to="/trainees" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-900">
        <ArrowLeft className="size-4" />
        {t('nav.trainees')}
      </Link>
      {trainee && trainee.role === 'trainee' ? (
        <BookletView trainee={trainee} />
      ) : (
        <EmptyState icon={<UserX className="size-6" />} title={t('trainees.notFound')} />
      )}
    </>
  );
}
