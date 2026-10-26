import { ChevronRight, MapPin, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ApprenticeTypeBadge } from '@/components/shared/DomainBadges';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { inputClassName } from '@/components/ui/styles';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useGroups, useTrainees } from '@/hooks/useAppData';
import { APPRENTICE_TYPES, type ApprenticeType } from '@/types/models';
import { fullName, matchesSearch } from '@/utils/names';

const ALL = '__all__';
const NO_GROUP = '__none__';

export function TraineesPage() {
  const { t } = useTranslation();
  const { data: trainees, loading } = useTrainees();
  const { data: groups } = useGroups();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState<ApprenticeType | typeof ALL>(ALL);

  const groupLabels = useMemo(() => new Map(groups.map((group) => [group.id, group.label])), [groups]);

  const visibleTrainees = trainees.filter(
    (trainee) =>
      matchesSearch(search, trainee.firstName, trainee.lastName, trainee.fireStation) &&
      (groupFilter === ALL || (groupFilter === NO_GROUP ? !trainee.groupId : trainee.groupId === groupFilter)) &&
      (typeFilter === ALL || trainee.apprenticeType === typeFilter),
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader title={t('trainees.title')} description={t('trainees.description', { count: trainees.length })} />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder={t('trainees.searchPlaceholder')} />
        <select
          aria-label={t('trainees.filterGroup')}
          className={inputClassName}
          value={groupFilter}
          onChange={(event) => setGroupFilter(event.target.value)}
        >
          <option value={ALL}>{t('trainees.allGroups')}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
          <option value={NO_GROUP}>{t('groups.noGroup')}</option>
        </select>
        <select
          aria-label={t('trainees.filterType')}
          className={inputClassName}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as ApprenticeType | typeof ALL)}
        >
          <option value={ALL}>{t('trainees.allTypes')}</option>
          {APPRENTICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`apprenticeTypes.short.${type}`)}
            </option>
          ))}
        </select>
      </div>

      {visibleTrainees.length === 0 ? (
        <EmptyState icon={<UsersRound className="size-6" />} title={t('trainees.empty')} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTrainees.map((trainee) => (
            <Link
              key={trainee.id}
              to={`/trainees/${trainee.id}`}
              className="group flex items-center gap-3 rounded-sm bg-white p-4 ring-1 ring-brand-200 transition-colors hover:bg-brand-50 hover:ring-brand-500"
            >
              <Avatar person={trainee} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-brand-900">{fullName(trainee)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <ApprenticeTypeBadge type={trainee.apprenticeType} />
                  {trainee.groupId ? (
                    <Badge tone="neutral">{groupLabels.get(trainee.groupId) ?? '—'}</Badge>
                  ) : (
                    <Badge tone="warning">{t('groups.noGroup')}</Badge>
                  )}
                  {trainee.active === false && <Badge tone="fire">{t('users.inactive')}</Badge>}
                </div>
                {trainee.fireStation && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="size-3" />
                    {trainee.fireStation}
                  </p>
                )}
              </div>
              <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
