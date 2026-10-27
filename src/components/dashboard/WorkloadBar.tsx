import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const WorkloadBar: React.FC = () => {
  const { stats, settings } = useTasks();
  const maxDayLimit = settings.dailyPrepLimitMinutes || 180;

  // Find max minutes to scale chart height
  const maxMinutesInWeek = Math.max(
    maxDayLimit,
    ...stats.workloadByDay.map(d => d.prepMinutes)
  );

  return (
    <div className="glass-card rounded-3xl p-6 space-y-4 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              7-Day Preparation Workload
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Effort hours distributed leading to upcoming deadlines
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span>Prep Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span>Deadlines</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="grid grid-cols-7 gap-2 pt-6 items-end h-40 border-b border-slate-100 dark:border-white/[0.06] pb-2 relative">
          {stats.workloadByDay.map((day, idx) => {
            const heightPercent = maxMinutesInWeek > 0
              ? Math.min(100, Math.round((day.prepMinutes / maxMinutesInWeek) * 100))
              : 0;

            const isOverLimit = day.prepMinutes > maxDayLimit;

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                {/* Tooltip / value */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 text-[10px] font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-obsidian-750 border border-slate-200 dark:border-white/[0.08] px-1.5 py-0.5 rounded shadow-xs pointer-events-none whitespace-nowrap z-10">
                  {Math.round(day.prepMinutes / 60 * 10) / 10}h
                </div>

                {/* Bar */}
                <div className="w-full max-w-[40px] bg-slate-100 dark:bg-obsidian-850 rounded-t-xl h-24 flex items-end justify-center p-0.5 relative transition-colors">
                  {day.prepMinutes > 0 && (
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isOverLimit
                          ? 'bg-gradient-to-t from-rose-600 to-rose-500'
                          : 'bg-gradient-to-t from-indigo-600 to-indigo-500 group-hover:from-indigo-500 group-hover:to-indigo-400'
                      }`}
                      style={{ height: `${Math.max(14, heightPercent)}%` }}
                    />
                  )}

                  {/* Deadline marker dot if a deadline falls on this day */}
                  {day.deadlineCount > 0 && (
                    <div
                      className="absolute -top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-obsidian-900 shadow-xs"
                      title={`${day.deadlineCount} deadline(s) due today!`}
                    />
                  )}
                </div>

                {/* Day Label */}
                <span
                  className={`text-[11px] font-semibold ${
                    idx === 0
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>Daily threshold: {Math.round(maxDayLimit / 60)}h max/day</span>
        <span className="text-slate-400 dark:text-slate-500 font-medium">Automatic backward pacing</span>
      </div>
    </div>
  );
};
