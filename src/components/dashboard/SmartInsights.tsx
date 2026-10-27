import React from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { getTodayString, parseDateTime, diffInDays, formatFriendlyDate } from '../../utils/dateUtils';

export const SmartInsights: React.FC = () => {
  const { tasks, stats } = useTasks();

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const now = new Date();

  if (activeTasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Smart AI Insights
            </h4>
            <p className="text-xs text-slate-500">
              No active workload detected. Import an assignment to generate schedule analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate insights
  // 1. Total preparation hours in next 7 days
  const totalPrepMinsWeek = stats.workloadByDay.reduce((acc, d) => acc + d.prepMinutes, 0);
  const totalPrepHoursWeek = Math.round((totalPrepMinsWeek / 60) * 10) / 10;

  // 2. Busiest day
  const busiestDay = [...stats.workloadByDay].sort((a, b) => b.prepMinutes - a.prepMinutes)[0];

  // 3. Danger tasks: (effort / hours remaining > 0.8)
  const dangerTasks = activeTasks.filter(t => {
    const targetDt = parseDateTime(t.deadlineDate, t.deadlineTime);
    if (!targetDt) return false;
    const hoursRemaining = (targetDt.getTime() - now.getTime()) / (1000 * 60 * 60);
    const effortHours = t.estimatedMinutes / 60;
    return hoursRemaining > 0 && hoursRemaining < effortHours * 1.5;
  });

  // 4. Most urgent task
  const mostUrgent = stats.upcomingTasks[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>ChronoAI Workload Intelligence</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold">
                Live Analysis
              </span>
            </h3>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Computed across {activeTasks.length} active deadline{activeTasks.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Insight 1: Weekly Volume */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-700 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Weekly Effort</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {totalPrepHoursWeek}h scheduled prep
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {busiestDay && busiestDay.prepMinutes > 0
                ? `Peak load on ${busiestDay.dayLabel} (${Math.round(busiestDay.prepMinutes / 60 * 10) / 10}h)`
                : 'Balanced evenly across the week.'}
            </p>
          </div>
        </div>

        {/* Insight 2: Danger / Urgency Flag */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              dangerTasks.length > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {dangerTasks.length > 0 ? (
              <Flame className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">
              {dangerTasks.length > 0 ? 'Urgency Alert' : 'Feasibility Status'}
            </div>
            <div className="text-xs font-bold text-slate-900 mt-0.5">
              {dangerTasks.length > 0
                ? `${dangerTasks.length} tight schedule${dangerTasks.length > 1 ? 's' : ''}`
                : 'All deadlines are feasible'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {dangerTasks.length > 0
                ? `Immediate start advised: ${dangerTasks[0].title}`
                : 'No high-risk cramming schedules detected.'}
            </p>
          </div>
        </div>

        {/* Insight 3: Next Horizon Focus */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100/70 text-amber-800 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Immediate Focus</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
              {mostUrgent ? mostUrgent.title : 'No upcoming deadlines'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
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
