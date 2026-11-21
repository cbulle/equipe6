import { SKILL_LEVELS, type Competency, type Evaluation } from '@/types/models';

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

/**
 * Progress over every N1 / N2 / N3 box of the given competencies. Every box of a module
 * marked as finished counts as validated, ticked or not.
 */
export function computeLevelProgress(
  competencies: Competency[],
  evaluations: Evaluation[],
  completedModuleIds: ReadonlySet<string> = new Set(),
): Progress {
  const openCompetencies = competencies.filter((competency) => !completedModuleIds.has(competency.moduleId));
  const openCompetencyIds = new Set(openCompetencies.map((competency) => competency.id));
  const ticked = evaluations.filter(
    (evaluation) =>
      openCompetencyIds.has(evaluation.competencyId) && (SKILL_LEVELS as readonly string[]).includes(evaluation.level),
  ).length;
  const completedBoxes = (competencies.length - openCompetencies.length) * SKILL_LEVELS.length;
  return toProgress(ticked + completedBoxes, competencies.length * SKILL_LEVELS.length);
}
