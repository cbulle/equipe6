import {
  SKILL_LEVELS,
  type ApprenticeType,
  type Attendance,
  type Competency,
  type Evaluation,
  type EvaluationScale,
  type TrainingModule,
  type TrainingSession,
} from '@/types/models';
import { todayIsoDate } from './dates';

export const isJspApprentice = (apprenticeType: ApprenticeType | null) =>
  apprenticeType === 'JSP_N3' || apprenticeType === 'JSP_N4';

export function isModuleApplicable(trainingModule: TrainingModule, apprenticeType: ApprenticeType | null): boolean {
  switch (trainingModule.targetType) {
    case 'SPV_ONLY':
      return apprenticeType === 'SPV';
    case 'JSP_ONLY':
      return isJspApprentice(apprenticeType);
    default:
      return true;
  }
}

export function getApplicableModules(
  modules: TrainingModule[],
  apprenticeType: ApprenticeType | null,
  scale: EvaluationScale,
): TrainingModule[] {
  return modules.filter(
    (trainingModule) => trainingModule.evaluationScale === scale && isModuleApplicable(trainingModule, apprenticeType),
  );
}

export function groupCompetenciesByModule(competencies: Competency[], activeOnly = true): Map<string, Competency[]> {
  const byModule = new Map<string, Competency[]>();
  competencies
    .filter((competency) => !activeOnly || competency.active)
    .forEach((competency) => {
      byModule.set(competency.moduleId, [...(byModule.get(competency.moduleId) ?? []), competency]);
    });
  return byModule;
}

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export function toProgress(done: number, total: number): Progress {
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Progress over every N1 / N2 / N3 box of the given competencies. */
export function computeLevelProgress(competencies: Competency[], evaluations: Evaluation[]): Progress {
  const competencyIds = new Set(competencies.map((competency) => competency.id));
  const done = evaluations.filter(
    (evaluation) =>
      competencyIds.has(evaluation.competencyId) && (SKILL_LEVELS as readonly string[]).includes(evaluation.level),
  ).length;
  return toProgress(done, competencies.length * SKILL_LEVELS.length);
}

export function computeAttendanceProgress(sessions: TrainingSession[], attendances: Attendance[]): Progress {
  const today = todayIsoDate();
  const pastSessionIds = new Set(sessions.filter((session) => session.date <= today).map((session) => session.id));
  const present = attendances.filter(
    (attendance) => pastSessionIds.has(attendance.sessionId) && attendance.status === 'present',
  ).length;
  return toProgress(present, pastSessionIds.size);
}
