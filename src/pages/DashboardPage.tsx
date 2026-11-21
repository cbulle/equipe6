import clsx from 'clsx';
import { ArrowRight, CalendarDays, ListChecks, UsersRound, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, PageLoader, ProgressBar } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCompetencies, useModules, useSessions, useTrainees, useUserEvaluations } from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { getModuleCompletions } from '@/services/evaluationService';
import type { TrainingSession, UserProfile } from '@/types/models';
import { formatDate, parseIsoDate, todayIsoDate } from '@/utils/dates';
import { computeLevelProgress } from '@/utils/training';

const UPCOMING_SESSIONS_COUNT = 5;

function StatTile({
  icon: Icon,
  label,
  value,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-brand-700 text-white">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-brand-900">{value}</p>
        </div>
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}

function UpcomingSessions({ sessions }: { sessions: TrainingSession[] }) {
  const { t } = useTranslation();
  const today = todayIsoDate();
  const upcoming = sessions.filter((session) => session.date >= today).slice(0, UPCOMING_SESSIONS_COUNT);

  return (
    <Card>
      <CardHeader
        icon={<CalendarDays className="size-5" />}
        title={t('dashboard.upcomingSessions')}
        actions={
          <Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900">
            {t('dashboard.seeCalendar')}
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
              <li key={session.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <span
                  className={clsx(
                    'flex w-12 shrink-0 flex-col items-center rounded-sm border py-1 leading-tight',
                    isToday ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-brand-50 text-brand-900',
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
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function StaffDashboard({ sessions }: { sessions: TrainingSession[] }) {
  const { t } = useTranslation();
  const { data: trainees } = useTrainees();
  const activeTrainees = trainees.filter((trainee) => trainee.active !== false);

  return (
    <div className="space-y-6">
      <StatTile icon={UsersRound} label={t('dashboard.activeTrainees')} value={activeTrainees.length} />
      <UpcomingSessions sessions={sessions} />
    </div>
  );
}

function TraineeDashboard({ profile, sessions }: { profile: UserProfile; sessions: TrainingSession[] }) {
  const { t } = useTranslation();
  const { data: modules } = useModules();
  const { data: competencies } = useCompetencies();
  const { data: evaluations } = useUserEvaluations(profile.id);

  const gridModuleIds = new Set(modules.map((trainingModule) => trainingModule.id));
  const gridCompetencies = competencies.filter((competency) => competency.active && gridModuleIds.has(competency.moduleId));
  const skills = computeLevelProgress(
    gridCompetencies,
    evaluations,
    new Set(getModuleCompletions(evaluations).map((completion) => completion.moduleId)),
  );

  return (
    <div className="space-y-6">
      <StatTile
        icon={ListChecks}
        label={t('dashboard.skillsProgress')}
        value={`${skills.percent}%`}
        footer={<ProgressBar percent={skills.percent} tone={skills.percent === 100 ? 'success' : 'brand'} />}
      />
      <UpcomingSessions sessions={sessions} />
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { isStaff } = useAuth();
  const { profile } = useCurrentUser();
  const { data: sessions, loading } = useSessions();

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { name: profile.firstName })}
        description={t(isStaff ? 'dashboard.staffSubtitle' : 'dashboard.traineeSubtitle')}
      />
      {loading ? (
        <PageLoader />
      ) : isStaff ? (
        <StaffDashboard sessions={sessions} />
      ) : (
        <TraineeDashboard profile={profile} sessions={sessions} />
      )}
    </>
  );
}
