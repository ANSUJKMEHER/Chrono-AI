import React from 'react';
import { Clock, Calendar, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const SummaryCards: React.FC = () => {
  const { stats } = useTasks();

  const cards = [
    {
      label: 'Due Today',
      value: stats.dueToday,
      subtext: stats.dueToday > 0 ? 'Requires attention today' : 'All clear for today',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200/60 dark:border-amber-900/40',
      activeAlert: stats.dueToday > 0,
    },
    {
      label: 'Due This Week',
      value: stats.dueThisWeek,
      subtext: 'Next 7 days schedule',
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      border: 'border-indigo-200/60 dark:border-indigo-900/40',
      activeAlert: false,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      subtext: stats.overdue > 0 ? 'Immediate action required' : 'No overdue tasks',
      icon: AlertOctagon,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      border: 'border-rose-200/60 dark:border-rose-900/40',
      activeAlert: stats.overdue > 0,
    },
    {
      label: 'Completed This Week',
      value: stats.completedThisWeek,
      subtext: `${stats.totalCompleted} all-time completed`,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-200/60 dark:border-emerald-900/40',
      activeAlert: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-obsidian-900 border ${c.border} shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center ${c.color} transition-transform group-hover:scale-105`}>
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums font-mono">
                {c.value}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
                {c.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
