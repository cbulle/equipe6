import { addDoc, collection, deleteDoc, doc, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Interview, Visa } from '@/types/models';
import { COLLECTIONS } from './collections';

export type InterviewContentInput = Pick<Interview, 'date' | 'strengths' | 'improvements' | 'objectives'>;

const interviewsCollection = collection(db, COLLECTIONS.interviews);

const interviewDocRef = (interviewId: string) => doc(interviewsCollection, interviewId);

export const userInterviewsQuery = (userId: string) => query(interviewsCollection, where('userId', '==', userId));

export async function createInterview(input: Omit<Interview, 'id'>): Promise<void> {
  await addDoc(interviewsCollection, input);
}

/** Editing the content invalidates the visas: both parties must sign again. */
export function updateInterviewContent(interviewId: string, input: InterviewContentInput): Promise<void> {
  return updateDoc(interviewDocRef(interviewId), { ...input, trainerVisa: null, traineeVisa: null });
}

export function signInterview(interviewId: string, side: 'trainerVisa' | 'traineeVisa', visa: Visa): Promise<void> {
  return updateDoc(interviewDocRef(interviewId), { [side]: visa });
}

export function deleteInterview(interviewId: string): Promise<void> {
  return deleteDoc(interviewDocRef(interviewId));
}
