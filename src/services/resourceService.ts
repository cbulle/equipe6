import { addDoc, collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Resource } from '@/types/models';
import { COLLECTIONS } from './collections';

export type ResourceInput = Omit<Resource, 'id' | 'createdAt'>;

const resourcesCollection = collection(db, COLLECTIONS.resources);

export const resourcesQuery = () => query(resourcesCollection, orderBy('createdAt', 'desc'));

/** Documents are hosted elsewhere (Google Drive, SharePoint…): only their link is stored. */
export async function addResource(input: ResourceInput): Promise<void> {
  await addDoc(resourcesCollection, {
    ...input,
    title: input.title.trim(),
    url: input.url.trim(),
    createdAt: Date.now(),
  } satisfies Omit<Resource, 'id'>);
}

export function deleteResource(resource: Resource): Promise<void> {
  return deleteDoc(doc(db, COLLECTIONS.resources, resource.id));
}
