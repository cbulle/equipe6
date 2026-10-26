import clsx from 'clsx';
import { Clock, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Resource, TrainingModule, TrainingSession } from '@/types/models';
import { formatDate, parseIsoDate, todayIsoDate } from '@/utils/dates';
import { SessionTypeBadge } from '../shared/DomainBadges';
import { Badge } from '../ui/Badge';

interface SessionCardProps {
  session: TrainingSession;
  trainingModule?: TrainingModule;
  documents?: Resource[];
  status?: ReactNode;
  actions?: ReactNode;
}

export function SessionCard({ session, trainingModule, documents = [], status, actions }: SessionCardProps) {
  const isPast = session.date < todayIsoDate();
  const isToday = session.date === todayIsoDate();
  const date = parseIsoDate(session.date);

  return (
    <article
      className={clsx(
        'flex flex-col gap-3 rounded-sm bg-white p-3 ring-1 sm:flex-row sm:items-center sm:p-4',
        isToday ? 'ring-2 ring-brand-600' : 'ring-brand-200',
        isPast && 'opacity-75',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <div
          className={clsx(
            'flex w-14 shrink-0 flex-col items-center rounded-sm border py-1.5',
            isToday ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-brand-50 text-brand-900',
          )}
        >
          <span className="text-[11px] font-medium uppercase">{formatDate(session.date, { weekday: 'short' })}</span>
          <span className="text-xl leading-none font-bold">{date.getDate()}</span>
          <span className="text-[11px] uppercase">{formatDate(session.date, { month: 'short' })}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-brand-900">{session.title}</h3>
            <SessionTypeBadge type={session.type} />
            {trainingModule && <Badge tone="neutral">{trainingModule.code}</Badge>}
          </div>
          {session.theme && <p className="mt-0.5 text-sm text-slate-600">{session.theme}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {session.startTime} – {session.endTime}
            </span>
            {documents.map((document) => (
              <a
                key={document.id}
                href={document.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-900 hover:underline"
              >
                <FileText className="size-3.5" />
                {document.title}
              </a>
            ))}
          </div>
        </div>
      </div>
      {(status || actions) && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-brand-50 pt-2 sm:border-0 sm:pt-0">
          {status}
          {actions}
        </div>
      )}
    </article>
  );
}
