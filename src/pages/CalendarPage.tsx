import clsx from 'clsx';
import { ChevronLeft, ChevronRight, ClipboardCheck, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionFormModal } from '@/components/sessions/SessionFormModal';
import { AttendanceStatusBadge } from '@/components/shared/DomainBadges';
import { Button } from '@/components/ui/Button';
import { buttonClassName } from '@/components/ui/styles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoader } from '@/components/ui/Feedback';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { useModules, useResources, useSessions, useUserAttendances } from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { deleteSession } from '@/services/sessionService';
import { SESSION_TYPES, type SessionType, type TrainingSession } from '@/types/models';
import { formatMonth, todayIsoDate } from '@/utils/dates';

type SessionTypeFilter = SessionType | 'all';

const MAX_CHIPS_PER_DAY = 2;

const CHIP_STYLES: Record<string, string> = {
  course: 'bg-brand-100 text-brand-800 hover:bg-brand-200',
  sport: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  opening: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
};
const DOT_STYLES: Record<string, string> = {
  course: 'bg-brand-600',
  sport: 'bg-emerald-600',
  opening: 'bg-amber-500',
};

const pad = (value: number) => String(value).padStart(2, '0');
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseIsoDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { isAdmin, isStaff, role } = useAuth();
  const { uid } = useCurrentUser();
  const { data: sessions, loading } = useSessions();
  const { data: modules } = useModules();
  const { data: resources } = useResources();
  const { data: attendances } = useUserAttendances(role === 'trainee' ? uid : undefined);

  const [typeFilter, setTypeFilter] = useState<SessionTypeFilter>('all');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [openedIds, setOpenedIds] = useState<string[] | null>(null);
  const [editedSession, setEditedSession] = useState<TrainingSession | null | undefined>(undefined);
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);

  const isFrench = i18n.language.startsWith('fr');
  const labels = {
    today: isFrench ? "Aujourd'hui" : 'Today',
    previous: isFrench ? 'Mois précédent' : 'Previous month',
    next: isFrench ? 'Mois suivant' : 'Next month',
    close: isFrench ? 'Fermer' : 'Close',
  };

  const modulesById = useMemo(() => new Map(modules.map((trainingModule) => [trainingModule.id, trainingModule])), [modules]);
  const attendanceBySession = useMemo(
    () => new Map(attendances.map((attendance) => [attendance.sessionId, attendance.status])),
    [attendances],
  );
  const resourcesBySession = (sessionId: string) => resources.filter((resource) => resource.sessionId === sessionId);

  const sessionsByDate = useMemo(() => {
    const groups = new Map<string, TrainingSession[]>();
    sessions
      .filter((session) => typeFilter === 'all' || session.type === typeFilter)
      .forEach((session) => {
        groups.set(session.date, [...(groups.get(session.date) ?? []), session]);
      });
    return groups;
  }, [sessions, typeFilter]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    // Le 1er janvier 2024 est un lundi
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 1 + index)));
  }, [i18n.language]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil((offset + daysInMonth) / 7);
    return Array.from({ length: weeks * 7 }, (_, index) => {
      const date = new Date(year, month, 1 - offset + index);
      return { iso: toIsoDate(date), dayNumber: date.getDate(), inMonth: date.getMonth() === month };
    });
  }, [visibleMonth]);

  const openedSessions = useMemo(
    () => (openedIds ? sessions.filter((session) => openedIds.includes(session.id)) : []),
    [sessions, openedIds],
  );

  const openedDateLabel = useMemo(() => {
    if (openedSessions.length === 0) {
      return '';
    }
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parseIsoDate(openedSessions[0].date));
  }, [openedSessions, i18n.language]);

  useEffect(() => {
    if (!openedIds) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenedIds(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openedIds]);

  const today = todayIsoDate();
  const monthKey = `${visibleMonth.getFullYear()}-${pad(visibleMonth.getMonth() + 1)}`;

  const goToMonth = (offset: number) =>
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  const goToToday = () => {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const openDay = (iso: string) => {
    const ids = (sessionsByDate.get(iso) ?? []).map((session) => session.id);
    if (ids.length > 0) {
      setOpenedIds(ids);
    }
  };

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

      <div className="mb-5 flex flex-wrap gap-2">
        {(['all', ...SESSION_TYPES] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={clsx(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              typeFilter === type
                ? 'bg-brand-800 text-white'
                : 'bg-white text-slate-600 ring-1 ring-brand-200 hover:bg-brand-50',
            )}
          >
            {type === 'all' ? t('common.all') : t(`sessionTypes.${type}`)}
          </button>
        ))}
      </div>

      <section className="rounded-2xl bg-white p-3 ring-1 ring-brand-200 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand-800 capitalize">{formatMonth(`${monthKey}-01`)}</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={goToToday} className={buttonClassName('secondary', 'sm')}>
              {labels.today}
            </button>
            <IconButton
              label={labels.previous}
              icon={<ChevronLeft className="size-4" />}
              onClick={() => goToMonth(-1)}
            />
            <IconButton label={labels.next} icon={<ChevronRight className="size-4" />} onClick={() => goToMonth(1)} />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-1 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {label}
            </div>
          ))}

          {calendarDays.map((day) => {
            const daySessions = sessionsByDate.get(day.iso) ?? [];
            const isToday = day.iso === today;
            return (
              <div
                key={day.iso}
                className={clsx(
                  'flex min-h-16 flex-col gap-1 rounded-lg p-1 ring-1 ring-slate-100 sm:min-h-28 sm:p-1.5',
                  day.inMonth ? 'bg-white' : 'bg-slate-50',
                )}
              >
                {/* Numéro du jour (et points de couleur sur mobile) */}
                <button
                  type="button"
                  onClick={() => openDay(day.iso)}
                  disabled={daySessions.length === 0}
                  aria-label={day.iso}
                  className="flex flex-1 flex-col items-start gap-1 text-left sm:flex-none"
                >
                  <span
                    className={clsx(
                      'flex size-6 items-center justify-center rounded-sm text-xs font-semibold',
                      isToday ? 'bg-brand-800 text-white' : day.inMonth ? 'text-slate-700' : 'text-slate-400',
                    )}
                  >
                    {day.dayNumber}
                  </span>
                  <span className="flex flex-wrap gap-1 px-0.5 sm:hidden">
                    {daySessions.slice(0, 4).map((session) => (
                      <span
                        key={session.id}
                        className={clsx('size-2 rounded-sm', DOT_STYLES[session.type] ?? 'bg-slate-400')}
                      />
                    ))}
                  </span>
                </button>

                {/* Ordinateur : titres cliquables */}
                <div className="hidden flex-col gap-1 sm:flex">
                  {daySessions.slice(0, MAX_CHIPS_PER_DAY).map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setOpenedIds([session.id])}
                      className={clsx(
                        'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition-colors',
                        CHIP_STYLES[session.type] ?? 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      )}
                    >
                      {session.title}
                    </button>
                  ))}
                  {daySessions.length > MAX_CHIPS_PER_DAY && (
                    <button
                      type="button"
                      onClick={() => openDay(day.iso)}
                      className="px-1 text-left text-xs font-medium text-slate-500 hover:text-brand-700"
                    >
                      +{daySessions.length - MAX_CHIPS_PER_DAY}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {openedSessions.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenedIds(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{openedDateLabel}</h3>
              <IconButton
                label={labels.close}
                icon={<X className="size-4" />}
                onClick={() => setOpenedIds(null)}
              />
            </div>
            <div className="space-y-3">
              {openedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  trainingModule={session.moduleId ? modulesById.get(session.moduleId) : undefined}
                  documents={resourcesBySession(session.id)}
                  status={
                    role === 'trainee' && session.date <= today ? (
                      <AttendanceStatusBadge status={attendanceBySession.get(session.id) ?? null} />
                    ) : undefined
                  }
                  actions={
                    isStaff && (
                      <>
                        <Link to={`/sessions/${session.id}/roll-call`} className={buttonClassName('secondary', 'sm')}>
                          <ClipboardCheck className="size-4" />
                          {t('calendar.rollCall')}
                        </Link>
                        {isAdmin && (
                          <>
                            <IconButton
                              label={t('common.edit')}
                              icon={<Pencil className="size-4" />}
                              onClick={() => {
                                setOpenedIds(null);
                                setEditedSession(session);
                              }}
                            />
                            <IconButton
                              label={t('common.delete')}
                              tone="danger"
                              icon={<Trash2 className="size-4" />}
                              onClick={() => {
                                setOpenedIds(null);
                                setSessionToDelete(session);
                              }}
                            />
                          </>
                        )}
                      </>
                    )
                  }
                />
              ))}
            </div>
          </div>
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