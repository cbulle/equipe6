import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, doc, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { accountCreationAuth, auth, db } from '@/config/firebase';
import type { UserProfile } from '@/types/models';
import { COLLECTIONS } from './collections';

export type UserProfileInput = Omit<UserProfile, 'id'>;

const usersCollection = collection(db, COLLECTIONS.users);

export const userDocRef = (userId: string) => doc(db, COLLECTIONS.users, userId);

export const usersQuery = () => query(usersCollection);

export const traineesQuery = () => query(usersCollection, where('role', '==', 'trainee'));

export const trainersQuery = () => query(usersCollection, where('role', '==', 'trainer'));

/**
 * Creates the Firebase Auth account through a secondary Auth instance (the administrator
 * stays signed in), then writes the profile that carries the role.
 */
export async function createUserAccount(input: UserProfileInput, password: string): Promise<string> {
  const credential = await createUserWithEmailAndPassword(accountCreationAuth, input.email.trim(), password);
  await signOut(accountCreationAuth);
  await setDoc(userDocRef(credential.user.uid), { ...input, email: input.email.trim().toLowerCase(), createdAt: Date.now() });
  return credential.user.uid;
}

/**
 * Updates a profile. When the user stops being a trainer, they are removed as referent
 * of the given groups. The login email cannot be changed from the client.
 */
export async function updateUserProfile(
  userId: string,
  input: Omit<UserProfileInput, 'email'>,
  referentGroupIds: string[],
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(userDocRef(userId), { ...input, updatedAt: Date.now() });
  if (input.role !== 'trainer') {
    referentGroupIds.forEach((groupId) => batch.update(doc(db, COLLECTIONS.groups, groupId), { referentId: null }));
  }
  await batch.commit();
}

/**
 * Deletes the profile: without a profile the account no longer has access to anything.
 * The Firebase Auth login itself can only be removed from the Firebase console.
 */
export async function deleteUserProfile(userId: string, referentGroupIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  referentGroupIds.forEach((groupId) => batch.update(doc(db, COLLECTIONS.groups, groupId), { referentId: null }));
  batch.delete(userDocRef(userId));
  await batch.commit();
}

export function sendUserPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export function assignUserToGroup(userId: string, groupId: string | null): Promise<void> {
  return updateDoc(userDocRef(userId), { groupId });
}
