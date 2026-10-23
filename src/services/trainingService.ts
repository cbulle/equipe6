import { addDoc, collection, deleteDoc, doc, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Competency, TrainingModule } from '@/types/models';
import { COLLECTIONS } from './collections';

export type ModuleInput = Omit<TrainingModule, 'id'>;
export type CompetencyInput = Omit<Competency, 'id'>;

const modulesCollection = collection(db, COLLECTIONS.modules);
const competenciesCollection = collection(db, COLLECTIONS.competencies);

const moduleDocRef = (moduleId: string) => doc(db, COLLECTIONS.modules, moduleId);
const competencyDocRef = (competencyId: string) => doc(db, COLLECTIONS.competencies, competencyId);

export const modulesQuery = () => query(modulesCollection, orderBy('order'));

export const competenciesQuery = () => query(competenciesCollection, orderBy('order'));

export async function createModule(input: ModuleInput): Promise<string> {
  const created = await addDoc(modulesCollection, input);
  return created.id;
}

export function updateModule(moduleId: string, input: Partial<ModuleInput>): Promise<void> {
  return updateDoc(moduleDocRef(moduleId), input);
}

export async function deleteModule(moduleId: string, competencyIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  competencyIds.forEach((competencyId) => batch.delete(competencyDocRef(competencyId)));
  batch.delete(moduleDocRef(moduleId));
  await batch.commit();
}

export async function createCompetency(input: CompetencyInput): Promise<void> {
  await addDoc(competenciesCollection, input);
}

export function updateCompetency(competencyId: string, input: Partial<CompetencyInput>): Promise<void> {
  return updateDoc(competencyDocRef(competencyId), input);
}

export function deleteCompetency(competencyId: string): Promise<void> {
  return deleteDoc(competencyDocRef(competencyId));
}

/** Swaps the display order of two competencies of the same module. */
export async function swapCompetencyOrder(first: Competency, second: Competency): Promise<void> {
  const batch = writeBatch(db);
  batch.update(competencyDocRef(first.id), { order: second.order });
  batch.update(competencyDocRef(second.id), { order: first.order });
  await batch.commit();
}
