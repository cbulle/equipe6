import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/FormFields';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { updateOwnProfile } from '@/services/userService';
import type { UserProfile } from '@/types/models';
import { notifyError } from '@/utils/errors';
import { toast } from 'sonner';

export function ProfilePage() {
  const { firebaseUser, profile } = useAuth();
  if (!firebaseUser || !profile) {
    return null;
  }

  return <ProfileForm key={firebaseUser.uid} firebaseUser={firebaseUser} profile={profile} />;
}

function ProfileForm({ firebaseUser, profile }: { firebaseUser: User; profile: UserProfile }) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== (firebaseUser.email ?? profile.email).toLowerCase();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateOwnProfile(firebaseUser.uid, { firstName, lastName, email, currentPassword });
      setCurrentPassword('');
      toast.success(t('profile.updated'));
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.hint')} />
      <Card className="max-w-2xl p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label={t('users.fields.firstName')}
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <TextField
            label={t('users.fields.lastName')}
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
          <TextField
            label={t('users.fields.email')}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {emailChanged && (
            <TextField
              label={t('profile.currentPassword')}
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          )}
          <div className="pt-2">
            <Button type="submit" loading={saving} icon={<Save className="size-4" />}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
