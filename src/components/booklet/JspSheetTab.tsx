import { Award, Check, Clock, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { revokeEvaluation, setCompetencyStatus, statusEvaluationId } from '@/services/evaluationService';
import type { Competency, Evaluation, SkillStatus, TrainingModule, UserProfile } from '@/types/models';
import { formatTimestamp } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';
import { getApplicableModules, groupCompetenciesByModule } from '@/utils/training';
import { SkillStatusBadge } from '../shared/DomainBadges';
import { Card, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/Feedback';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';

interface JspSheetTabProps {
  trainee: UserProfile;
  modules: TrainingModule[];
  competencies: Competency[];
  evaluations: Evaluation[];
}

export function JspSheetTab({ trainee, modules, competencies, evaluations }: JspSheetTabProps) {
  const { t } = useTranslation();
  const { isAdmin, isStaff } = useAuth();
  const { uid, profile } = useCurrentUser();

  const sheetModules = getApplicableModules(modules, trainee.apprenticeType, 'status');
  const competenciesByModule = useMemo(() => groupCompetenciesByModule(competencies), [competencies]);
  const evaluationsById = useMemo(
    () => new Map(evaluations.map((evaluation) => [evaluation.id, evaluation])),
    [evaluations],
  );

  const statusOptions: SegmentOption<SkillStatus>[] = [
    { value: 'IN_PROGRESS', label: t('skillStatuses.IN_PROGRESS'), icon: <Clock className="size-3.5" />, tone: 'info' },
    { value: 'ACQUIRED', label: t('skillStatuses.ACQUIRED'), icon: <Check className="size-3.5" />, tone: 'success' },
    { value: 'TO_REVIEW', label: t('skillStatuses.TO_REVIEW'), icon: <RotateCcw className="size-3.5" />, tone: 'warning' },
  ];

  const handleChange = (competency: Competency, evaluation: Evaluation | undefined, status: SkillStatus | null) => {
    const write = status
      ? setCompetencyStatus(trainee.id, competency, status, { userId: uid, name: fullName(profile) })
      : evaluation
        ? revokeEvaluation(evaluation.id)
        : Promise.resolve();
    write.catch(notifyError);
  };

  if (sheetModules.length === 0) {
    return <EmptyState icon={<Award className="size-6" />} title={t('jspSheet.empty')} />;
  }

  return (
    <div className="space-y-4">
      {sheetModules.map((trainingModule) => (
        <Card key={trainingModule.id}>
          <CardHeader
            icon={<Award className="size-5" />}
            title={trainingModule.label}
            description={t('jspSheet.description')}
          />
          <ul className="divide-y divide-brand-50">
            {(competenciesByModule.get(trainingModule.id) ?? []).map((competency) => {
              const evaluation = evaluationsById.get(statusEvaluationId(trainee.id, competency.id));
              const status = (evaluation?.level as SkillStatus | undefined) ?? null;
              const canClear = !evaluation || isAdmin || evaluation.validatedBy === uid;
              return (
                <li key={competency.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-900">{competency.label}</p>
                    {evaluation && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t('jspSheet.visa', {
                          name: evaluation.validatedByName,
                          date: formatTimestamp(evaluation.validatedAt),
                        })}
                      </p>
                    )}
                  </div>
                  {isStaff ? (
                    <SegmentedControl
                      ariaLabel={competency.label}
                      options={statusOptions}
                      value={status}
                      onChange={(value) => handleChange(competency, evaluation, value)}
                      allowClear={canClear}
                    />
                  ) : (
                    <SkillStatusBadge status={status} />
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
