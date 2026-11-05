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
      <header className="flex items-center justify-between border-b-4 border-fire-600 bg-brand-800 px-4 py-3 sm:px-6">
        <AppLogo inverted />
        <LanguageSwitcher className="text-brand-100" />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-sm bg-white p-6 ring-1 ring-brand-200 sm:p-8">
            <h1 className="border-l-4 border-brand-700 pl-3 text-xl font-bold text-brand-900">
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t('auth.registerHint')}</p>

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
                <p role="alert" className="rounded-lg bg-fire-50 px-3 py-2 text-sm text-fire-700">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" loading={pending} icon={<UserPlus className="size-4" />}>
                {t('auth.register')}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-900 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">{t('app.footer')}</p>
        </div>
      </div>
    </div>
  );
}
