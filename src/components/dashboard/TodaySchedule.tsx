import React from 'react';
import { Clock, CheckCircle2, Circle, Plus, Flame } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { formatTime12h, getTodayString } from '../../utils/dateUtils';
import { Task } from '../../types/task';

interface TodayScheduleProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
}) => {
  const { stats, tasks, toggleSession, toggleTaskStatus } = useTasks();
  const todayStr = getTodayString();

  // Tasks due today
  const dueTodayTasks = tasks.filter(t => t.deadlineDate === todayStr && t.status !== 'completed');
  const todaySessions = stats.todaySessions;

  const totalItemsToday = dueTodayTasks.length + todaySessions.length;
  const completedTodaySessions = todaySessions.filter(s => s.completed).length;

  return (
    <div className="bg-white dark:bg-obsidian-900 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs p-5 space-y-4 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Today's Action Plan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {totalItemsToday === 0
                ? 'No scheduled sessions or deadlines today.'
                : `${completedTodaySessions}/${todaySessions.length} prep blocks completed today`}
            </p>
          </div>

          {totalItemsToday > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40">
              {totalItemsToday} event{totalItemsToday > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {totalItemsToday === 0 ? (
          <div className="p-8 bg-slate-50/70 dark:bg-obsidian-850 rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] text-center space-y-2.5 my-2">
            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Your schedule for today is clear!
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Paste an assignment description to automatically generate scheduled preparation blocks.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import a Deadline</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Due Today Warnings */}
            {dueTodayTasks.map(t => (
              <div
                key={t.id}
                onClick={() => onOpenTaskDetails(t)}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/50 cursor-pointer hover:bg-amber-100/70 dark:hover:bg-amber-950/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      toggleTaskStatus(t.id);
                    }}
                    className="text-amber-500 hover:text-emerald-600 shrink-0"
                    title="Mark deadline completed"
                  >
                    <Circle className="w-4 h-4 stroke-[2]" />
                  </button>
                  <div>
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase bg-amber-200/80 dark:bg-amber-900/60 px-1 rounded">DUE TODAY</span>
                      <span className="truncate">{t.title}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 font-medium">
                      Deadline: {formatTime12h(t.deadlineTime || '23:59')}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/70 px-2 py-0.5 rounded-lg whitespace-nowrap">
                  Submit Today
                </span>
              </div>
            ))}

            {/* Today's Preparation Sessions */}
            {todaySessions.map(session => {
              const parentTask = tasks.find(t => t.id === session.taskId);
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                    session.completed
                      ? 'bg-slate-50/60 dark:bg-obsidian-850/40 border-slate-200 dark:border-white/[0.04] opacity-50'
                      : 'bg-white dark:bg-obsidian-850 border-slate-200/90 dark:border-white/[0.06] shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleSession(session.taskId, session.id)}
                      className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                      title={session.completed ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {session.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 stroke-[2]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div
                        className={`font-semibold text-slate-800 dark:text-slate-200 truncate ${
                          session.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {session.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        {parentTask?.course && (
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{parentTask.course}</span>
                        )}
                        <span>•</span>
                        <span className="font-mono">
                          {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-100 dark:bg-obsidian-750 text-slate-600 dark:text-slate-300 rounded-md">
                      {session.durationMinutes}m
                    </span>
                    {parentTask && (
                      <button
                        onClick={() => onOpenTaskDetails(parentTask)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold text-[11px] px-1"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-2 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between">
        <span>Click checkbox to mark milestones completed</span>
        <span className="font-mono">{todayStr}</span>
      </div>
    </div>
  );
};
