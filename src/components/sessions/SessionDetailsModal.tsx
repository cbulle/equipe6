import { Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Resource, TrainingModule, TrainingSession } from '@/types/models';
import { IconButton } from '../ui/IconButton';
import { SessionCard } from './SessionCard';
import { SessionMessagePanel } from './SessionMessagePanel';

interface SessionDetailsModalProps {
  sessions: TrainingSession[];
  title: string;
  modules: TrainingModule[];
  resources: Resource[];
  onClose: () => void;
  onEdit?: (session: TrainingSession) => void;
  onDelete?: (session: TrainingSession) => void;
}

export function SessionDetailsModal({
  sessions,
  title,
  modules,
  resources,
  onClose,
  onEdit,
  onDelete,
}: SessionDetailsModalProps) {
  const { t } = useTranslation();
  const modulesById = useMemo(() => new Map(modules.map((trainingModule) => [trainingModule.id, trainingModule])), [modules]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(85dvh-5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:max-h-[85vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{title}</h3>
          <IconButton label={t('common.close')} icon={<X className="size-4" />} onClick={onClose} />
        </div>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="space-y-2">
              <SessionCard
                session={session}
                trainingModule={session.moduleId ? modulesById.get(session.moduleId) : undefined}
                documents={resources.filter((resource) => resource.sessionId === session.id)}
                actions={
                  (onEdit || onDelete) && (
                    <>
                      {onEdit && (
                        <IconButton
                          label={t('common.edit')}
                          icon={<Pencil className="size-4" />}
                          onClick={() => {
                            onClose();
                            onEdit(session);
                          }}
                        />
                      )}
                      {onDelete && (
                        <IconButton
                          label={t('common.delete')}
                          tone="danger"
                          icon={<Trash2 className="size-4" />}
                          onClick={() => {
                            onClose();
                            onDelete(session);
                          }}
                        />
                      )}
                    </>
                  )
                }
              />
              <SessionMessagePanel session={session} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
