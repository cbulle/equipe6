import { ArrowLeft, LogIn, MailCheck, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
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
  const [mode, setMode] = useState<'signIn' | 'reset'>('signIn');
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

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

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      setResetSentTo(email.trim());
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  const switchMode = (nextMode: 'signIn' | 'reset') => {
    setMode(nextMode);
    setErrorMessage(null);
    setResetSentTo(null);
  };

  const errorAlert = errorMessage && (
    <p role="alert" className="rounded-lg bg-fire-50 px-3 py-2 text-sm text-fire-700">
      {errorMessage}
    </p>
  );

  const emailField = (
    <TextField
      label={t('auth.email')}
      type="email"
      autoComplete="email"
      required
      autoFocus={mode === 'reset'}
      value={email}
      onChange={(event) => setEmail(event.target.value)}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50">
      <header className="flex items-center justify-between border-b-4 border-fire-600 bg-brand-800 px-4 py-3 sm:px-6">
        <AppLogo inverted />
        <LanguageSwitcher className="text-brand-100" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-sm bg-white p-6 ring-1 ring-brand-200 sm:p-8">
            {mode === 'signIn' ? (
              <>
                <h1 className="border-l-4 border-brand-700 pl-3 text-xl font-bold text-brand-900">{t('auth.welcome')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('auth.signInHint')}</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {emailField}
                  <TextField
                    label={t('auth.password')}
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {errorAlert}
                  <Button type="submit" className="w-full" loading={pending} icon={<LogIn className="size-4" />}>
                    {t('auth.signIn')}
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="mt-4 w-full text-center text-sm text-brand-600 hover:text-brand-900 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </button>
              </>
            ) : (
              <>
                <h1 className="border-l-4 border-brand-700 pl-3 text-xl font-bold text-brand-900">{t('auth.resetTitle')}</h1>
                {resetSentTo ? (
                  <div role="status" className="mt-6 rounded-sm border-l-4 border-emerald-600 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="flex items-center gap-2 font-semibold">
                      <MailCheck className="size-5" />
                      {t('auth.resetEmailSentTitle')}
                    </p>
                    <p className="mt-2">{t('auth.resetEmailSent', { email: resetSentTo })}</p>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-slate-500">{t('auth.resetHint')}</p>
                    <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
                      {emailField}
                      {errorAlert}
                      <Button type="submit" className="w-full" loading={pending} icon={<Send className="size-4" />}>
                        {t('auth.sendResetLink')}
                      </Button>
                    </form>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1 text-sm text-brand-600 hover:text-brand-900 hover:underline"
                >
                  <ArrowLeft className="size-4" />
                  {t('auth.backToSignIn')}
                </button>
              </>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">{t('app.footer')}</p>
        </div>
      </div>
    </div>
  );
}
