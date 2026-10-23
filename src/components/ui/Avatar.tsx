import clsx from 'clsx';
import { initials } from '@/utils/names';

interface AvatarProps {
  person: { firstName: string; lastName: string };
  size?: 'sm' | 'md' | 'lg';
  tone?: 'brand' | 'fire';
}

const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
};

export function Avatar({ person, size = 'md', tone = 'brand' }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        tone === 'fire' ? 'bg-fire-100 text-fire-700' : 'bg-brand-100 text-brand-800',
        SIZE_CLASSES[size],
      )}
    >
      {initials(person)}
    </span>
  );
}
