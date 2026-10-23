import { BookOpen, Check, Clock, Dumbbell, Flag, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  ApprenticeType,
  AttendanceStatus,
  SessionType,
  SkillStatus,
  UserRole,
} from '@/types/models';
import { Badge, type BadgeTone } from '../ui/Badge';

const SESSION_TYPE_TONES: Record<SessionType, BadgeTone> = { course: 'brand', sport: 'success', opening: 'fire' };
const SESSION_TYPE_ICONS: Record<SessionType, typeof BookOpen> = { course: BookOpen, sport: Dumbbell, opening: Flag };

export function SessionTypeBadge({ type }: { type: SessionType }) {
  const { t } = useTranslation();
  const Icon = SESSION_TYPE_ICONS[type];
  return (
    <Badge tone={SESSION_TYPE_TONES[type]} icon={<Icon className="size-3" />}>
      {t(`sessionTypes.${type}`)}
    </Badge>
  );
}

const ROLE_TONES: Record<UserRole, BadgeTone> = { admin: 'fire', trainer: 'brand', trainee: 'neutral' };

export function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useTranslation();
  return <Badge tone={ROLE_TONES[role]}>{t(`roles.${role}`)}</Badge>;
}

export function ApprenticeTypeBadge({ type }: { type: ApprenticeType | null }) {
  const { t } = useTranslation();
  if (!type) {
    return null;
  }
  return <Badge tone={type === 'SPV' ? 'brand' : 'warning'}>{t(`apprenticeTypes.short.${type}`)}</Badge>;
}

const ATTENDANCE_TONES: Record<AttendanceStatus, BadgeTone> = { present: 'success', absent: 'fire', excused: 'warning' };
const ATTENDANCE_ICONS: Record<AttendanceStatus, typeof Check> = { present: Check, absent: X, excused: Clock };

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus | null }) {
  const { t } = useTranslation();
  if (!status) {
    return <Badge tone="neutral">{t('attendanceStatuses.unrecorded')}</Badge>;
  }
  const Icon = ATTENDANCE_ICONS[status];
  return (
    <Badge tone={ATTENDANCE_TONES[status]} icon={<Icon className="size-3" />}>
      {t(`attendanceStatuses.${status}`)}
    </Badge>
  );
}

const SKILL_STATUS_TONES: Record<SkillStatus, BadgeTone> = {
  IN_PROGRESS: 'info',
  ACQUIRED: 'success',
  TO_REVIEW: 'warning',
};
const SKILL_STATUS_ICONS: Record<SkillStatus, typeof Check> = {
  IN_PROGRESS: Clock,
  ACQUIRED: Check,
  TO_REVIEW: RotateCcw,
};

export function SkillStatusBadge({ status }: { status: SkillStatus | null }) {
  const { t } = useTranslation();
  if (!status) {
    return <Badge tone="neutral">{t('skillStatuses.none')}</Badge>;
  }
  const Icon = SKILL_STATUS_ICONS[status];
  return (
    <Badge tone={SKILL_STATUS_TONES[status]} icon={<Icon className="size-3" />}>
      {t(`skillStatuses.${status}`)}
    </Badge>
  );
}
