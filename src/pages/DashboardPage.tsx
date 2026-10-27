import React from 'react';
import { Plus } from 'lucide-react';
import { OnboardingHero } from '../components/dashboard/OnboardingHero';
import { SmartInsights } from '../components/dashboard/SmartInsights';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { TodaySchedule } from '../components/dashboard/TodaySchedule';
import { WorkloadBar } from '../components/dashboard/WorkloadBar';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { getGreeting } from '../utils/dateUtils';
import { Task } from '../types/task';

interface DashboardPageProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
  searchQuery?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
  searchQuery = '',
}) => {
  const { greeting, subtitle } = getGreeting();

  return (
    <div className="space-y-6">
      {/* 1. Onboarding Hero Card (can be dismissed or kept) */}
      <OnboardingHero onOpenAddModal={onOpenAddModal} />

      {/* 2. Sleek Contextual Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-md">
              Deadline Intelligence Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {subtitle} ChronoAI converts unstructured assignment announcements into backward preparation schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 border border-indigo-500/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import a Deadline</span>
          </button>
        </div>
      </div>

      {/* 3. Smart Workload Intelligence Insights */}
      <SmartInsights />

      {/* 4. 4 Summary Cards */}
      <SummaryCards />

      {/* 5. Main Grid: Today's Action Plan + 7-Day Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaySchedule
          onOpenTaskDetails={onOpenTaskDetails}
          onOpenAddModal={onOpenAddModal}
        />
        <WorkloadBar />
      </div>

      {/* 6. Upcoming Deadlines Full Section */}
      <UpcomingTasks
        onOpenTaskDetails={onOpenTaskDetails}
        onOpenAddModal={onOpenAddModal}
        searchQuery={searchQuery}
      />
    </div>
  );
};
