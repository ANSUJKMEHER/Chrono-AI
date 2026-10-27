import React from 'react';
import { BarChart3, Clock, AlertCircle } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            7-Day Preparation Workload
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Distributed effort hours leading to upcoming deadlines
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
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
      <div className="grid grid-cols-7 gap-2 pt-4 items-end h-36 border-b border-slate-100 pb-2">
        {stats.workloadByDay.map((day, idx) => {
          const heightPercent = maxMinutesInWeek > 0
            ? Math.min(100, Math.round((day.prepMinutes / maxMinutesInWeek) * 100))
            : 0;

          const isOverLimit = day.prepMinutes > maxDayLimit;

          return (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
              {/* Tooltip / value */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
                {Math.round(day.prepMinutes / 60 * 10) / 10}h
              </div>

              {/* Bar */}
              <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg h-24 flex items-end justify-center p-0.5 relative">
                {day.prepMinutes > 0 && (
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isOverLimit ? 'bg-rose-500' : 'bg-indigo-500 group-hover:bg-indigo-600'
                    }`}
                    style={{ height: `${Math.max(12, heightPercent)}%` }}
                  />
                )}

                {/* Deadline marker dot if a deadline falls on this day */}
                {day.deadlineCount > 0 && (
                  <div
                    className="absolute -top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-xs"
                    title={`${day.deadlineCount} deadline(s) due today!`}
                  />
                )}
              </div>

              {/* Day Label */}
              <span
                className={`text-[11px] font-semibold ${
                  idx === 0 ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Daily threshold: {Math.round(maxDayLimit / 60)}h max/day</span>
        <span className="text-slate-400">Values calculated from active schedules</span>
      </div>
    </div>
  );
};
