import { collection, doc, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { SessionMessage } from '@/types/models';
import { COLLECTIONS } from './collections';

const sessionMessagesCollection = collection(db, COLLECTIONS.sessionMessages);

export const sessionMessageDocRef = (sessionId: string, userId: string) =>
  doc(sessionMessagesCollection, `${sessionId}_${userId}`);

export const sessionMessagesQuery = (sessionId: string, userId?: string) =>
  userId
    ? query(
        sessionMessagesCollection,
        where('sessionId', '==', sessionId),
        where('userId', '==', userId),
      )
    : query(sessionMessagesCollection, where('sessionId', '==', sessionId));

export function saveSessionMessage(
  sessionId: string,
  userId: string,
  userName: string,
  message: string,
): Promise<void> {
  return setDoc(sessionMessageDocRef(sessionId, userId), {
    sessionId,
    userId,
    userName,
    message: message.trim(),
    updatedAt: Date.now(),
  } satisfies Omit<SessionMessage, 'id'>);
}
