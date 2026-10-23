import {
  ArrowRight,
  BookMarked,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ListChecks,
  MessagesSquare,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookletHeader } from '@/components/booklet/BookletHeader';
import { SessionCard } from '@/components/sessions/SessionCard';
import { buttonClassName } from '@/components/ui/styles';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, PageLoader, ProgressBar } from '@/components/ui/Feedback';
import {
  useCompetencies,
  useGroups,
  useModules,
  useSessions,
  useTrainees,
  useUserAttendances,
  useUserEvaluations,
} from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import type { TrainingSession, UserProfile } from '@/types/models';
import { todayIsoDate } from '@/utils/dates';
import {
  computeAttendanceProgress,
  computeLevelProgress,
  getApplicableModules,
  type Progress,
} from '@/utils/training';

const UPCOMING_SESSIONS_COUNT = 3;

function StatTile({ icon: Icon, label, value, footer }: { icon: LucideIcon; label: string; value: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-brand-900">{value}</p>
        </div>
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}

function ProgressTile({ icon, label, progress }: { icon: LucideIcon; label: string; progress: Progress }) {
  return (
    <StatTile
      icon={icon}
      label={label}
      value={`${progress.percent}%`}
      footer={
        <div className="flex items-center gap-2">
          <ProgressBar percent={progress.percent} tone={progress.percent === 100 ? 'success' : 'brand'} />
          <span className="text-xs whitespace-nowrap text-slate-500">
            {progress.done}/{progress.total}
          </span>
        </div>
      }
    />
  );
}

function UpcomingSessions({ sessions, showRollCall }: { sessions: TrainingSession[]; showRollCall: boolean }) {
  const { t } = useTranslation();
  const today = todayIsoDate();
  const upcoming = sessions.filter((session) => session.date >= today).slice(0, UPCOMING_SESSIONS_COUNT);

  return (
    <Card>
      <CardHeader
        icon={<CalendarDays className="size-5" />}
        title={t('dashboard.upcomingSessions')}
        actions={
          <Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-900">
            {t('dashboard.seeCalendar')}
            <ArrowRight className="size-4" />
          </Link>
        }
      />
      <div className="space-y-3 p-4">
        {upcoming.length === 0 ? (
          <EmptyState title={t('dashboard.noUpcomingSessions')} />
        ) : (
          upcoming.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              actions={
                showRollCall && (
                  <Link to={`/sessions/${session.id}/roll-call`} className={buttonClassName('fire', 'sm')}>
                    <ClipboardCheck className="size-4" />
                    {t('calendar.rollCall')}
                  </Link>
                )
              }
            />
          ))
        )}
      </div>
    </Card>
  );
}

function TraineeDashboard({ profile, sessions }: { profile: UserProfile; sessions: TrainingSession[] }) {
  const { t } = useTranslation();
  const { data: modules } = useModules();
  const { data: competencies } = useCompetencies();
  const { data: evaluations } = useUserEvaluations(profile.id);
  const { data: attendances } = useUserAttendances(profile.id);

  const gridModuleIds = new Set(getApplicableModules(modules, profile.apprenticeType, 'levels').map((trainingModule) => trainingModule.id));
  const gridCompetencies = competencies.filter((competency) => competency.active && gridModuleIds.has(competency.moduleId));

  const shortcuts: { tab: string; label: string; icon: LucideIcon }[] = [
    { tab: 'skills', label: t('booklet.tabs.skills'), icon: ListChecks },
    { tab: 'interviews', label: t('booklet.tabs.interviews'), icon: MessagesSquare },
    { tab: 'wishes', label: t('booklet.tabs.wishes'), icon: BookMarked },
  ];

  return (
    <div className="space-y-6">
      <BookletHeader trainee={profile} />
      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressTile
          icon={ListChecks}
          label={t('dashboard.skillsProgress')}
          progress={computeLevelProgress(gridCompetencies, evaluations)}
        />
        <ProgressTile
          icon={CalendarCheck}
          label={t('dashboard.attendanceRate')}
          progress={computeAttendanceProgress(sessions, attendances)}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <UpcomingSessions sessions={sessions} showRollCall={false} />
        <Card>
          <CardHeader icon={<BookMarked className="size-5" />} title={t('dashboard.myBooklet')} />
          <div className="flex flex-col gap-2 p-4">
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.tab}
                to={`/my-booklet?tab=${shortcut.tab}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-800 ring-1 ring-brand-100 hover:bg-brand-50"
              >
                <shortcut.icon className="size-4 text-brand-500" />
                <span className="flex-1">{shortcut.label}</span>
                <ArrowRight className="size-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StaffDashboard({ sessions }: { sessions: TrainingSession[] }) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { data: trainees } = useTrainees();
  const { data: groups } = useGroups();
  const today = todayIsoDate();
  const traineesWithoutGroup = trainees.filter((trainee) => !trainee.groupId && trainee.active !== false);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={UsersRound} label={t('dashboard.activeTrainees')} value={trainees.filter((trainee) => trainee.active !== false).length} />
        <StatTile icon={UsersRound} label={t('dashboard.groups')} value={groups.filter((group) => group.active).length} />
        <StatTile
          icon={CalendarDays}
          label={t('dashboard.remainingSessions')}
          value={sessions.filter((session) => session.date >= today).length}
        />
      </div>

      {isAdmin && traineesWithoutGroup.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center">
          <UserPlus className="size-5 shrink-0 text-amber-700" />
          <p className="flex-1 text-sm text-amber-900">
            {t('dashboard.traineesWithoutGroup', { count: traineesWithoutGroup.length })}
          </p>
          <Link to="/admin/groups" className={buttonClassName('secondary', 'sm')}>
            {t('dashboard.assignGroups')}
          </Link>
        </div>
      )}

      <UpcomingSessions sessions={sessions} showRollCall />
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-900">{t('dashboard.greeting', { name: profile.firstName })}</h1>
        <p className="text-sm text-slate-500">{t(isStaff ? 'dashboard.staffSubtitle' : 'dashboard.traineeSubtitle')}</p>
      </div>
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
