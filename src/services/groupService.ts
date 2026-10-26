import { addDoc, collection, doc, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Group } from '@/types/models';
import { COLLECTIONS } from './collections';
import { userDocRef } from './userService';

export type GroupInput = Omit<Group, 'id'>;

const groupsCollection = collection(db, COLLECTIONS.groups);

export const groupDocRef = (groupId: string) => doc(db, COLLECTIONS.groups, groupId);

export const groupsQuery = () => query(groupsCollection, orderBy('label'));

/** Ids of the groups the user is referent of. */
export const referentGroupIdsOf = (userId: string, groups: Group[]) =>
  groups.filter((group) => group.referentId === userId).map((group) => group.id);

export async function createGroup(input: GroupInput): Promise<void> {
  await addDoc(groupsCollection, input);
}

export function updateGroup(groupId: string, input: Partial<GroupInput>): Promise<void> {
  return updateDoc(groupDocRef(groupId), input);
}

/** Deletes the group and moves its members to "no group". */
export async function deleteGroup(groupId: string, memberIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  memberIds.forEach((memberId) => batch.update(userDocRef(memberId), { groupId: null }));
  batch.delete(groupDocRef(groupId));
  await batch.commit();
}
