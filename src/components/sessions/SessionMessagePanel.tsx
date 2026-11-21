import { MessageSquare, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { useCollectionData } from '@/hooks/useFirestore';
import { saveSessionMessage, sessionMessagesQuery } from '@/services/sessionMessageService';
import type { SessionMessage, TrainingSession } from '@/types/models';
import { formatTimestamp } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextAreaField } from '../ui/FormFields';

const MAX_MESSAGE_LENGTH = 1000;

export function SessionMessagePanel({ session }: { session: TrainingSession }) {
  const { t } = useTranslation();
  const { isStaff } = useAuth();
  const { uid, profile } = useCurrentUser();
  const { data: messages, loading, error: messagesError } = useCollectionData<SessionMessage>(
    sessionMessagesQuery(session.id, isStaff ? undefined : uid),
  );
  const ownMessage = isStaff ? null : (messages[0] ?? null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (messagesError) {
      notifyError(messagesError);
    }
  }, [messagesError]);

  useEffect(() => {
    setMessage(ownMessage?.message ?? '');
  }, [ownMessage?.message]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    setSaving(true);
    try {
      await saveSessionMessage(session.id, uid, `${profile.firstName} ${profile.lastName}`, trimmedMessage);
      toast.success(t('calendar.absenceMessageSaved'));
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      {isStaff ? (
        <section aria-label={t('calendar.absenceMessages')}>
          <h4 className="flex items-center gap-2 font-semibold text-brand-900">
            <MessageSquare className="size-4" />
            {t('calendar.absenceMessages')}
          </h4>
          {messages.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t('calendar.noAbsenceMessages')}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {[...messages]
                .sort((first, second) => first.userName.localeCompare(second.userName))
                .map((absenceMessage) => (
                  <li key={absenceMessage.id} className="border-t border-brand-100 pt-3">
                    <p className="flex flex-wrap justify-between gap-2 text-sm font-medium text-brand-900">
                      <span>{absenceMessage.userName}</span>
                      <time className="text-xs font-normal text-slate-500">
                        {formatTimestamp(absenceMessage.updatedAt)}
                      </time>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{absenceMessage.message}</p>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <h4 className="flex items-center gap-2 font-semibold text-brand-900">
              <MessageSquare className="size-4" />
              {t('calendar.absenceMessageTitle')}
            </h4>
            <p className="mt-1 text-sm text-slate-500">{t('calendar.absenceMessageHint')}</p>
          </div>
          <TextAreaField
            label={t('calendar.absenceMessageLabel')}
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            value={message}
            disabled={loading}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={loading || !message.trim() || message.trim() === ownMessage?.message}
              icon={<Save className="size-4" />}
            >
              {t(ownMessage ? 'calendar.updateAbsenceMessage' : 'calendar.sendAbsenceMessage')}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
