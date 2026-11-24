import clsx from 'clsx';
import { ArrowRight, CalendarDays, ExternalLink, FileText, FolderOpen, UsersRound, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SessionDetailsModal } from '@/components/sessions/SessionDetailsModal';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { useModules, useResources, useSessions, useTrainees } from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import type { Resource, TrainingModule, TrainingSession } from '@/types/models';
import { formatDate, parseIsoDate, todayIsoDate } from '@/utils/dates';
import { getLinkHost } from '@/utils/links';

const UPCOMING_SESSIONS_COUNT = 3;

function StatTile({ icon: Icon, label, value }: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-brand-950">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function UpcomingSessions({
  sessions,
  resources,
  modules,
}: {
  sessions: TrainingSession[];
  resources: Resource[];
  modules: TrainingModule[];
}) {
  const { t } = useTranslation();
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const today = todayIsoDate();
  const upcoming = sessions.filter((session) => session.date >= today).slice(0, UPCOMING_SESSIONS_COUNT);

  return (
    <>
      <Card>
        <CardHeader
          icon={<CalendarDays className="size-5" />}
          title={t('dashboard.upcomingSessions')}
          tone="brand"
          actions={
            <Link
              to="/calendar"
              aria-label={t('dashboard.seeCalendar')}
              className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-brand-100"
            >
              <span className="hidden sm:inline">{t('dashboard.seeCalendar')}</span>
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <EmptyState title={t('dashboard.noUpcomingSessions')} />
        ) : (
          <ul className="divide-y divide-brand-100">
            {upcoming.map((session) => {
              const isToday = session.date === today;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSession(session)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-700 sm:px-5"
                  >
                    <span
                      className={clsx(
                        'flex w-12 shrink-0 flex-col items-center rounded-sm border py-1 leading-tight',
                        isToday
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-brand-200 bg-brand-50 text-brand-900',
                      )}
                    >
                      <span className="text-lg font-bold">{parseIsoDate(session.date).getDate()}</span>
                      <span className="text-[11px] uppercase">{formatDate(session.date, { month: 'short' })}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-brand-900">{session.title}</span>
                      <span className="block text-xs text-slate-500 first-letter:uppercase">
                        {isToday ? t('dashboard.today') : formatDate(session.date, { weekday: 'long' })}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {selectedSession && (
        <SessionDetailsModal
          sessions={[selectedSession]}
          title={formatDate(selectedSession.date, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          modules={modules}
          resources={resources}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </>
  );
}

function LatestResources({ resources, modules }: { resources: Resource[]; modules: TrainingModule[] }) {
  const { t } = useTranslation();
  const latestResources = resources.slice(0, 3);
  const modulesById = useMemo(() => new Map(modules.map((trainingModule) => [trainingModule.id, trainingModule])), [modules]);

  return (
    <Card>
      <CardHeader
        icon={<FolderOpen className="size-5" />}
        title={t('resources.title')}
        tone="brand"
        actions={
          <Link
            to="/resources"
            aria-label={t('dashboard.seeResources')}
            className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-brand-100"
          >
            <span className="hidden sm:inline">{t('dashboard.seeResources')}</span>
            <ArrowRight className="size-4" />
          </Link>
        }
      />
      {latestResources.length === 0 ? (
        <EmptyState icon={<FolderOpen className="size-6" />} title={t('resources.empty')} />
      ) : (
        <ul className="divide-y divide-brand-100">
          {latestResources.map((resource) => {
            const trainingModule = resource.moduleId ? modulesById.get(resource.moduleId) : undefined;
            return (
              <li key={resource.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-fire-50 text-fire-600">
                  <FileText className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium text-brand-900 hover:underline"
                  >
                    {resource.title}
                  </a>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {trainingModule && <Badge tone="brand">{trainingModule.code}</Badge>}
                    <span className="truncate">{getLinkHost(resource.url)}</span>
                  </div>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t('resources.open')}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-brand-100 hover:text-brand-800"
                >
                  <ExternalLink className="size-4" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function StaffDashboard({
  sessions,
  resources,
  modules,
}: {
  sessions: TrainingSession[];
  resources: Resource[];
  modules: TrainingModule[];
}) {
  const { t } = useTranslation();
  const { data: trainees } = useTrainees();
  const activeTrainees = trainees.filter((trainee) => trainee.active !== false);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.65fr)_minmax(0,1.35fr)]">
      <StatTile icon={UsersRound} label={t('dashboard.activeTrainees')} value={activeTrainees.length} />
      <div className="space-y-5">
        <UpcomingSessions sessions={sessions} resources={resources} modules={modules} />
        <LatestResources resources={resources} modules={modules} />
      </div>
    </div>
  );
}

function TraineeDashboard({
  sessions,
  resources,
  modules,
}: {
  sessions: TrainingSession[];
  resources: Resource[];
  modules: TrainingModule[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <UpcomingSessions sessions={sessions} resources={resources} modules={modules} />
      <LatestResources resources={resources} modules={modules} />
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { isStaff } = useAuth();
  const { profile } = useCurrentUser();
  const { data: sessions, loading } = useSessions();
  const { data: resources, loading: resourcesLoading } = useResources();
  const { data: modules, loading: modulesLoading } = useModules();

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { name: profile.firstName })}
      />
      {loading || resourcesLoading || modulesLoading ? (
        <PageLoader />
      ) : isStaff ? (
        <StaffDashboard sessions={sessions} resources={resources} modules={modules} />
      ) : (
        <TraineeDashboard sessions={sessions} resources={resources} modules={modules} />
      )}
    </>
  );
}
