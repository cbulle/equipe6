import clsx from 'clsx';
import { ArrowLeft, Check, CheckCheck, Clock, MessageSquarePlus, UsersRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ApprenticeTypeBadge, SessionTypeBadge } from '@/components/shared/DomainBadges';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { inputClassName } from '@/components/ui/styles';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { useGroups, useSession, useSessionAttendances, useTrainees } from '@/hooks/useAppData';
import { useCurrentUser } from '@/hooks/useAuth';
import {
  clearAttendance,
  recordAttendance,
  recordAttendances,
  saveAttendanceNote,
} from '@/services/attendanceService';
import type { Attendance, AttendanceStatus, UserProfile } from '@/types/models';
import { formatDate } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { fullName, matchesSearch } from '@/utils/names';

const NO_GROUP = '__none__';
const ALL_GROUPS = '__all__';

interface RollCallRowProps {
  trainee: UserProfile;
  groupLabel: string;
  attendance: Attendance | undefined;
  sessionId: string;
  recordedBy: string;
}

function RollCallRow({ trainee, groupLabel, attendance, sessionId, recordedBy }: RollCallRowProps) {
  const { t } = useTranslation();
  const [isNoteOpen, setIsNoteOpen] = useState(Boolean(attendance?.note));

  const statusOptions: SegmentOption<AttendanceStatus>[] = [
    { value: 'present', label: t('attendanceStatuses.present'), icon: <Check className="size-4" />, tone: 'success' },
    { value: 'absent', label: t('attendanceStatuses.absent'), icon: <X className="size-4" />, tone: 'danger' },
    { value: 'excused', label: t('attendanceStatuses.excused'), icon: <Clock className="size-4" />, tone: 'warning' },
  ];

  // Writes are not awaited: with the offline cache they resolve only once synced with the server.
  const handleStatusChange = (status: AttendanceStatus | null) => {
    const write = status
      ? recordAttendance({ sessionId, userId: trainee.id, status, recordedBy })
      : clearAttendance(sessionId, trainee.id);
    write.catch(notifyError);
  };

  const handleNoteBlur = (note: string) => {
    if (note !== (attendance?.note ?? '')) {
      saveAttendanceNote(sessionId, trainee.id, note, recordedBy).catch(notifyError);
    }
  };

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar person={trainee} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-brand-900">{fullName(trainee)}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <ApprenticeTypeBadge type={trainee.apprenticeType} />
            <span>{groupLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label={t('rollCall.addNote')}
            icon={<MessageSquarePlus className={clsx('size-4', attendance?.note && 'text-brand-700')} />}
            onClick={() => setIsNoteOpen((previous) => !previous)}
          />
          <SegmentedControl
            ariaLabel={t('rollCall.statusFor', { name: fullName(trainee) })}
            options={statusOptions}
            value={attendance?.status ?? null}
            onChange={handleStatusChange}
            allowClear
            compactOnMobile
          />
        </div>
      </div>
      {isNoteOpen && (
        <input
          type="text"
          defaultValue={attendance?.note ?? ''}
          onBlur={(event) => handleNoteBlur(event.target.value)}
          placeholder={trainee.apprenticeType === 'SPV' ? t('rollCall.notePlaceholder') : t('rollCall.jspNotePlaceholder')}
          aria-label={t('rollCall.addNote')}
          className={clsx(inputClassName, 'mt-2')}
        />
      )}
    </li>
  );
}

