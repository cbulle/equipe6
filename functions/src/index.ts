import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();

const db = getFirestore();

export const deleteUserAccount = onCall({ region: 'europe-west1' }, async (request) => {
  const callerId = request.auth?.uid;
  if (!callerId) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerProfile = await db.doc(`users/${callerId}`).get();
  if (callerProfile.data()?.active !== true || callerProfile.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only active administrators can delete accounts.');
  }

  const userId = request.data?.userId;
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new HttpsError('invalid-argument', 'A user ID is required.');
  }

  try {
    await getAuth().deleteUser(userId);
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') {
      logger.error('Failed to delete Firebase Auth user.', { userId, error });
      throw new HttpsError('internal', 'The Firebase Auth account could not be deleted.');
    }
  }

  const groups = await db.collection('groups').where('referentId', '==', userId).get();
  const batch = db.batch();
  batch.delete(db.doc(`users/${userId}`));
  groups.docs.forEach((group) => batch.update(group.ref, { referentId: null }));
  try {
    await batch.commit();
  } catch (error) {
    logger.error('Firebase Auth account was deleted, but profile cleanup failed.', { userId, error });
    throw new HttpsError('internal', 'The account was deleted, but its profile cleanup failed.');
  }

  return { deleted: true };
});
