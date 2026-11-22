import clsx from 'clsx';
import {
  BookMarked,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Users,
  UsersRound,
  UserRound,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser, useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { UserRole } from '@/types/models';
import { fullName } from '@/utils/names';
import { Avatar } from '../ui/Avatar';
import { AppLogo } from './AppLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavigationItem {
  to: string;
  labelKey: 'dashboard' | 'myBooklet' | 'calendar' | 'trainees' | 'resources' | 'profile' | 'users' | 'groups' | 'modules';
  icon: LucideIcon;
  roles: UserRole[];
  section: 'overview' | 'training' | 'progress' | 'admin';
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { to: '/', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'trainer', 'trainee'], section: 'overview' },
  { to: '/calendar', labelKey: 'calendar', icon: CalendarDays, roles: ['admin', 'trainer', 'trainee'], section: 'training' },
  { to: '/resources', labelKey: 'resources', icon: FolderOpen, roles: ['admin', 'trainer', 'trainee'], section: 'training' },
  { to: '/my-booklet', labelKey: 'myBooklet', icon: BookMarked, roles: ['trainee'], section: 'progress' },
  { to: '/trainees', labelKey: 'trainees', icon: UsersRound, roles: ['admin', 'trainer'], section: 'progress' },
  { to: '/admin/users', labelKey: 'users', icon: Users, roles: ['admin'], section: 'admin' },
  { to: '/admin/groups', labelKey: 'groups', icon: UsersRound, roles: ['admin'], section: 'admin' },
  { to: '/admin/modules', labelKey: 'modules', icon: ListChecks, roles: ['admin'], section: 'admin' },
];

export function AppLayout() {
  const { t } = useTranslation();
  const { role, signOut } = useAuth();
  const { profile } = useCurrentUser();
  const isOnline = useOnlineStatus();
  const items = NAVIGATION_ITEMS.filter((item) => role && item.roles.includes(role));
  const mobileItems: NavigationItem[] = [
    ...items,
    { to: '/profile', labelKey: 'profile', icon: UserRound, roles: ['admin', 'trainer', 'trainee'], section: 'overview' },
  ];

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-brand-900',
    );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-brand-200/80 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5">
          <Link to="/" aria-label={t('nav.dashboard')} className="shrink-0">
            <AppLogo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <NavLink to="/profile" className="hidden items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-50 sm:flex">
              <Avatar person={profile} size="sm" tone="fire" />
              <span className="max-w-36 truncate text-sm font-medium text-slate-700">{fullName(profile)}</span>
            </NavLink>
            <LanguageSwitcher className="text-slate-600" />
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label={t('auth.signOut')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-fire-700 transition-colors hover:bg-fire-50 sm:text-sm"
            >
              <LogOut className="size-4" />
              <span className="hidden lg:inline">{t('auth.signOut')}</span>
            </button>
          </div>
        </div>
        <nav
          aria-label={t('nav.mainNavigation')}
          className="-mx-4 hidden overflow-x-auto border-t border-brand-300 bg-brand-200 px-4 sm:block lg:-mx-10 lg:px-10"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-1 py-2">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClassName}>
                <item.icon className="size-4 shrink-0" />
                <span>{t(`nav.${item.labelKey}`)}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">
          <WifiOff className="size-4" />
          {t('app.offline')}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-7 pb-28 sm:px-7 sm:pb-10 lg:px-10 lg:py-10">
        <Outlet />
      </main>
      <nav
        aria-label={t('nav.mainNavigation')}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-300 bg-brand-200 px-2 pt-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(28_33_28/0.06)] backdrop-blur sm:hidden"
      >
        <div className="mx-auto flex w-full max-w-lg items-stretch justify-start overflow-x-auto">
          {mobileItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-900' : 'text-slate-600 hover:text-brand-900',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={clsx('flex size-8 items-center justify-center rounded-full transition-colors', isActive && 'bg-white shadow-sm')}>
                    <item.icon className="size-[18px]" />
                  </span>
                  <span className="max-w-full truncate">{t(`nav.${item.labelKey}`)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
