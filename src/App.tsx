import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth } from './components/routing/RequireAuth';
import { RequireRole } from './components/routing/RequireRole';
import { PageLoader } from './components/ui/Feedback';
import { AuthProvider } from './contexts/AuthProvider';
import { LoginPage } from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));
const RollCallPage = lazy(() => import('./pages/RollCallPage').then((module) => ({ default: module.RollCallPage })));
const TraineesPage = lazy(() => import('./pages/TraineesPage').then((module) => ({ default: module.TraineesPage })));
const TraineeBookletPage = lazy(() =>
  import('./pages/TraineeBookletPage').then((module) => ({ default: module.TraineeBookletPage })),
);
const MyBookletPage = lazy(() => import('./pages/MyBookletPage').then((module) => ({ default: module.MyBookletPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((module) => ({ default: module.ResourcesPage })));
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then((module) => ({ default: module.UsersPage })));
const GroupsPage = lazy(() => import('./pages/admin/GroupsPage').then((module) => ({ default: module.GroupsPage })));
const ModulesPage = lazy(() => import('./pages/admin/ModulesPage').then((module) => ({ default: module.ModulesPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="resources" element={<ResourcesPage />} />

                <Route element={<RequireRole roles={['trainee']} />}>
                  <Route path="my-booklet" element={<MyBookletPage />} />
                </Route>

                <Route element={<RequireRole roles={['admin', 'trainer']} />}>
                  <Route path="sessions/:sessionId/roll-call" element={<RollCallPage />} />
                  <Route path="trainees" element={<TraineesPage />} />
                  <Route path="trainees/:userId" element={<TraineeBookletPage />} />
                </Route>

                <Route path="admin" element={<RequireRole roles={['admin']} />}>
                  <Route path="users" element={<UsersPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                  <Route path="modules" element={<ModulesPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-center" closeButton />
    </AuthProvider>
  );
}
