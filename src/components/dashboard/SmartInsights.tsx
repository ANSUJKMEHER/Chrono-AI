import React from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { parseDateTime, formatFriendlyDate } from '../../utils/dateUtils';

export const SmartInsights: React.FC = () => {
  const { tasks, stats } = useTasks();

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const now = new Date();

  if (activeTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs p-5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Smart AI Insights
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No active workload detected. Import an assignment to generate schedule analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate insights
  const totalPrepMinsWeek = stats.workloadByDay.reduce((acc, d) => acc + d.prepMinutes, 0);
  const totalPrepHoursWeek = Math.round((totalPrepMinsWeek / 60) * 10) / 10;
  const busiestDay = [...stats.workloadByDay].sort((a, b) => b.prepMinutes - a.prepMinutes)[0];

  const dangerTasks = activeTasks.filter(t => {
    const targetDt = parseDateTime(t.deadlineDate, t.deadlineTime);
    if (!targetDt) return false;
    const hoursRemaining = (targetDt.getTime() - now.getTime()) / (1000 * 60 * 60);
    const effortHours = t.estimatedMinutes / 60;
    return hoursRemaining > 0 && hoursRemaining < effortHours * 1.5;
  });

  const mostUrgent = stats.upcomingTasks[0];

  return (
    <div className="bg-white dark:bg-obsidian-900 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs p-5 space-y-3.5 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>ChronoAI Workload Intelligence</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
                Live Analysis
              </span>
            </h3>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Computed across {activeTasks.length} active deadline{activeTasks.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Insight 1: Weekly Volume */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-obsidian-850 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weekly Effort</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {totalPrepHoursWeek}h scheduled prep
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {busiestDay && busiestDay.prepMinutes > 0
                ? `Peak load on ${busiestDay.dayLabel} (${Math.round(busiestDay.prepMinutes / 60 * 10) / 10}h)`
                : 'Balanced evenly across the week.'}
            </p>
          </div>
        </div>

        {/* Insight 2: Danger / Urgency Flag */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-obsidian-850 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              dangerTasks.length > 0
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
            }`}
          >
            {dangerTasks.length > 0 ? (
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {dangerTasks.length > 0 ? 'Urgency Alert' : 'Feasibility Status'}
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {dangerTasks.length > 0
                ? `${dangerTasks.length} tight schedule${dangerTasks.length > 1 ? 's' : ''}`
                : 'All deadlines are feasible'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate leading-snug">
              {dangerTasks.length > 0
                ? `Immediate start advised: ${dangerTasks[0].title}`
                : 'No high-risk cramming schedules detected.'}
            </p>
          </div>
        </div>

        {/* Insight 3: Next Horizon Focus */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-obsidian-850 rounded-xl border border-slate-200/70 dark:border-white/[0.06] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Immediate Focus</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {mostUrgent ? mostUrgent.title : 'No upcoming deadlines'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {mostUrgent
                ? `Due ${formatFriendlyDate(mostUrgent.deadlineDate, mostUrgent.deadlineTime)}`
                : 'Enjoy your free time!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
