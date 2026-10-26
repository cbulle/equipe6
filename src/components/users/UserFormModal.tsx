import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useAuth';
import { referentGroupIdsOf } from '@/services/groupService';
import { createUserAccount, sendUserPasswordReset, updateUserProfile, type UserProfileInput } from '@/services/userService';
import { APPRENTICE_TYPES, USER_ROLES, type Group, type UserProfile, type UserRole } from '@/types/models';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';
import { Button } from '../ui/Button';
import { CheckboxField, SelectField, TextField } from '../ui/FormFields';
import { Modal } from '../ui/Modal';

const MIN_PASSWORD_LENGTH = 8;

interface UserFormModalProps {
  user: UserProfile | null;
  groups: Group[];
  onClose: () => void;
}

export function UserFormModal({ user, groups, onClose }: UserFormModalProps) {
  const { t } = useTranslation();
  const { uid } = useCurrentUser();
  const [form, setForm] = useState<UserProfileInput>({
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    role: user?.role ?? 'trainee',
    apprenticeType: user?.apprenticeType ?? 'SPV',
    groupId: user?.groupId ?? null,
    fireStation: user?.fireStation ?? '',
    active: user?.active ?? true,
  });
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const isTrainee = form.role === 'trainee';
  // An administrator cannot change their own role or deactivate themselves (see firestore.rules).
  const isSelf = user?.id === uid;

  const updateField = <K extends keyof UserProfileInput>(key: K, value: UserProfileInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const input: UserProfileInput = {
        ...form,
        apprenticeType: isTrainee ? form.apprenticeType : null,
        groupId: isTrainee ? form.groupId : null,
      };
      if (user) {
        const { email: _email, ...profile } = input;
        await updateUserProfile(user.id, profile, referentGroupIdsOf(user.id, groups));
        toast.success(t('users.updated'));
      } else {
        await createUserAccount(input, password);
        toast.success(t('users.created'));
      }
      onClose();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user) {
      return;
    }
    try {
      await sendUserPasswordReset(user.email);
      toast.success(t('users.resetEmailSent', { email: user.email }));
    } catch (error) {
      notifyError(error);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title={user ? t('users.editTitleNamed', { name: fullName(user) }) : t('users.createTitle')}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase sm:col-span-2">
            {t('users.sections.identity')}
          </h3>
          <TextField
            label={t('users.fields.firstName')}
            required
            value={form.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
          <TextField
            label={t('users.fields.lastName')}
            required
            value={form.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
          <TextField
            label={t('users.fields.fireStation')}
            placeholder={t('users.fields.fireStationPlaceholder')}
            className="sm:col-span-2"
            value={form.fireStation}
            onChange={(event) => updateField('fireStation', event.target.value)}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase sm:col-span-2">
            {t('users.sections.account')}
          </h3>
          <TextField
            label={t('users.fields.email')}
            type="email"
            required
            disabled={Boolean(user)}
            hint={user ? t('users.emailLockedHint') : undefined}
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {user ? (
            <div>
              <p className="mb-1 block text-sm font-medium text-slate-700">{t('users.fields.password')}</p>
              <Button variant="secondary" icon={<KeyRound className="size-4" />} onClick={() => void handlePasswordReset()}>
                {t('users.sendPasswordReset')}
              </Button>
            </div>
          ) : (
            <TextField
              label={t('users.fields.password')}
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              hint={t('users.passwordHint', { count: MIN_PASSWORD_LENGTH })}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
          <SelectField
            label={t('users.fields.role')}
            disabled={isSelf}
            hint={isSelf ? t('users.ownRoleLockedHint') : undefined}
            value={form.role}
            onChange={(event) => updateField('role', event.target.value as UserRole)}
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </SelectField>
          {user && !isSelf && (
            <CheckboxField
              label={t('users.fields.active')}
              description={t('users.activeHint')}
              checked={form.active}
              onChange={(event) => updateField('active', event.target.checked)}
            />
          )}
        </section>

        {isTrainee && (
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase sm:col-span-2">
              {t('users.sections.training')}
            </h3>
            <SelectField
              label={t('users.fields.apprenticeType')}
              value={form.apprenticeType ?? 'SPV'}
              onChange={(event) => updateField('apprenticeType', event.target.value as UserProfileInput['apprenticeType'])}
            >
              {APPRENTICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`apprenticeTypes.long.${type}`)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label={t('users.fields.group')}
              value={form.groupId ?? ''}
              onChange={(event) => updateField('groupId', event.target.value || null)}
            >
              <option value="">{t('groups.noGroup')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </SelectField>
          </section>
        )}
      </div>
    </Modal>
  );
}
