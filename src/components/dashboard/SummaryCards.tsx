import React from 'react';
import { Clock, Calendar, AlertOctagon, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const SummaryCards: React.FC = () => {
  const { stats } = useTasks();

  const cards = [
    {
      label: 'Due Today',
      value: stats.dueToday,
      subtext: stats.dueToday > 0 ? 'Requires attention today' : 'All clear for today',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200/60',
      activeAlert: stats.dueToday > 0,
    },
    {
      label: 'Due This Week',
      value: stats.dueThisWeek,
      subtext: 'Next 7 days schedule',
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200/60',
      activeAlert: false,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      subtext: stats.overdue > 0 ? 'Immediate action required' : 'No overdue tasks',
      icon: AlertOctagon,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200/60',
      activeAlert: stats.overdue > 0,
    },
    {
      label: 'Completed This Week',
      value: stats.completedThisWeek,
      subtext: `${stats.totalCompleted} all-time completed`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/60',
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
            className={`p-4 sm:p-5 rounded-2xl bg-white border ${c.border} shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center ${c.color}`}>
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {c.value}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
                {c.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
