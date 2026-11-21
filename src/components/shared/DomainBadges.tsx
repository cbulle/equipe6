import { BookOpen, Dumbbell, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SessionType, UserRole } from '@/types/models';
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
