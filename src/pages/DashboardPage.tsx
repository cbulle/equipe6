import clsx from 'clsx';
import { ArrowRight, BarChart3, CalendarCheck, CalendarDays, ClipboardCheck, ListChecks, UsersRound, type LucideIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, PageLoader, ProgressBar } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { inputClassName, buttonClassName } from '@/components/ui/styles';
import {
  useAllAttendances,
  useCompetencies,
  useGroups,
  useModules,
  useSessions,
  useTrainees,
  useUserAttendances,
  useUserEvaluations,
} from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { getModuleCompletions } from '@/services/evaluationService';
import type { Attendance, TrainingSession, UserProfile } from '@/types/models';
import { formatDate, parseIsoDate, todayIsoDate } from '@/utils/dates';
import { fullName } from '@/utils/names';
import {
  computeAttendanceStats,
  computeLevelProgress,
  getApplicableModules,
  toProgress,
  type AttendanceStats,
} from '@/utils/training';

const UPCOMING_SESSIONS_COUNT = 5;
/** Below this attendance rate a trainee is highlighted. */
const LOW_ATTENDANCE_PERCENT = 75;
const ALL_GROUPS = '__all__';
const NO_GROUP = '__none__';

function StatTile({ icon: Icon, label, value, footer }: { icon: LucideIcon; label: string; value: ReactNode; footer?: ReactNode }) {
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

/** Rate + presence / absence / excuse counters, shared by the staff and trainee views. */
function AttendanceStatTiles({ stats }: { stats: AttendanceStats }) {
  const { t } = useTranslation();
  return (
    <>
      <StatTile
        icon={CalendarCheck}
        label={t('dashboard.attendanceRate')}
        value={`${stats.percent}%`}
        footer={
          <ProgressBar
            percent={stats.percent}
            tone={stats.total > 0 && stats.percent < LOW_ATTENDANCE_PERCENT ? 'danger' : 'success'}
          />
        }
      />
      <Card className="p-4">
        <p className="text-sm text-slate-500">{t('dashboard.attendanceDetail')}</p>
        <dl className="mt-2 grid grid-cols-3 divide-x divide-brand-200 text-center">
          {(
            [
              ['present', stats.done, 'text-emerald-700'],
              ['absent', stats.absent, 'text-fire-700'],
              ['excused', stats.excused, 'text-amber-700'],
            ] as const
          ).map(([status, count, color]) => (
            <div key={status}>
              <dd className={clsx('text-2xl font-bold', color)}>{count}</dd>
              <dt className="text-xs text-slate-500">{t(`attendanceStatuses.${status}`)}</dt>
            </div>
          ))}
        </dl>
      </Card>
    </>
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
                {showRollCall && (
                  <Link
                    to={`/sessions/${session.id}/roll-call`}
                    className={buttonClassName(isToday ? 'primary' : 'secondary', 'sm')}
                  >
                    <ClipboardCheck className="size-4" />
                    {t('calendar.rollCall')}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

interface TraineeRow {
  trainee: UserProfile;
  groupLabel: string;
  stats: AttendanceStats;
}

function TraineeStatsTable({ rows }: { rows: TraineeRow[] }) {
  const { t } = useTranslation();
  if (rows.length === 0) {
    return <EmptyState title={t('dashboard.noTrainees')} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-brand-200 bg-brand-50 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
            <th className="px-4 py-2 sm:px-5">{t('dashboard.columns.trainee')}</th>
            <th className="px-3 py-2">{t('dashboard.columns.group')}</th>
            <th className="w-48 px-3 py-2">{t('dashboard.attendanceRate')}</th>
            <th className="px-3 py-2 text-center">{t('attendanceStatuses.present')}</th>
            <th className="px-3 py-2 text-center">{t('attendanceStatuses.absent')}</th>
            <th className="px-3 py-2 text-center">{t('attendanceStatuses.excused')}</th>
            <th className="px-3 py-2 text-center">{t('attendanceStatuses.unrecorded')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-100">
          {rows.map(({ trainee, groupLabel, stats }) => {
            const isLow = stats.total > 0 && stats.percent < LOW_ATTENDANCE_PERCENT;
            return (
              <tr key={trainee.id} className="hover:bg-brand-50">
                <td className="px-4 py-2 sm:px-5">
                  <Link to={`/trainees/${trainee.id}?tab=attendance`} className="flex items-center gap-2 font-medium text-brand-900 hover:underline">
                    <Avatar person={trainee} size="sm" />
                    {fullName(trainee)}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{groupLabel}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ProgressBar percent={stats.percent} tone={isLow ? 'danger' : 'success'} />
                    <span className={clsx('w-10 text-right font-semibold', isLow ? 'text-fire-700' : 'text-brand-900')}>
                      {stats.percent}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center font-semibold text-emerald-700">{stats.done}</td>
                <td className="px-3 py-2 text-center font-semibold text-fire-700">{stats.absent}</td>
                <td className="px-3 py-2 text-center font-semibold text-amber-700">{stats.excused}</td>
                <td className="px-3 py-2 text-center text-slate-500">{stats.unrecorded}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StaffDashboard({ sessions }: { sessions: TrainingSession[] }) {
  const { t } = useTranslation();
  const { data: trainees } = useTrainees();
  const { data: groups } = useGroups();
  const { data: attendances } = useAllAttendances();
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);

  const activeTrainees = trainees.filter((trainee) => trainee.active !== false);
  const rows = useMemo(() => {
    const groupLabels = new Map(groups.map((group) => [group.id, group.label]));
    const attendancesByUser = new Map<string, Attendance[]>();
    attendances.forEach((attendance) =>
      attendancesByUser.set(attendance.userId, [...(attendancesByUser.get(attendance.userId) ?? []), attendance]),
    );
    return trainees
      .filter((trainee) => trainee.active !== false)
      .map((trainee) => ({
        trainee,
        groupLabel: (trainee.groupId && groupLabels.get(trainee.groupId)) || t('groups.noGroup'),
        stats: computeAttendanceStats(sessions, attendancesByUser.get(trainee.id) ?? []),
      }));
  }, [trainees, groups, attendances, sessions, t]);

  const visibleRows = rows.filter(
    ({ trainee }) =>
      groupFilter === ALL_GROUPS || (groupFilter === NO_GROUP ? !trainee.groupId : trainee.groupId === groupFilter),
  );
  const totals = visibleRows.reduce(
    (sum, { stats }) => ({
      done: sum.done + stats.done,
      total: sum.total + stats.total,
      absent: sum.absent + stats.absent,
      excused: sum.excused + stats.excused,
      unrecorded: sum.unrecorded + stats.unrecorded,
    }),
    { done: 0, total: 0, absent: 0, excused: 0, unrecorded: 0 },
  );
  const overallStats: AttendanceStats = { ...totals, ...toProgress(totals.done, totals.total) };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={UsersRound} label={t('dashboard.activeTrainees')} value={activeTrainees.length} />
        <AttendanceStatTiles stats={overallStats} />
      </div>

      <UpcomingSessions sessions={sessions} showRollCall />

      <Card>
        <CardHeader
          icon={<BarChart3 className="size-5" />}
          title={t('dashboard.traineeStats')}
          description={t('dashboard.traineeStatsHint')}
          actions={
            <select
              aria-label={t('trainees.filterGroup')}
              className={clsx(inputClassName, 'h-8 w-44 py-1')}
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
            >
              <option value={ALL_GROUPS}>{t('trainees.allGroups')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
              <option value={NO_GROUP}>{t('groups.noGroup')}</option>
            </select>
          }
        />
        <TraineeStatsTable rows={visibleRows} />
      </Card>
    </div>
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
  const skills = computeLevelProgress(
    gridCompetencies,
    evaluations,
    new Set(getModuleCompletions(evaluations).map((completion) => completion.moduleId)),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={ListChecks}
          label={t('dashboard.skillsProgress')}
          value={`${skills.percent}%`}
          footer={<ProgressBar percent={skills.percent} tone={skills.percent === 100 ? 'success' : 'brand'} />}
        />
        <AttendanceStatTiles stats={computeAttendanceStats(sessions, attendances)} />
      </div>
      <UpcomingSessions sessions={sessions} showRollCall={false} />
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
