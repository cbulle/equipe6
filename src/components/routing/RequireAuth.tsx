import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/Button';
import { EmptyState, PageLoader } from '../ui/Feedback';

export function RequireAuth() {
  const { t } = useTranslation();
  const { firebaseUser, profile, role, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile || !role) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <EmptyState
          icon={<ShieldAlert className="size-6" />}
          title={t('auth.accountNotConfigured')}
          description={t('auth.accountNotConfiguredHint')}
          action={
            <Button variant="secondary" onClick={() => void signOut()}>
              {t('auth.signOut')}
            </Button>
          }
        />
      </div>
    );
  }

  return <Outlet />;
}
