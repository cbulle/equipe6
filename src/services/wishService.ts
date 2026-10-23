import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { InternshipWishes } from '@/types/models';
import { COLLECTIONS } from './collections';

export type InternshipWishesInput = Pick<InternshipWishes, 'choices' | 'constraints'>;

export const internshipWishesDocRef = (userId: string) => doc(db, COLLECTIONS.internshipWishes, userId);

export function saveInternshipWishes(userId: string, input: InternshipWishesInput): Promise<void> {
  return setDoc(internshipWishesDocRef(userId), { ...input, userId, updatedAt: Date.now() });
}
