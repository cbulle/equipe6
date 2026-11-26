export const USER_ROLES = ['admin', 'trainer', 'trainee'] as const;
export const SESSION_TYPES = ['course', 'sport', 'opening'] as const;
export const SKILL_LEVELS = ['N1', 'N2', 'N3'] as const;
/** `level` of the evaluation that declares a whole module finished, whether or not every box was ticked. */
export const MODULE_COMPLETED = 'MODULE_COMPLETED';
export const INTERNSHIP_CODES = ['PS', 'SEE', 'OD', 'PROTEC', 'INC'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type SessionType = (typeof SESSION_TYPES)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];
export type InternshipCode = (typeof INTERNSHIP_CODES)[number];

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  moduleId?: string | null;
  active: boolean;
}

export interface TrainingModule {
  id: string;
  code: string;
  label: string;
  order: number;
  referentId?: string | null;
}

export interface Competency {
  id: string;
  moduleId: string;
  code: string;
  label: string;
  criteria: string;
  order: number;
  active: boolean;
}

export interface TrainingSession {
  id: string;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm` */
  startTime: string;
  /** `HH:mm` */
  endTime: string;
  title: string;
  theme: string;
  moduleId: string | null;
  type: SessionType;
  createdBy: string;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  updatedAt: number;
}

export interface Resource {
  id: string;
  title: string;
  /** External link (Google Drive, SharePoint, official website…). */
  url: string;
  sessionId: string | null;
  moduleId: string | null;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: number;
}

export interface Evaluation {
  id: string;
  userId: string;
  /** Empty for a module completion. */
  competencyId: string;
  moduleId: string;
  level: SkillLevel | typeof MODULE_COMPLETED;
  validatedBy: string;
  validatedByName: string;
  /** "NOM.P" label shown under the ticked box; absent on older validations. */
  validatedByShort?: string;
  validatedAt: number;
}

export interface Visa {
  userId: string;
  name: string;
  signedAt: number;
}

export interface Interview {
  id: string;
  userId: string;
  /** School year label, e.g. `2026-2027`. */
  schoolYear: string;
  occurrence: number;
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  strengths: string;
  improvements: string;
  objectives: string;
  trainerVisa: Visa | null;
  traineeVisa: Visa | null;
  createdBy: string;
}

export interface InternshipChoice {
  wishes: string[];
}

export interface InternshipWishes {
  id: string;
  userId: string;
  choices: Record<InternshipCode, InternshipChoice>;
  constraints: string;
  updatedAt: number;
}