export function RollCallPage() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { uid } = useCurrentUser();
  const { data: session, loading: sessionLoading } = useSession(sessionId);
  const { data: trainees, loading: traineesLoading } = useTrainees();
  const { data: groups } = useGroups();
  const { data: attendances } = useSessionAttendances(sessionId);

  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS);
  const [search, setSearch] = useState('');

  const groupLabels = useMemo(() => new Map(groups.map((group) => [group.id, group.label])), [groups]);
  const attendanceByUser = useMemo(
    () => new Map(attendances.map((attendance) => [attendance.userId, attendance])),
    [attendances],
  );

  const visibleTrainees = trainees.filter(
    (trainee) =>
      trainee.active !== false &&
      (groupFilter === ALL_GROUPS ||
        (groupFilter === NO_GROUP ? !trainee.groupId : trainee.groupId === groupFilter)) &&
      matchesSearch(search, trainee.firstName, trainee.lastName),
  );

  const counts = visibleTrainees.reduce(
    (accumulator, trainee) => {
      const status = attendanceByUser.get(trainee.id)?.status;
      accumulator[status ?? 'unrecorded'] += 1;
      return accumulator;
    },
    { present: 0, absent: 0, excused: 0, unrecorded: 0 },
  );

  const handleMarkAllPresent = () => {
    const unrecordedIds = visibleTrainees
      .filter((trainee) => !attendanceByUser.get(trainee.id)?.status)
      .map((trainee) => trainee.id);
    if (!sessionId || unrecordedIds.length === 0) {
      return;
    }
    recordAttendances(sessionId, unrecordedIds, 'present', uid).catch(notifyError);
    toast.success(t('rollCall.allMarkedPresent', { count: unrecordedIds.length }));
  };

  if (sessionLoading || traineesLoading) {
    return <PageLoader />;
  }

  if (!session || !sessionId) {
    return <EmptyState title={t('rollCall.sessionNotFound')} />;
  }

  const groupFilterOptions = [
    { id: ALL_GROUPS, label: t('rollCall.allGroups') },
    ...groups.filter((group) => group.active).map((group) => ({ id: group.id, label: group.label })),
    { id: NO_GROUP, label: t('groups.noGroup') },
  ];

  return (
    <>
      <PageHeader
        back={
          <Link to="/calendar" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-900">
            <ArrowLeft className="size-4" />
            {t('nav.calendar')}
          </Link>
        }
        title={t('rollCall.title', { title: session.title })}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {formatDate(session.date, { dateStyle: 'full' })} · {session.startTime} – {session.endTime}
            <SessionTypeBadge type={session.type} />
          </span>
        }
        actions={
          <Button
            variant="secondary"
            icon={<CheckCheck className="size-4" />}
            onClick={handleMarkAllPresent}
            disabled={counts.unrecorded === 0}
          >
            {t('rollCall.markAllPresent')}
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['present', 'text-emerald-700 bg-emerald-50'],
            ['absent', 'text-fire-700 bg-fire-50'],
            ['excused', 'text-amber-800 bg-amber-50'],
            ['unrecorded', 'text-slate-700 bg-white'],
          ] as const
        ).map(([status, className]) => (
          <div key={status} className={clsx('rounded-xl px-4 py-3 ring-1 ring-brand-100', className)}>
            <p className="text-2xl font-bold">{counts[status]}</p>
            <p className="text-xs font-medium">{t(`attendanceStatuses.${status}`)}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-brand-100 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-wrap gap-2">
            {groupFilterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGroupFilter(option.id)}
                className={clsx(
                  'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  groupFilter === option.id ? 'bg-brand-800 text-white' : 'bg-brand-50 text-slate-600 hover:bg-brand-100',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder={t('common.searchByName')} className="sm:w-64" />
        </div>
        {visibleTrainees.length === 0 ? (
          <EmptyState icon={<UsersRound className="size-6" />} title={t('rollCall.noTrainees')} />
        ) : (
          <ul className="divide-y divide-brand-50">
            {visibleTrainees.map((trainee) => (
              <RollCallRow
                key={trainee.id}
                trainee={trainee}
                groupLabel={trainee.groupId ? (groupLabels.get(trainee.groupId) ?? '') : t('groups.noGroup')}
                attendance={attendanceByUser.get(trainee.id)}
                sessionId={sessionId}
                recordedBy={uid}
              />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
