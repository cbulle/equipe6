import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
  updateEmail,
  updateProfile,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { collection, deleteField, doc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { accountCreationAuth, auth, db, functions } from '@/config/firebase';
import i18n from '@/i18n';
import type { UserProfile } from '@/types/models';
import { COLLECTIONS } from './collections';

export type UserProfileInput = Omit<UserProfile, 'id'>;

export interface SelfRegistrationInput {
  email: string;
  firstName: string;
  lastName: string;
  role: SelfRegistrationRole;
}

export interface OwnProfileUpdate {
  email: string;
  firstName: string;
  lastName: string;
  currentPassword: string;
}

export type SelfRegistrationRole = 'trainee' | 'trainer';

class DisallowedRegistrationEmailError extends Error {
  readonly code = 'registration/sdis-email-not-allowed';
}

function isDisallowedEmail(email: string): boolean {
  const domain = email.split('@').at(-1) ?? '';
  return domain === 'sdis01.fr' || domain.endsWith('.sdis01.fr');
}

const usersCollection = collection(db, COLLECTIONS.users);

export const userDocRef = (userId: string) => doc(db, COLLECTIONS.users, userId);

export const usersQuery = () => query(usersCollection);

export const traineesQuery = () => query(usersCollection, where('role', '==', 'trainee'));

/** Trainers and administrators: the accounts that can be the referent of a module. */
export const staffQuery = () => query(usersCollection, where('role', 'in', ['admin', 'trainer']));

/**
 * Creates the Firebase Auth account through a secondary Auth instance (the administrator
 * stays signed in), then writes the profile that carries the role.
 */
export async function createUserAccount(input: UserProfileInput, password: string): Promise<string> {
  const credential = await createUserWithEmailAndPassword(accountCreationAuth, input.email.trim(), password);
  await signOut(accountCreationAuth);
  await setDoc(userDocRef(credential.user.uid), {
    ...input,
    email: input.email.trim().toLowerCase(),
    createdAt: Date.now(),
  });
  return credential.user.uid;
}

export async function registerUser(input: SelfRegistrationInput, password: string): Promise<string> {
  const email = input.email.trim().toLowerCase();
  if (isDisallowedEmail(email)) {
    throw new DisallowedRegistrationEmailError();
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(userDocRef(credential.user.uid), {
      email: credential.user.email ?? email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      role: input.role,
      moduleId: null,
      active: true,
      createdAt: Date.now(),
    });
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Could not create or clean up the registration account.');
    }
    throw error;
  }
  return credential.user.uid;
}

/**
 * Updates a profile. When the user becomes a trainee, they are removed as module referent.
 * Login email changes are handled by the owner in Firebase Auth.
 */
export async function updateUserProfile(userId: string, input: Omit<UserProfileInput, 'email'>): Promise<void> {
  const batch = writeBatch(db);
  // `phone` is no longer collected: drop it from older profiles.
  batch.update(userDocRef(userId), { ...input, phone: deleteField(), updatedAt: Date.now() });
  if (input.role === 'trainee') {
    const modules = await getDocs(query(collection(db, COLLECTIONS.modules), where('referentId', '==', userId)));
    modules.docs.forEach((trainingModule) => batch.update(trainingModule.ref, { referentId: null }));
  }
  await batch.commit();
}

export async function updateOwnProfile(userId: string, input: OwnProfileUpdate): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('You can only update your own profile.');
  }

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const currentEmail = currentUser.email?.toLowerCase();

  if (!firstName || !lastName || !email) {
    throw new Error('Name, first name and email are required.');
  }
  if (isDisallowedEmail(email)) {
    throw new DisallowedRegistrationEmailError();
  }

  if (email !== currentEmail) {
    if (!input.currentPassword) {
      const error = new Error('Your current password is required to change your email.');
      Object.assign(error, { code: 'auth/requires-recent-login' });
      throw error;
    }
    await reauthenticateWithCredential(
      currentUser,
      EmailAuthProvider.credential(currentUser.email ?? email, input.currentPassword),
    );
    await updateEmail(currentUser, email);
    await currentUser.getIdToken(true);
  }

  await updateProfile(currentUser, { displayName: `${firstName} ${lastName}` });
  await updateDoc(userDocRef(userId), {
    email: currentUser.email ?? email,
    firstName,
    lastName,
    updatedAt: Date.now(),
  });
}

/**
 * Deletes the Firebase Auth account, profile and any group referent assignments.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const deleteAccount = httpsCallable<{ userId: string }, { deleted: boolean }>(functions, 'deleteUserAccount');
  await deleteAccount({ userId });
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

export function assignUserToModule(userId: string, moduleId: string | null): Promise<void> {
  return updateDoc(userDocRef(userId), { moduleId });
}
