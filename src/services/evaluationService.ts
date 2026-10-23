import { collection, deleteDoc, doc, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Competency, Evaluation, SkillLevel, SkillStatus } from '@/types/models';
import { COLLECTIONS } from './collections';

export interface Validator {
  userId: string;
  name: string;
}

const evaluationsCollection = collection(db, COLLECTIONS.evaluations);

export const levelEvaluationId = (userId: string, competencyId: string, level: SkillLevel) =>
  `${userId}_${competencyId}_${level}`;

export const statusEvaluationId = (userId: string, competencyId: string) => `${userId}_${competencyId}_status`;

export const userEvaluationsQuery = (userId: string) => query(evaluationsCollection, where('userId', '==', userId));

function buildEvaluation(
  userId: string,
  competency: Competency,
  level: SkillLevel | SkillStatus,
  validator: Validator,
): Omit<Evaluation, 'id'> {
  return {
    userId,
    competencyId: competency.id,
    moduleId: competency.moduleId,
    level,
    validatedBy: validator.userId,
    validatedByName: validator.name,
    validatedAt: Date.now(),
  };
}

/** Ticks a N1 / N2 / N3 box of a competency grid. */
export function validateLevel(userId: string, competency: Competency, level: SkillLevel, validator: Validator) {
  return setDoc(
    doc(evaluationsCollection, levelEvaluationId(userId, competency.id, level)),
    buildEvaluation(userId, competency, level, validator),
  );
}

/** Sets the "In progress / Acquired / To review" status of a JSP sheet item. */
export function setCompetencyStatus(userId: string, competency: Competency, status: SkillStatus, validator: Validator) {
  return setDoc(
    doc(evaluationsCollection, statusEvaluationId(userId, competency.id)),
    buildEvaluation(userId, competency, status, validator),
  );
}

export function revokeEvaluation(evaluationId: string): Promise<void> {
  return deleteDoc(doc(evaluationsCollection, evaluationId));
}
