import { ChevronRight, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useModules, useTrainees } from '@/hooks/useAppData';
import { fullName, matchesSearch } from '@/utils/names';

export function TraineesPage() {
  const { t } = useTranslation();
  const { data: trainees, loading } = useTrainees();
  const { data: modules, loading: modulesLoading } = useModules();
  const [search, setSearch] = useState('');

  const visibleTrainees = trainees.filter((trainee) => matchesSearch(search, trainee.firstName, trainee.lastName));
  const moduleGroups = modules
    .map((trainingModule) => ({
      trainingModule,
      members: visibleTrainees.filter((trainee) => trainee.moduleId === trainingModule.id),
    }))
    .filter((group) => group.members.length > 0);
  const unassignedTrainees = visibleTrainees.filter(
    (trainee) => !trainee.moduleId || !modules.some((trainingModule) => trainingModule.id === trainee.moduleId),
  );

  if (loading || modulesLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader title={t('trainees.title')} description={t('trainees.description', { count: trainees.length })} />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={t('trainees.searchPlaceholder')} />
      </div>

      {visibleTrainees.length === 0 ? (
        <EmptyState icon={<UsersRound className="size-6" />} title={t('trainees.empty')} />
      ) : (
        <div className="space-y-6">
          {[...moduleGroups, ...(unassignedTrainees.length > 0 ? [{ trainingModule: null, members: unassignedTrainees }] : [])].map(
            (group) => (
              <section key={group.trainingModule?.id ?? 'unassigned'} className="space-y-3">
                <h2 className="text-lg font-semibold text-brand-900">
                  {group.trainingModule
                    ? `${group.trainingModule.code} — ${group.trainingModule.label}`
                    : t('trainees.noGroup')}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.members.map((trainee) => (
                    <Link
                      key={trainee.id}
                      to={`/trainees/${trainee.id}`}
                      className="group flex items-center gap-3 rounded-sm bg-white p-4 ring-1 ring-brand-200 transition-colors hover:bg-brand-50 hover:ring-brand-500"
                    >
                      <Avatar person={trainee} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-brand-900">{fullName(trainee)}</p>
                        <Badge className="mt-1 max-w-full truncate" tone="neutral">
                          {group.trainingModule
                            ? `${group.trainingModule.code} — ${group.trainingModule.label}`
                            : t('trainees.noGroup')}
                        </Badge>
                        {trainee.active === false && (
                          <Badge className="mt-1 ml-1" tone="fire">
                            {t('users.inactive')}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="size-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                    </Link>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </>
  );
}
