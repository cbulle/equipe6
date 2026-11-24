import { UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppLogo } from '@/components/layout/AppLogo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormFields';
import { useAuth } from '@/hooks/useAuth';
import { registerUser, type SelfRegistrationRole } from '@/services/userService';
import { getErrorMessage } from '@/utils/errors';

const MIN_PASSWORD_LENGTH = 8;

export function RegisterPage() {
  const { t } = useTranslation();
  const { firebaseUser, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [role, setRole] = useState<SelfRegistrationRole>('trainee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!loading && firebaseUser && profile) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!lastName.trim() || !firstName.trim()) {
      setErrorMessage(t('auth.requiredNames'));
      return;
    }

    setPending(true);
    try {
      await registerUser({ lastName, firstName, email, role }, password);
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-brand-50">
      <header className="flex h-16 items-center justify-between border-b border-brand-200 bg-white px-4 sm:px-8">
        <AppLogo />
        <LanguageSwitcher className="text-slate-600" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-brand-200/70 md:grid-cols-[0.72fr_1.28fr]">
          <div className="relative hidden overflow-hidden bg-brand-800 p-9 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute -right-20 -bottom-20 size-64 rounded-full bg-fire-500/20" />
            <div className="relative">
              <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight">{t('auth.registerTitle')}</h2>
            </div>
            <p className="relative text-sm leading-6 text-brand-100">{t('auth.registerHint')}</p>
          </div>
          <div className="p-6 sm:p-9">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t('auth.registerHint')}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label={t('auth.lastName')}
                autoComplete="family-name"
                required
                autoFocus
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
              <TextField
                label={t('auth.firstName')}
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
              <SelectField
                label={t('auth.role')}
                value={role}
                onChange={(event) =>
                  setRole(event.target.value === 'trainer' ? 'trainer' : 'trainee')
                }
              >
                <option value="trainee">{t('roles.trainee')}</option>
                <option value="trainer">{t('roles.trainer')}</option>
              </SelectField>
              <TextField
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                required
                hint={t('auth.personalEmailHint')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                label={t('auth.password')}
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                hint={t('auth.passwordHint', { count: MIN_PASSWORD_LENGTH })}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {errorMessage && (
                <p role="alert"                 className="rounded-lg bg-fire-50 px-3 py-2.5 text-sm text-fire-700">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" loading={pending} icon={<UserPlus className="size-4" />}>
                {t('auth.register')}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="font-medium text-brand-700 hover:text-brand-900">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
