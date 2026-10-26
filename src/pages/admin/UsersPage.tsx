import clsx from 'clsx';
import { Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApprenticeTypeBadge, RoleBadge } from '@/components/shared/DomainBadges';
import { UserFormModal } from '@/components/users/UserFormModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { inputClassName } from '@/components/ui/styles';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useGroups, useUsers } from '@/hooks/useAppData';
import { useCurrentUser } from '@/hooks/useAuth';
import { referentGroupIdsOf } from '@/services/groupService';
import { assignUserToGroup, deleteUserProfile } from '@/services/userService';
import { USER_ROLES, type UserProfile, type UserRole } from '@/types/models';
import { notifyError } from '@/utils/errors';
import { fullName, matchesSearch } from '@/utils/names';

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
                'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                roleFilter === role ? 'bg-brand-800 text-white' : 'bg-white text-slate-600 ring-1 ring-brand-200 hover:bg-brand-50',
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
