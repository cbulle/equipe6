import { Pencil, Plus, ShieldCheck, Trash2, UserMinus, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ApprenticeTypeBadge } from '@/components/shared/DomainBadges';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { CheckboxField, SelectField, TextField } from '@/components/ui/FormFields';
import { inputClassName } from '@/components/ui/styles';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useGroups, useReferentCandidates, useTrainees } from '@/hooks/useAppData';
import { createGroup, deleteGroup, updateGroup, type GroupInput } from '@/services/groupService';
import { assignUserToGroup } from '@/services/userService';
import type { Group, UserProfile } from '@/types/models';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';

interface GroupFormModalProps {
  group: Group | null;
  referentCandidates: UserProfile[];
  onClose: () => void;
}

/** Referent options, labelled with the role so that administrators stand out from trainers. */
function ReferentOptions({ candidates }: { candidates: UserProfile[] }) {
  const { t } = useTranslation();
  return (
    <>
      <option value="">{t('groups.noReferent')}</option>
      {candidates.map((candidate) => (
        <option key={candidate.id} value={candidate.id}>
          {fullName(candidate)} — {t(`roles.${candidate.role}`)}
        </option>
      ))}
    </>
  );
}

function GroupFormModal({ group, referentCandidates, onClose }: GroupFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<GroupInput>({
    label: group?.label ?? '',
    referentId: group?.referentId ?? null,
    promoYear: group?.promoYear ?? new Date().getFullYear(),
    active: group?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (group) {
        await updateGroup(group.id, form);
      } else {
        await createGroup(form);
      }
      toast.success(t(group ? 'groups.updated' : 'groups.created'));
      onClose();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={t(group ? 'groups.editTitle' : 'groups.createTitle')}
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
      <div className="space-y-4">
        <TextField
          label={t('groups.fields.label')}
          required
          placeholder={t('groups.fields.labelPlaceholder')}
          value={form.label}
          onChange={(event) => setForm((previous) => ({ ...previous, label: event.target.value }))}
        />
        <TextField
          label={t('groups.fields.promoYear')}
          type="number"
          required
          min={2000}
          max={2100}
          value={form.promoYear}
          onChange={(event) => setForm((previous) => ({ ...previous, promoYear: Number(event.target.value) }))}
        />
        <SelectField
          label={t('groups.fields.referent')}
          hint={t('groups.referentHint')}
          value={form.referentId ?? ''}
          onChange={(event) => setForm((previous) => ({ ...previous, referentId: event.target.value || null }))}
        >
          <ReferentOptions candidates={referentCandidates} />
        </SelectField>
        <CheckboxField
          label={t('groups.fields.active')}
          checked={form.active}
          onChange={(event) => setForm((previous) => ({ ...previous, active: event.target.checked }))}
        />
      </div>
    </Modal>
  );
}

interface MemberListProps {
  members: UserProfile[];
  onRemove?: (member: UserProfile) => void;
}

function MemberList({ members, onRemove }: MemberListProps) {
  const { t } = useTranslation();
  if (members.length === 0) {
    return <p className="px-4 py-3 text-sm text-slate-500 sm:px-5">{t('groups.noMembers')}</p>;
  }
  return (
    <ul className="divide-y divide-brand-50">
      {members.map((member) => (
        <li key={member.id} className="flex items-center gap-3 px-4 py-2 sm:px-5">
          <Avatar person={member} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{fullName(member)}</span>
          <ApprenticeTypeBadge type={member.apprenticeType} />
          {onRemove && (
            <IconButton
              label={t('groups.removeMember')}
              tone="danger"
              icon={<UserMinus className="size-4" />}
              onClick={() => onRemove(member)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function GroupsPage() {
  const { t } = useTranslation();
  const { data: groups, loading } = useGroups();
  const { data: trainees } = useTrainees();
  const { data: referentCandidates } = useReferentCandidates();
  const [editedGroup, setEditedGroup] = useState<Group | null | undefined>(undefined);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const membersOf = (groupId: string | null) => trainees.filter((trainee) => (trainee.groupId ?? null) === groupId);
  const unassignedTrainees = membersOf(null);

  const moveTrainee = (traineeId: string, groupId: string | null) => {
    assignUserToGroup(traineeId, groupId).catch(notifyError);
  };

  const handleReferentChange = (group: Group, referentId: string) => {
    updateGroup(group.id, { referentId: referentId || null }).catch(notifyError);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader
        title={t('groups.title')}
        description={t('groups.description')}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setEditedGroup(null)}>
            {t('groups.create')}
          </Button>
        }
      />

      {groups.length === 0 && (
        <Card className="mb-6">
          <EmptyState icon={<UsersRound className="size-6" />} title={t('groups.empty')} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => {
          const members = membersOf(group.id);
          return (
            <Card key={group.id} className="flex flex-col">
              <CardHeader
                icon={<UsersRound className="size-5" />}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {group.label}
                    <Badge tone="neutral">{t('groups.promo', { year: group.promoYear })}</Badge>
                    {!group.active && <Badge tone="fire">{t('groups.inactive')}</Badge>}
                  </span>
                }
                description={t('groups.memberCount', { count: members.length })}
                actions={
                  <>
                    <IconButton label={t('common.edit')} icon={<Pencil className="size-4" />} onClick={() => setEditedGroup(group)} />
                    <IconButton
                      label={t('common.delete')}
                      tone="danger"
                      icon={<Trash2 className="size-4" />}
                      onClick={() => setGroupToDelete(group)}
                    />
                  </>
                }
              />
              <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50/60 px-4 py-2.5 sm:px-5">
                <ShieldCheck className="size-4 shrink-0 text-brand-500" />
                <span className="text-sm font-medium text-slate-600">{t('groups.fields.referent')}</span>
                <select
                  aria-label={t('groups.fields.referent')}
                  className={`${inputClassName} ml-auto h-8 max-w-52 py-1`}
                  value={group.referentId ?? ''}
                  onChange={(event) => handleReferentChange(group, event.target.value)}
                >
                  <ReferentOptions candidates={referentCandidates} />
                </select>
              </div>
              <div className="flex-1">
                <MemberList members={members} onRemove={(member) => moveTrainee(member.id, null)} />
              </div>
              {unassignedTrainees.length > 0 && (
                <div className="border-t border-brand-100 px-4 py-3 sm:px-5">
                  <select
                    aria-label={t('groups.addMember')}
                    className={inputClassName}
                    value=""
                    onChange={(event) => event.target.value && moveTrainee(event.target.value, group.id)}
                  >
                    <option value="">{t('groups.addMember')}</option>
                    {unassignedTrainees.map((trainee) => (
                      <option key={trainee.id} value={trainee.id}>
                        {fullName(trainee)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </Card>
          );
        })}

        <Card className="border-2 border-dashed border-amber-200 shadow-none ring-0">
          <CardHeader
            icon={<UsersRound className="size-5 text-amber-600" />}
            title={t('groups.noGroup')}
            description={t('groups.noGroupDescription', { count: unassignedTrainees.length })}
          />
          <MemberList members={unassignedTrainees} />
        </Card>
      </div>

      {editedGroup !== undefined && (
        <GroupFormModal
          key={editedGroup?.id ?? 'new'}
          group={editedGroup}
          referentCandidates={referentCandidates}
          onClose={() => setEditedGroup(undefined)}
        />
      )}

      <ConfirmDialog
        open={groupToDelete !== null}
        title={t('groups.deleteTitle')}
        message={t('groups.deleteMessage', { label: groupToDelete?.label ?? '' })}
        onConfirm={() =>
          groupToDelete
            ? deleteGroup(
                groupToDelete.id,
                membersOf(groupToDelete.id).map((member) => member.id),
              )
            : Promise.resolve()
        }
        onClose={() => setGroupToDelete(null)}
      />
    </>
  );
}
