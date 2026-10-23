import clsx from 'clsx';
import { KeyRound, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApprenticeTypeBadge, RoleBadge } from '@/components/shared/DomainBadges';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { CheckboxField, SelectField, TextField } from '@/components/ui/FormFields';
import { inputClassName } from '@/components/ui/styles';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useGroups, useUsers } from '@/hooks/useAppData';
import { useCurrentUser } from '@/hooks/useAuth';
import {
  assignUserToGroup,
  createUserAccount,
  deleteUserProfile,
  sendUserPasswordReset,
  updateUserProfile,
  type UserProfileInput,
} from '@/services/userService';
import { APPRENTICE_TYPES, USER_ROLES, type Group, type UserProfile, type UserRole } from '@/types/models';
import { notifyError } from '@/utils/errors';
import { fullName, matchesSearch } from '@/utils/names';

const MIN_PASSWORD_LENGTH = 8;

const referentGroupIdsOf = (userId: string, groups: Group[]) =>
  groups.filter((group) => group.referentId === userId).map((group) => group.id);

interface UserFormModalProps {
  user: UserProfile | null;
  groups: Group[];
  onClose: () => void;
}

function UserFormModal({ user, groups, onClose }: UserFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<UserProfileInput>({
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    role: user?.role ?? 'trainee',
    apprenticeType: user?.apprenticeType ?? 'SPV',
    groupId: user?.groupId ?? null,
    fireStation: user?.fireStation ?? '',
    phone: user?.phone ?? '',
    active: user?.active ?? true,
  });
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const isTrainee = form.role === 'trainee';

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
      title={t(user ? 'users.editTitle' : 'users.createTitle')}
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
      <div className="grid gap-4 sm:grid-cols-2">
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
          value={form.role}
          onChange={(event) => updateField('role', event.target.value as UserRole)}
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('users.fields.phone')}
          type="tel"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
        />
        <TextField
          label={t('users.fields.fireStation')}
          placeholder={t('users.fields.fireStationPlaceholder')}
          value={form.fireStation}
          onChange={(event) => updateField('fireStation', event.target.value)}
        />
        {isTrainee && (
          <>
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
          </>
        )}
        {user && (
          <CheckboxField
            className="sm:col-span-2"
            label={t('users.fields.active')}
            description={t('users.activeHint')}
            checked={form.active}
            onChange={(event) => updateField('active', event.target.checked)}
          />
        )}
      </div>
    </Modal>
  );
}

type RoleFilter = UserRole | 'all';

export function UsersPage() {
  const { t } = useTranslation();
  const { uid } = useCurrentUser();
  const { data: users, loading } = useUsers();
  const { data: groups } = useGroups();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [editedUser, setEditedUser] = useState<UserProfile | null | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const visibleUsers = users.filter(
    (user) =>
      (roleFilter === 'all' || user.role === roleFilter) &&
      matchesSearch(search, user.firstName, user.lastName, user.email, user.fireStation),
  );

  const handleGroupChange = (user: UserProfile, groupId: string) => {
    assignUserToGroup(user.id, groupId || null).catch(notifyError);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <Button icon={<UserPlus className="size-4" />} onClick={() => setEditedUser(null)}>
            {t('users.create')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(['all', ...USER_ROLES] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                roleFilter === role ? 'bg-brand-800 text-white' : 'bg-white text-slate-600 ring-1 ring-brand-100 hover:bg-brand-50',
              )}
            >
              {role === 'all' ? t('common.all') : t(`roles.${role}`)}
              <span className="ml-1.5 opacity-70">
                {role === 'all' ? users.length : users.filter((user) => user.role === role).length}
              </span>
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder={t('users.searchPlaceholder')} className="sm:ml-auto sm:w-72" />
      </div>

      <Card>
        {visibleUsers.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title={t('users.empty')} />
        ) : (
          <ul className="divide-y divide-brand-50">
            {visibleUsers.map((user) => (
              <li key={user.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar person={user} size="sm" tone={user.role === 'trainee' ? 'brand' : 'fire'} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-brand-900">
                      {fullName(user)}
                      <RoleBadge role={user.role} />
                      <ApprenticeTypeBadge type={user.apprenticeType} />
                      {user.active === false && <Badge tone="fire">{t('users.inactive')}</Badge>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                      {user.fireStation && ` · ${user.fireStation}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.role === 'trainee' && (
                    <select
                      aria-label={t('users.fields.group')}
                      className={clsx(inputClassName, 'h-8 w-44 py-1')}
                      value={user.groupId ?? ''}
                      onChange={(event) => handleGroupChange(user, event.target.value)}
                    >
                      <option value="">{t('groups.noGroup')}</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <IconButton label={t('common.edit')} icon={<Pencil className="size-4" />} onClick={() => setEditedUser(user)} />
                  <IconButton
                    label={t('common.delete')}
                    tone="danger"
                    icon={<Trash2 className="size-4" />}
                    disabled={user.id === uid}
                    onClick={() => setUserToDelete(user)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editedUser !== undefined && (
        <UserFormModal key={editedUser?.id ?? 'new'} user={editedUser} groups={groups} onClose={() => setEditedUser(undefined)} />
      )}

      <ConfirmDialog
        open={userToDelete !== null}
        title={t('users.deleteTitle')}
        message={t('users.deleteMessage', { name: userToDelete ? fullName(userToDelete) : '' })}
        onConfirm={() =>
          userToDelete ? deleteUserProfile(userToDelete.id, referentGroupIdsOf(userToDelete.id, groups)) : Promise.resolve()
        }
        onClose={() => setUserToDelete(null)}
      />
    </>
  );
}
