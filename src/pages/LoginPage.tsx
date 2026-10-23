import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLogo } from '@/components/layout/AppLogo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormFields';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/errors';

export function LoginPage() {
  const { t } = useTranslation();
  const { firebaseUser, loading, signIn, sendPasswordReset } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!loading && firebaseUser) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);
    try {
      await signIn(email, password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setErrorMessage(t('auth.enterEmailFirst'));
      return;
    }
    try {
      await sendPasswordReset(email);
      toast.success(t('auth.resetEmailSent'));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <AppLogo />
            <h1 className="mt-6 text-xl font-bold text-brand-900">{t('auth.welcome')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('auth.signInHint')}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                label={t('auth.password')}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {errorMessage && (
                <p role="alert" className="rounded-lg bg-fire-50 px-3 py-2 text-sm text-fire-700">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" variant="fire" className="w-full" loading={pending} icon={<LogIn className="size-4" />}>
                {t('auth.signIn')}
              </Button>
            </form>
            <button
              type="button"
              onClick={handlePasswordReset}
              className="mt-4 w-full text-center text-sm text-brand-600 hover:text-brand-900 hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
          <p className="mt-6 text-center text-xs text-brand-300">{t('app.footer')}</p>
        </div>
      </div>
    </div>
  );
}
