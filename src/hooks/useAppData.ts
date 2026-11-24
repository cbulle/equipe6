import { useMemo } from 'react';
import { userEvaluationsQuery } from '@/services/evaluationService';
import { userInterviewsQuery } from '@/services/interviewService';
import { resourcesQuery } from '@/services/resourceService';
import { sessionDocRef, sessionsQuery } from '@/services/sessionService';
import { competenciesQuery, modulesQuery } from '@/services/trainingService';
import { staffQuery, traineesQuery, userDocRef, usersQuery } from '@/services/userService';
import { internshipWishesDocRef } from '@/services/wishService';
import type {
  Competency,
  Evaluation,
  InternshipWishes,
  Interview,
  Resource,
  TrainingModule,
  TrainingSession,
  UserProfile,
} from '@/types/models';
import { compareByName } from '@/utils/names';
import { useCollectionData, useDocumentData } from './useFirestore';

function useSortedUsers(users: UserProfile[]) {
  return useMemo(() => [...users].sort(compareByName), [users]);
}

export function useUsers() {
  const state = useCollectionData<UserProfile>(usersQuery());
  return { ...state, data: useSortedUsers(state.data) };
}

export function useTrainees() {
  const state = useCollectionData<UserProfile>(traineesQuery());
  return { ...state, data: useSortedUsers(state.data) };
}

/** Active trainers and administrators: anyone who can be the referent of a module. */
export function useReferentCandidates() {
  const state = useCollectionData<UserProfile>(staffQuery());
  const staff = useSortedUsers(state.data);
  return { ...state, data: useMemo(() => staff.filter((user) => user.active), [staff]) };
}

export const useUser = (userId: string | null | undefined) =>
  useDocumentData<UserProfile>(userId ? userDocRef(userId) : null);

export const useModules = () => useCollectionData<TrainingModule>(modulesQuery());

export const useCompetencies = () => useCollectionData<Competency>(competenciesQuery());

export const useSessions = () => useCollectionData<TrainingSession>(sessionsQuery());

export const useSession = (sessionId: string | undefined) =>
  useDocumentData<TrainingSession>(sessionId ? sessionDocRef(sessionId) : null);

export const useResources = () => useCollectionData<Resource>(resourcesQuery());

export const useUserEvaluations = (userId: string | undefined) =>
  useCollectionData<Evaluation>(userId ? userEvaluationsQuery(userId) : null);

export function useUserInterviews(userId: string | undefined) {
  const state = useCollectionData<Interview>(userId ? userInterviewsQuery(userId) : null);
  const data = useMemo(() => [...state.data].sort((first, second) => first.date.localeCompare(second.date)), [state.data]);
  return { ...state, data };
}

export const useInternshipWishes = (userId: string | undefined) =>
  useDocumentData<InternshipWishes>(userId ? internshipWishesDocRef(userId) : null);
