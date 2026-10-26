import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { collection, deleteField, doc, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { accountCreationAuth, auth, db } from '@/config/firebase';
import i18n from '@/i18n';
import type { UserProfile } from '@/types/models';
import { COLLECTIONS } from './collections';

export type UserProfileInput = Omit<UserProfile, 'id'>;

const usersCollection = collection(db, COLLECTIONS.users);

export const userDocRef = (userId: string) => doc(db, COLLECTIONS.users, userId);

export const usersQuery = () => query(usersCollection);

export const traineesQuery = () => query(usersCollection, where('role', '==', 'trainee'));

/** Trainers and administrators: the accounts that can be the referent of a group. */
export const staffQuery = () => query(usersCollection, where('role', 'in', ['admin', 'trainer']));

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
 * Updates a profile. When the user becomes a trainee, they are removed as referent
 * of the given groups. The login email cannot be changed from the client.
 */
export async function updateUserProfile(
  userId: string,
  input: Omit<UserProfileInput, 'email'>,
  referentGroupIds: string[],
): Promise<void> {
  const batch = writeBatch(db);
  // `phone` is no longer collected: drop it from older profiles.
  batch.update(userDocRef(userId), { ...input, phone: deleteField(), updatedAt: Date.now() });
  if (input.role === 'trainee') {
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

const UNUSABLE_CONTINUE_URL_CODES = ['auth/unauthorized-continue-uri', 'auth/invalid-continue-uri'];

/**
 * Sends the Firebase password reset email in the interface language. The link brings the
 * user back to the login page once the new password is set, when this domain is authorized
 * in Firebase Authentication; otherwise the email is sent without the return link.
 */
export async function sendUserPasswordReset(email: string): Promise<void> {
  auth.languageCode = i18n.resolvedLanguage ?? i18n.language;
  const trimmedEmail = email.trim();
  try {
    await sendPasswordResetEmail(auth, trimmedEmail, { url: `${window.location.origin}/login` });
  } catch (error) {
    if (!UNUSABLE_CONTINUE_URL_CODES.includes((error as { code?: string }).code ?? '')) {
      throw error;
    }
    await sendPasswordResetEmail(auth, trimmedEmail);
  }
}

export function assignUserToGroup(userId: string, groupId: string | null): Promise<void> {
  return updateDoc(userDocRef(userId), { groupId });
}
