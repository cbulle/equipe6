import clsx from 'clsx';
import { Check, ChevronDown, CircleCheckBig, ListChecks } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { levelEvaluationId, revokeEvaluation, validateLevel } from '@/services/evaluationService';
import {
  SKILL_LEVELS,
  type Competency,
  type Evaluation,
  type SkillLevel,
  type TrainingModule,
  type UserProfile,
} from '@/types/models';
import { formatTimestamp } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';
import { computeLevelProgress, groupCompetenciesByModule } from '@/utils/training';
import { Badge } from '../ui/Badge';
import { EmptyState, ProgressBar } from '../ui/Feedback';
import { ModuleCompletionBar } from './ModuleCompletionBar';

interface SkillsTabProps {
  trainee: UserProfile;
  modules: TrainingModule[];
  competencies: Competency[];
  evaluations: Evaluation[];
  /** Evaluations declaring a module finished. */
  completions: Evaluation[];
}

interface LevelCellProps {
  level: SkillLevel;
  evaluation: Evaluation | undefined;
  moduleCompletion: Evaluation | undefined;
  canToggle: boolean;
  onToggle: () => void;
}

function LevelCell({ level, evaluation, moduleCompletion, canToggle, onToggle }: LevelCellProps) {
  const { t } = useTranslation();
  const validation = moduleCompletion ?? evaluation;
  const tooltip = validation
    ? t('skills.validatedBy', {
        name: validation.validatedByName,
        date: formatTimestamp(validation.validatedAt),
      })
    : t('skills.notValidated');
  const isValidated = Boolean(evaluation || moduleCompletion);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!canToggle}
      title={tooltip}
      aria-pressed={isValidated}
      aria-label={`${level} — ${tooltip}`}
      className={clsx(
        'flex h-9 w-12 items-center justify-center gap-1 rounded-lg text-xs font-bold transition-colors',
        isValidated
          ? 'bg-emerald-600 text-white'
          : 'bg-white text-slate-400 ring-1 ring-inset ring-brand-200',
        canToggle && (isValidated ? 'hover:bg-emerald-700' : 'hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-400'),
        !canToggle && 'cursor-default',
      )}
    >
      {isValidated && <Check className="size-3.5" />}
      {level}
    </button>
  );
}

export function SkillsTab({ trainee, modules, competencies, evaluations, completions }: SkillsTabProps) {
  const { t } = useTranslation();
  const { isAdmin, isStaff } = useAuth();
  const { uid, profile } = useCurrentUser();

  const applicableModules = modules;
  const competenciesByModule = useMemo(() => groupCompetenciesByModule(competencies), [competencies]);
  const evaluationsById = useMemo(
    () => new Map(evaluations.map((evaluation) => [evaluation.id, evaluation])),
    [evaluations],
  );
  const completionsByModule = useMemo(
    () => new Map(completions.map((completion) => [completion.moduleId, completion])),
    [completions],
  );
  const firstIncompleteModuleId = applicableModules.find((trainingModule) => {
    const progress = computeLevelProgress(competenciesByModule.get(trainingModule.id) ?? [], evaluations);
    return !completionsByModule.has(trainingModule.id) && progress.percent < 100;
  })?.id;

  const handleToggle = (competency: Competency, level: SkillLevel, evaluation: Evaluation | undefined) => {
    const write = evaluation
      ? revokeEvaluation(evaluation.id)
      : validateLevel(trainee.id, competency, level, { userId: uid, name: fullName(profile) });
    write.catch(notifyError);
  };

  if (applicableModules.length === 0) {
    return <EmptyState icon={<ListChecks className="size-6" />} title={t('skills.empty')} />;
  }

  return (
    <div className="space-y-3">
      {isStaff && <p className="text-sm text-slate-500">{t('skills.staffHint')}</p>}
      {applicableModules.map((trainingModule) => {
        const moduleCompetencies = competenciesByModule.get(trainingModule.id) ?? [];
        const progress = computeLevelProgress(moduleCompetencies, evaluations);
        const completion = completionsByModule.get(trainingModule.id);
        const isDone = Boolean(completion) || progress.percent === 100;
        return (
          <details
            key={trainingModule.id}
            open={trainingModule.id === firstIncompleteModuleId}
            className="group overflow-hidden rounded-sm bg-white ring-1 ring-brand-200"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 bg-brand-100/60 px-4 py-2.5 hover:bg-brand-100 [&::-webkit-details-marker]:hidden">
              <Badge tone="brand">{trainingModule.code}</Badge>
              <span className="min-w-0 flex-1 font-semibold text-brand-900">{trainingModule.label}</span>
              {completion && (
                <Badge tone="success" icon={<CircleCheckBig className="size-3.5" />}>
                  {t('moduleCompletion.badge')}
                </Badge>
              )}
              <span className="hidden w-40 items-center gap-2 sm:flex">
                <ProgressBar percent={completion ? 100 : progress.percent} tone={isDone ? 'success' : 'brand'} />
                <span className="text-xs whitespace-nowrap text-slate-500">
                  {progress.done}/{progress.total}
                </span>
              </span>
              <ChevronDown className="size-5 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-brand-50">
              <ModuleCompletionBar trainee={trainee} trainingModule={trainingModule} completion={completion} />
            </div>
            {moduleCompetencies.length === 0 ? (
              <p className="border-t border-brand-50 px-4 py-4 text-sm text-slate-500">{t('skills.noCompetencies')}</p>
            ) : (
              <ul className="divide-y divide-brand-50 border-t border-brand-50">
                {moduleCompetencies.map((competency) => (
                  <li key={competency.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="mr-2 font-bold text-fire-700">{competency.code}</span>
                        <span className="text-slate-800">{competency.label}</span>
                      </p>
                      {competency.criteria && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t('skills.criteria')} : {competency.criteria}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {SKILL_LEVELS.map((level) => {
                        const evaluation = evaluationsById.get(levelEvaluationId(trainee.id, competency.id, level));
                        const canToggle =
                          !completion && isStaff && (!evaluation || isAdmin || evaluation.validatedBy === uid);
                        return (
                          <LevelCell
                            key={level}
                            level={level}
                            evaluation={evaluation}
                            moduleCompletion={completion}
                            canToggle={canToggle}
                            onToggle={() => handleToggle(competency, level, evaluation)}
                          />
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        );
      })}
    </div>
  );
}
