import { CalendarCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Attendance, TrainingSession } from '@/types/models';
import { formatDate, todayIsoDate } from '@/utils/dates';
import { computeAttendanceProgress } from '@/utils/training';
import { AttendanceStatusBadge, SessionTypeBadge } from '../shared/DomainBadges';
import { Card } from '../ui/Card';
import { EmptyState, ProgressBar } from '../ui/Feedback';

interface AttendanceTabProps {
  sessions: TrainingSession[];
  attendances: Attendance[];
}

export function AttendanceTab({ sessions, attendances }: AttendanceTabProps) {
  const { t } = useTranslation();
  const today = todayIsoDate();
  const attendanceBySession = useMemo(
    () => new Map(attendances.map((attendance) => [attendance.sessionId, attendance])),
    [attendances],
  );
  const pastSessions = sessions.filter((session) => session.date <= today).reverse();
  const progress = computeAttendanceProgress(sessions, attendances);
  const countByStatus = (status: Attendance['status']) =>
    pastSessions.filter((session) => attendanceBySession.get(session.id)?.status === status).length;

  if (pastSessions.length === 0) {
    return <EmptyState icon={<CalendarCheck className="size-6" />} title={t('attendance.empty')} />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">{t('attendance.rate')}</p>
            <p className="text-3xl font-bold text-brand-900">{progress.percent}%</p>
            <div className="mt-2 max-w-sm">
              <ProgressBar percent={progress.percent} tone="success" />
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {(['present', 'absent', 'excused'] as const).map((status) => (
              <div key={status} className="rounded-lg bg-brand-50 px-4 py-2">
                <dd className="text-xl font-bold text-brand-900">{countByStatus(status)}</dd>
                <dt className="text-xs text-slate-500">{t(`attendanceStatuses.${status}`)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <Card>
        <ul className="divide-y divide-brand-50">
          {pastSessions.map((session) => {
            const attendance = attendanceBySession.get(session.id);
            return (
              <li key={session.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-900">{session.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(session.date, { dateStyle: 'full' })}</p>
                  {attendance?.note && <p className="mt-1 text-xs text-slate-600 italic">« {attendance.note} »</p>}
                </div>
                <SessionTypeBadge type={session.type} />
                <AttendanceStatusBadge status={attendance?.status ?? null} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
