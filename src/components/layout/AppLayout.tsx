import clsx from 'clsx';
import {
  BookMarked,
  CalendarDays,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Users,
  UsersRound,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser, useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import type { UserRole } from '@/types/models';
import { fullName } from '@/utils/names';
import { RoleBadge } from '../shared/DomainBadges';
import { Avatar } from '../ui/Avatar';
import { AppLogo } from './AppLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavigationItem {
  to: string;
  labelKey: 'dashboard' | 'myBooklet' | 'calendar' | 'trainees' | 'resources' | 'users' | 'groups' | 'modules';
  icon: LucideIcon;
  roles: UserRole[];
  section: 'main' | 'admin';
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { to: '/', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['admin', 'trainer', 'trainee'], section: 'main' },
  { to: '/my-booklet', labelKey: 'myBooklet', icon: BookMarked, roles: ['trainee'], section: 'main' },
  { to: '/calendar', labelKey: 'calendar', icon: CalendarDays, roles: ['admin', 'trainer', 'trainee'], section: 'main' },
  { to: '/trainees', labelKey: 'trainees', icon: UsersRound, roles: ['admin', 'trainer'], section: 'main' },
  { to: '/resources', labelKey: 'resources', icon: FolderOpen, roles: ['admin', 'trainer', 'trainee'], section: 'main' },
  { to: '/admin/users', labelKey: 'users', icon: Users, roles: ['admin'], section: 'admin' },
  { to: '/admin/groups', labelKey: 'groups', icon: UsersRound, roles: ['admin'], section: 'admin' },
  { to: '/admin/modules', labelKey: 'modules', icon: ListChecks, roles: ['admin'], section: 'admin' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { role, signOut } = useAuth();
  const { profile } = useCurrentUser();
  const items = NAVIGATION_ITEMS.filter((item) => role && item.roles.includes(role));

  const renderItems = (section: NavigationItem['section']) =>
    items
      .filter((item) => item.section === section)
      .map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-sm border-l-4 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-fire-600 bg-white font-semibold text-brand-900'
                : 'border-transparent text-brand-100 hover:bg-white/10 hover:text-white',
            )
          }
        >
          <item.icon className="size-5 shrink-0" />
          {t(`nav.${item.labelKey}`)}
        </NavLink>
      ));

  return (
    <div className="flex h-full flex-col bg-brand-800 px-3 py-4">
      <div className="-mx-3 -mt-4 mb-4 border-b border-white/10 bg-brand-900 px-5 py-4">
        <AppLogo inverted />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label={t('nav.mainNavigation')}>
        {renderItems('main')}
        {role === 'admin' && (
          <>
            <p className="mt-6 mb-1 border-b border-white/10 px-3 pb-1 text-xs font-bold tracking-wider text-brand-300 uppercase">
              {t('nav.administration')}
            </p>
            {renderItems('admin')}
          </>
        )}
      </nav>
      <div className="-mx-3 -mb-4 mt-4 border-t border-white/10 bg-brand-900 px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar person={profile} size="sm" tone="fire" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{fullName(profile)}</p>
            <RoleBadge role={profile.role} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <LanguageSwitcher className="text-brand-100" />
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium text-brand-100 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            {t('auth.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)} aria-hidden />
          <aside className="relative h-full w-72 max-w-[85vw] shadow-xl">
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              aria-label={t('common.close')}
              className="absolute top-4 right-3 z-10 rounded-lg p-1 text-brand-200 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-brand-700 bg-white px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label={t('nav.openMenu')}
          className="rounded-lg p-1.5 text-brand-800 hover:bg-brand-100"
        >
          <Menu className="size-6" />
        </button>
        <AppLogo />
        <span className="size-9" />
      </header>

      {!isOnline && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">
          <WifiOff className="size-4" />
          {t('app.offline')}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
