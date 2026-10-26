import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
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

/** Saves the display order of the modules, given every module id in its new order. */
export function reorderModules(orderedIds: string[]): Promise<void> {
  return saveOrder(orderedIds, moduleDocRef);
}

/** Saves the display order of the competencies of one module, given their ids in the new order. */
export function reorderCompetencies(orderedIds: string[]): Promise<void> {
  return saveOrder(orderedIds, competencyDocRef);
}

async function saveOrder(orderedIds: string[], docRef: (id: string) => DocumentReference): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => batch.update(docRef(id), { order: index + 1 }));
  await batch.commit();
}
