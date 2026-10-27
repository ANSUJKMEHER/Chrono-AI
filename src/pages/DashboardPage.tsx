import React from 'react';
import { Plus, Sparkles, Clock, Calendar, CheckCircle } from 'lucide-react';
import { OnboardingHero } from '../components/dashboard/OnboardingHero';
import { SmartInsights } from '../components/dashboard/SmartInsights';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { TodaySchedule } from '../components/dashboard/TodaySchedule';
import { WorkloadBar } from '../components/dashboard/WorkloadBar';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks';
import { getGreeting } from '../utils/dateUtils';
import { Task } from '../types/task';
import { useTasks } from '../context/TaskContext';

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
  const { tasks } = useTasks();

  return (
    <div className="space-y-6">
      {/* 1. Onboarding Hero Card (can be dismissed or kept) */}
      <OnboardingHero onOpenAddModal={onOpenAddModal} />

      {/* 2. Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Deadline Intelligence Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            {subtitle} ChronoAI converts unstructured emails and announcements into backward preparation schedules.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import a Deadline</span>
          </button>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
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
