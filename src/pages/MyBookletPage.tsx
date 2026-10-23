import { BookletView } from '@/components/booklet/BookletView';
import { useCurrentUser } from '@/hooks/useAuth';

export function MyBookletPage() {
  const { profile } = useCurrentUser();
  return <BookletView trainee={profile} />;
}
