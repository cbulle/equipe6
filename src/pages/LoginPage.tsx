import { ArrowLeft, LogIn, MailCheck, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router-dom';
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
    <p role="alert"     className="rounded-lg bg-fire-50 px-3 py-2.5 text-sm text-fire-700">
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
      <header className="flex h-16 items-center justify-between border-b border-brand-200 bg-white px-4 sm:px-8">
        <AppLogo />
        <LanguageSwitcher className="text-slate-600" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-brand-200/70 md:grid-cols-[0.85fr_1fr]">
          <div className="relative hidden overflow-hidden bg-brand-800 p-10 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute -top-20 -right-20 size-64 rounded-full border-[34px] border-fire-500/20" />
            <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-brand-500/15" />
            <div className="relative">
              <h2 className="mt-6 max-w-xs text-4xl font-semibold leading-tight tracking-tight">{t('app.name')}</h2>
            </div>
            <div className="relative flex items-center gap-3 text-sm text-brand-100">
              <span className="size-2 rounded-full bg-fire-400" />
              {t('auth.signInHint')}
            </div>
          </div>
          <div className="p-6 sm:p-9">
            {mode === 'signIn' ? (
              <>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{t('auth.welcome')}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">{t('auth.signInHint')}</p>

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
                  className="mt-4 w-full rounded-md py-2 text-center text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                >
                  {t('auth.forgotPassword')}
                </button>
                <p className="mt-4 text-center text-sm text-slate-600">
                  {t('auth.noAccount')}{' '}
                  <Link to="/register" className="font-medium text-brand-700 hover:text-brand-900">
                    {t('auth.register')}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{t('auth.resetTitle')}</h1>
                {resetSentTo ? (
                  <div role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-md py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <ArrowLeft className="size-4" />
                  {t('auth.backToSignIn')}
                </button>
              </>
            )}
          </div>
        </div>
        <p className="fixed bottom-4 left-1/2 hidden -translate-x-1/2 text-xs text-slate-500 md:block">{t('app.footer')}</p>
      </div>
    </div>
  );
}
