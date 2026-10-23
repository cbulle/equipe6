import { addDoc, collection, doc, getDocs, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Resource, TrainingSession } from '@/types/models';
import { COLLECTIONS } from './collections';

export type SessionInput = Omit<TrainingSession, 'id'>;

const sessionsCollection = collection(db, COLLECTIONS.sessions);

export const sessionDocRef = (sessionId: string) => doc(db, COLLECTIONS.sessions, sessionId);

export const sessionsQuery = () => query(sessionsCollection, orderBy('date'));

export async function createSession(input: SessionInput): Promise<string> {
  const created = await addDoc(sessionsCollection, input);
  return created.id;
}

export function updateSession(sessionId: string, input: Partial<SessionInput>): Promise<void> {
  return updateDoc(sessionDocRef(sessionId), input);
}

/** Deletes a session along with its attendance records and attached document links. */
export async function deleteSession(sessionId: string, linkedResources: Resource[]): Promise<void> {
  const attendances = await getDocs(
    query(collection(db, COLLECTIONS.attendances), where('sessionId', '==', sessionId)),
  );
  const batch = writeBatch(db);
  attendances.forEach((attendance) => batch.delete(attendance.ref));
  linkedResources.forEach((resource) => batch.delete(doc(db, COLLECTIONS.resources, resource.id)));
  batch.delete(sessionDocRef(sessionId));
  await batch.commit();
}
