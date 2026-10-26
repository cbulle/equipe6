import clsx from 'clsx';
import { Check, Mail, MapPin, Pencil, ShieldCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroup, useGroups, useUser } from '@/hooks/useAppData';
import { useAuth } from '@/hooks/useAuth';
import { APPRENTICE_TYPES, type UserProfile } from '@/types/models';
import { fullName } from '@/utils/names';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { UserFormModal } from '../users/UserFormModal';

export function BookletHeader({ trainee }: { trainee: UserProfile }) {
  const { t } = useTranslation();
  const { data: group } = useGroup(trainee.groupId);
  const { data: referent } = useUser(group?.referentId);
  const { isAdmin } = useAuth();
  const { data: groups } = useGroups();
  const [editing, setEditing] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start">
        <div className="flex flex-1 items-start gap-4">
          <Avatar person={trainee} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-900">{fullName(trainee)}</h1>
              {isAdmin && (
                <Button variant="secondary" size="sm" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
                  {t('booklet.editProfile')}
                </Button>
              )}
            </div>
            <div className="mt-1 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-4">
              {trainee.fireStation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-slate-400" />
                  {trainee.fireStation}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <UsersRound className="size-4 text-slate-400" />
                {group?.label ?? t('groups.noGroup')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4 text-slate-400" />
                {trainee.email}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-brand-50 p-4 md:w-72">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-600 uppercase">
            <ShieldCheck className="size-4" />
            {t('booklet.referent')}
          </p>
          {referent ? (
            <div className="mt-2 text-sm">
              <p className="font-semibold text-brand-900">{fullName(referent)}</p>
              <a href={`mailto:${referent.email}`} className="mt-1 flex items-center gap-1.5 text-brand-700 hover:underline">
                <Mail className="size-3.5" />
                {referent.email}
              </a>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t('booklet.noReferent')}</p>
          )}
        </div>
      </div>

      <div className="border-t border-brand-100 bg-brand-50/50 px-5 py-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{t('booklet.entryStatus')}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {APPRENTICE_TYPES.map((type) => {
            const isChecked = trainee.apprenticeType === type;
            return (
              <span
                key={type}
                className={clsx('inline-flex items-center gap-2 text-sm', isChecked ? 'font-semibold text-brand-900' : 'text-slate-400')}
              >
                <span
                  className={clsx(
                    'flex size-5 items-center justify-center rounded border',
                    isChecked ? 'border-fire-600 bg-fire-600 text-white' : 'border-slate-300 bg-white',
                  )}
                >
                  {isChecked && <Check className="size-3.5" />}
                </span>
                {t(`apprenticeTypes.long.${type}`)}
              </span>
            );
          })}
        </div>
      </div>

      {editing && <UserFormModal user={trainee} groups={groups} onClose={() => setEditing(false)} />}
    </Card>
  );
}
