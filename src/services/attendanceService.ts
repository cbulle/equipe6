import { collection, deleteDoc, doc, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AttendanceStatus } from '@/types/models';
import { COLLECTIONS } from './collections';

const attendancesCollection = collection(db, COLLECTIONS.attendances);

const attendanceDocRef = (sessionId: string, userId: string) =>
  doc(attendancesCollection, `${sessionId}_${userId}`);

export const sessionAttendancesQuery = (sessionId: string) =>
  query(attendancesCollection, where('sessionId', '==', sessionId));

/** Every attendance record (staff only), used for the attendance statistics. */
export const attendancesQuery = () => query(attendancesCollection);

export const userAttendancesQuery = (userId: string) => query(attendancesCollection, where('userId', '==', userId));

interface AttendanceRecordInput {
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
  recordedBy: string;
}

export function recordAttendance({ sessionId, userId, status, recordedBy }: AttendanceRecordInput): Promise<void> {
  return setDoc(
    attendanceDocRef(sessionId, userId),
    { sessionId, userId, status, recordedBy, recordedAt: Date.now() },
    { merge: true },
  );
}

export function saveAttendanceNote(sessionId: string, userId: string, note: string, recordedBy: string): Promise<void> {
  return setDoc(attendanceDocRef(sessionId, userId), { sessionId, userId, note, recordedBy }, { merge: true });
}

export function clearAttendance(sessionId: string, userId: string): Promise<void> {
  return deleteDoc(attendanceDocRef(sessionId, userId));
}

export async function recordAttendances(
  sessionId: string,
  userIds: string[],
  status: AttendanceStatus,
  recordedBy: string,
): Promise<void> {
  const batch = writeBatch(db);
  const recordedAt = Date.now();
  userIds.forEach((userId) =>
    batch.set(
      attendanceDocRef(sessionId, userId),
      { sessionId, userId, status, recordedBy, recordedAt },
      { merge: true },
    ),
  );
  await batch.commit();
}
