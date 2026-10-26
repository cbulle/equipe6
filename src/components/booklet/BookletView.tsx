import { Award, CalendarCheck, CalendarHeart, ListChecks, MessagesSquare } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  useCompetencies,
  useInternshipWishes,
  useModules,
  useSessions,
  useUserAttendances,
  useUserEvaluations,
  useUserInterviews,
} from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/models';
import { getModuleCompletions } from '@/services/evaluationService';
import { isJspApprentice } from '@/utils/training';
import { PageLoader } from '../ui/Feedback';
import { Tabs, type TabItem } from '../ui/Tabs';
import { AttendanceTab } from './AttendanceTab';
import { BookletHeader } from './BookletHeader';
import { InterviewsTab } from './InterviewsTab';
import { JspSheetTab } from './JspSheetTab';
import { SkillsTab } from './SkillsTab';
import { WishesTab } from './WishesTab';

export type BookletTab = 'skills' | 'jspSheet' | 'attendance' | 'interviews' | 'wishes';

export function BookletView({ trainee }: { trainee: UserProfile }) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { uid } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: modules, loading: modulesLoading } = useModules();
  const { data: competencies, loading: competenciesLoading } = useCompetencies();
  const { data: evaluations } = useUserEvaluations(trainee.id);
  const completions = useMemo(() => getModuleCompletions(evaluations), [evaluations]);
  const { data: sessions } = useSessions();
  const { data: attendances } = useUserAttendances(trainee.id);
  const { data: interviews } = useUserInterviews(trainee.id);
  const { data: wishes, loading: wishesLoading } = useInternshipWishes(trainee.id);

  const isJsp = isJspApprentice(trainee.apprenticeType);
  const tabs: TabItem<BookletTab>[] = [
    { id: 'skills', label: t('booklet.tabs.skills'), icon: <ListChecks className="size-4" /> },
    ...(isJsp ? [{ id: 'jspSheet' as const, label: t('booklet.tabs.jspSheet'), icon: <Award className="size-4" /> }] : []),
    { id: 'attendance', label: t('booklet.tabs.attendance'), icon: <CalendarCheck className="size-4" /> },
    { id: 'interviews', label: t('booklet.tabs.interviews'), icon: <MessagesSquare className="size-4" /> },
    { id: 'wishes', label: t('booklet.tabs.wishes'), icon: <CalendarHeart className="size-4" /> },
  ];

  const requestedTab = searchParams.get('tab') as BookletTab | null;
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? (requestedTab as BookletTab) : 'skills';

  const handleTabChange = (tab: BookletTab) => setSearchParams({ tab }, { replace: true });

  const renderTab = () => {
    switch (activeTab) {
      case 'jspSheet':
        return (
          <JspSheetTab
            trainee={trainee}
            modules={modules}
            competencies={competencies}
            evaluations={evaluations}
            completions={completions}
          />
        );
      case 'attendance':
        return <AttendanceTab sessions={sessions} attendances={attendances} />;
      case 'interviews':
        return <InterviewsTab trainee={trainee} interviews={interviews} />;
      case 'wishes':
        return wishesLoading ? (
          <PageLoader />
        ) : (
          <WishesTab
            key={wishes?.updatedAt ?? 'empty'}
            trainee={trainee}
            wishes={wishes}
            canEdit={isAdmin || uid === trainee.id}
          />
        );
      default:
        return (
          <SkillsTab
            trainee={trainee}
            modules={modules}
            competencies={competencies}
            evaluations={evaluations}
            completions={completions}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <BookletHeader trainee={trainee} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      {modulesLoading || competenciesLoading ? <PageLoader /> : renderTab()}
    </div>
  );
}
