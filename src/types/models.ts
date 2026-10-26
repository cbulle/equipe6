export const USER_ROLES = ['admin', 'trainer', 'trainee'] as const;
export const APPRENTICE_TYPES = ['SPV', 'JSP_N3', 'JSP_N4'] as const;
export const MODULE_TARGET_TYPES = ['ALL', 'SPV_ONLY', 'JSP_ONLY'] as const;
export const EVALUATION_SCALES = ['levels', 'status'] as const;
export const SESSION_TYPES = ['course', 'sport', 'opening'] as const;
export const SKILL_LEVELS = ['N1', 'N2', 'N3'] as const;
export const SKILL_STATUSES = ['IN_PROGRESS', 'ACQUIRED', 'TO_REVIEW'] as const;
/** `level` of the evaluation that declares a whole module finished, whether or not every box was ticked. */
export const MODULE_COMPLETED = 'MODULE_COMPLETED';
export const ATTENDANCE_STATUSES = ['present', 'absent', 'excused'] as const;
export const INTERNSHIP_CODES = ['PS', 'SEE', 'OD', 'PROTEC', 'INC'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ApprenticeType = (typeof APPRENTICE_TYPES)[number];
export type ModuleTargetType = (typeof MODULE_TARGET_TYPES)[number];
export type EvaluationScale = (typeof EVALUATION_SCALES)[number];
export type SessionType = (typeof SESSION_TYPES)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];
export type SkillStatus = (typeof SKILL_STATUSES)[number];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type InternshipCode = (typeof INTERNSHIP_CODES)[number];

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  apprenticeType: ApprenticeType | null;
  groupId: string | null;
  fireStation: string;
  active: boolean;
}

export interface Group {
  id: string;
  label: string;
  referentId: string | null;
  promoYear: number;
  active: boolean;
}

export interface TrainingModule {
  id: string;
  code: string;
  label: string;
  targetType: ModuleTargetType;
  evaluationScale: EvaluationScale;
  order: number;
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

export interface Attendance {
  id: string;
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
  note: string;
  recordedBy: string;
  recordedAt: number;
}

export interface Evaluation {
  id: string;
  userId: string;
  /** Empty for a module completion. */
  competencyId: string;
  moduleId: string;
  level: SkillLevel | SkillStatus | typeof MODULE_COMPLETED;
  validatedBy: string;
  validatedByName: string;
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
  exempted: boolean;
}

export interface InternshipWishes {
  id: string;
  userId: string;
  choices: Record<InternshipCode, InternshipChoice>;
  constraints: string;
  updatedAt: number;
}
