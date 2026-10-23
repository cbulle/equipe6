import { useMemo } from 'react';
import { sessionAttendancesQuery, userAttendancesQuery } from '@/services/attendanceService';
import { userEvaluationsQuery } from '@/services/evaluationService';
import { groupDocRef, groupsQuery } from '@/services/groupService';
import { userInterviewsQuery } from '@/services/interviewService';
import { resourcesQuery } from '@/services/resourceService';
import { sessionDocRef, sessionsQuery } from '@/services/sessionService';
import { competenciesQuery, modulesQuery } from '@/services/trainingService';
import { trainersQuery, traineesQuery, userDocRef, usersQuery } from '@/services/userService';
import { internshipWishesDocRef } from '@/services/wishService';
import type {
  Attendance,
  Competency,
  Evaluation,
  Group,
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

export function useTrainers() {
  const state = useCollectionData<UserProfile>(trainersQuery());
  return { ...state, data: useSortedUsers(state.data) };
}

export const useUser = (userId: string | null | undefined) =>
  useDocumentData<UserProfile>(userId ? userDocRef(userId) : null);

export const useGroups = () => useCollectionData<Group>(groupsQuery());

export const useGroup = (groupId: string | null | undefined) =>
  useDocumentData<Group>(groupId ? groupDocRef(groupId) : null);

export const useModules = () => useCollectionData<TrainingModule>(modulesQuery());

export const useCompetencies = () => useCollectionData<Competency>(competenciesQuery());

export const useSessions = () => useCollectionData<TrainingSession>(sessionsQuery());

export const useSession = (sessionId: string | undefined) =>
  useDocumentData<TrainingSession>(sessionId ? sessionDocRef(sessionId) : null);

export const useResources = () => useCollectionData<Resource>(resourcesQuery());

export const useSessionAttendances = (sessionId: string | undefined) =>
  useCollectionData<Attendance>(sessionId ? sessionAttendancesQuery(sessionId) : null);

export const useUserAttendances = (userId: string | undefined) =>
  useCollectionData<Attendance>(userId ? userAttendancesQuery(userId) : null);

export const useUserEvaluations = (userId: string | undefined) =>
  useCollectionData<Evaluation>(userId ? userEvaluationsQuery(userId) : null);

export function useUserInterviews(userId: string | undefined) {
  const state = useCollectionData<Interview>(userId ? userInterviewsQuery(userId) : null);
  const data = useMemo(() => [...state.data].sort((first, second) => first.date.localeCompare(second.date)), [state.data]);
  return { ...state, data };
}

export const useInternshipWishes = (userId: string | undefined) =>
  useDocumentData<InternshipWishes>(userId ? internshipWishesDocRef(userId) : null);
