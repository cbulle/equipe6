import { CircleCheckBig, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { markModuleCompleted, revokeEvaluation } from '@/services/evaluationService';
import type { Evaluation, TrainingModule, UserProfile } from '@/types/models';
import { formatTimestamp } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';
import { Button } from '../ui/Button';

interface ModuleCompletionBarProps {
  trainee: UserProfile;
  trainingModule: TrainingModule;
  completion: Evaluation | undefined;
}

/** Lets staff declare a module finished without ticking every box, and shows that visa to everyone. */
export function ModuleCompletionBar({ trainee, trainingModule, completion }: ModuleCompletionBarProps) {
  const { t } = useTranslation();
  const { isAdmin, isStaff } = useAuth();
  const { uid, profile } = useCurrentUser();
  const [saving, setSaving] = useState(false);

  if (!isStaff && !completion) {
    return null;
  }

  const canReopen = isAdmin || completion?.validatedBy === uid;

  const handleToggle = async () => {
    setSaving(true);
    try {
      if (completion) {
        await revokeEvaluation(completion.id);
        toast.success(t('moduleCompletion.reopened', { code: trainingModule.code }));
      } else {
        await markModuleCompleted(trainee.id, trainingModule.id, { userId: uid, name: fullName(profile) });
        toast.success(t('moduleCompletion.completed', { code: trainingModule.code }));
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        completion
          ? 'flex flex-col gap-2 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:px-5'
          : 'flex flex-col gap-2 bg-brand-50/60 px-4 py-3 sm:flex-row sm:items-center sm:px-5'
      }
    >
      <p className="flex-1 text-sm">
        {completion ? (
          <span className="flex items-center gap-2 font-medium text-emerald-800">
            <CircleCheckBig className="size-4 shrink-0" />
            {t('moduleCompletion.visa', {
              name: completion.validatedByName,
              date: formatTimestamp(completion.validatedAt),
            })}
          </span>
        ) : (
          <span className="text-slate-600">{t('moduleCompletion.hint')}</span>
        )}
      </p>
      {isStaff &&
        (completion ? (
          canReopen && (
            <Button
              variant="ghost"
              size="sm"
              loading={saving}
              icon={<RotateCcw className="size-4" />}
              onClick={() => void handleToggle()}
            >
              {t('moduleCompletion.reopen')}
            </Button>
          )
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={saving}
            icon={<CircleCheckBig className="size-4" />}
            onClick={() => void handleToggle()}
          >
            {t('moduleCompletion.markCompleted')}
          </Button>
        ))}
    </div>
  );
}
