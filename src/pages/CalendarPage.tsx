import clsx from 'clsx';
import { CalendarDays, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionFormModal } from '@/components/sessions/SessionFormModal';
import { AttendanceStatusBadge } from '@/components/shared/DomainBadges';
import { Button } from '@/components/ui/Button';
import { buttonClassName } from '@/components/ui/styles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CheckboxField } from '@/components/ui/FormFields';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { useModules, useResources, useSessions, useUserAttendances } from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { deleteSession } from '@/services/sessionService';
import { SESSION_TYPES, type SessionType, type TrainingSession } from '@/types/models';
import { formatMonth, todayIsoDate } from '@/utils/dates';

type SessionTypeFilter = SessionType | 'all';

export function CalendarPage() {
  const { t } = useTranslation();
  const { isAdmin, isStaff, role } = useAuth();
  const { uid } = useCurrentUser();
  const { data: sessions, loading } = useSessions();
  const { data: modules } = useModules();
  const { data: resources } = useResources();
  const { data: attendances } = useUserAttendances(role === 'trainee' ? uid : undefined);

  const [typeFilter, setTypeFilter] = useState<SessionTypeFilter>('all');
  const [showPast, setShowPast] = useState(false);
  const [editedSession, setEditedSession] = useState<TrainingSession | null | undefined>(undefined);
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);

  const modulesById = useMemo(() => new Map(modules.map((trainingModule) => [trainingModule.id, trainingModule])), [modules]);
  const attendanceBySession = useMemo(
    () => new Map(attendances.map((attendance) => [attendance.sessionId, attendance.status])),
    [attendances],
  );
  const resourcesBySession = (sessionId: string) => resources.filter((resource) => resource.sessionId === sessionId);

  const sessionsByMonth = useMemo(() => {
    const today = todayIsoDate();
    const groups = new Map<string, TrainingSession[]>();
    sessions
      .filter((session) => typeFilter === 'all' || session.type === typeFilter)
      .filter((session) => showPast || session.date >= today)
      .forEach((session) => {
        const monthKey = session.date.slice(0, 7);
        groups.set(monthKey, [...(groups.get(monthKey) ?? []), session]);
      });
    return [...groups.entries()];
  }, [sessions, typeFilter, showPast]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader
        title={t('calendar.title')}
        description={t('calendar.description')}
        actions={
          isAdmin && (
            <Button icon={<Plus className="size-4" />} onClick={() => setEditedSession(null)}>
              {t('sessions.create')}
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', ...SESSION_TYPES] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                typeFilter === type
                  ? 'bg-brand-800 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-brand-100 hover:bg-brand-50',
              )}
            >
              {type === 'all' ? t('common.all') : t(`sessionTypes.${type}`)}
            </button>
          ))}
        </div>
        <CheckboxField
          label={t('calendar.showPast')}
          checked={showPast}
          onChange={(event) => setShowPast(event.target.checked)}
        />
      </div>

      {sessionsByMonth.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-6" />}
          title={t('calendar.empty')}
          description={isAdmin ? t('calendar.emptyAdminHint') : undefined}
        />
      ) : (
        <div className="space-y-8">
          {sessionsByMonth.map(([monthKey, monthSessions]) => (
            <section key={monthKey}>
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-brand-600 uppercase">
                {formatMonth(`${monthKey}-01`)}
              </h2>
              <div className="space-y-3">
                {monthSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    trainingModule={session.moduleId ? modulesById.get(session.moduleId) : undefined}
                    documents={resourcesBySession(session.id)}
                    status={
                      role === 'trainee' && session.date <= todayIsoDate() ? (
                        <AttendanceStatusBadge status={attendanceBySession.get(session.id) ?? null} />
                      ) : undefined
                    }
                    actions={
                      isStaff && (
                        <>
                          <Link
                            to={`/sessions/${session.id}/roll-call`}
                            className={buttonClassName('secondary', 'sm')}
                          >
                            <ClipboardCheck className="size-4" />
                            {t('calendar.rollCall')}
                          </Link>
                          {isAdmin && (
                            <>
                              <IconButton
                                label={t('common.edit')}
                                icon={<Pencil className="size-4" />}
                                onClick={() => setEditedSession(session)}
                              />
                              <IconButton
                                label={t('common.delete')}
                                tone="danger"
                                icon={<Trash2 className="size-4" />}
                                onClick={() => setSessionToDelete(session)}
                              />
                            </>
                          )}
                        </>
                      )
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editedSession !== undefined && (
        <SessionFormModal
          key={editedSession?.id ?? 'new'}
          session={editedSession}
          modules={modules}
          linkedResources={editedSession ? resourcesBySession(editedSession.id) : []}
          onClose={() => setEditedSession(undefined)}
        />
      )}

      <ConfirmDialog
        open={sessionToDelete !== null}
        title={t('sessions.deleteTitle')}
        message={t('sessions.deleteMessage', { title: sessionToDelete?.title ?? '' })}
        onConfirm={() =>
          sessionToDelete ? deleteSession(sessionToDelete.id, resourcesBySession(sessionToDelete.id)) : Promise.resolve()
        }
        onClose={() => setSessionToDelete(null)}
      />
    </>
  );
}
