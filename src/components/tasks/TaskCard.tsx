import React from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  ListTodo,
  Flame,
} from 'lucide-react';
import { Task } from '../../types/task';
import { formatFriendlyDate, getRelativeTimeString, parseDateTime } from '../../utils/dateUtils';
import { useTasks } from '../../context/TaskContext';

interface TaskCardProps {
  task: Task;
  onOpenDetails: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpenDetails }) => {
  const { toggleTaskStatus } = useTasks();
  const relative = getRelativeTimeString(task.deadlineDate, task.deadlineTime);
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const isCompleted = task.status === 'completed';

  // Danger Score Calculation: (remaining effort) / (hours remaining)
  const now = new Date();
  const targetDt = parseDateTime(task.deadlineDate, task.deadlineTime);
  const hoursUntil = targetDt ? (targetDt.getTime() - now.getTime()) / (1000 * 60 * 60) : 999;
  const uncompletedSubtasks = task.subtasks.filter(st => !st.completed);
  const remainingMinutes = uncompletedSubtasks.reduce((acc, st) => acc + (st.estimatedMinutes || 45), 0);
  const remainingEffortHours = remainingMinutes > 0 ? remainingMinutes / 60 : (task.estimatedMinutes || 60) / 60;
  const dangerRatio = hoursUntil > 0 ? remainingEffortHours / hoursUntil : 999;

  return (
    <div
      onClick={() => onOpenDetails(task)}
      className={`group relative p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
        isCompleted
          ? 'bg-slate-50/50 dark:bg-obsidian-900/50 border-slate-200/60 dark:border-white/[0.04] opacity-70'
          : relative.isOverdue
          ? 'bg-white/70 dark:bg-obsidian-850/60 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300 shadow-2xs hover:shadow-xs'
          : 'bg-white/70 dark:bg-obsidian-850/60 border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-white/90 dark:hover:bg-obsidian-800/80 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Quick complete toggle & Titles */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toggleTaskStatus(task.id);
            }}
            className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
            title={isCompleted ? 'Mark as in-progress' : 'Mark completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {task.course && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-750 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                  {task.course}
                </span>
              )}
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full border ${
                  task.priority === 'urgent'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                    : task.priority === 'high'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                    : task.priority === 'low'
                    ? 'bg-slate-100 dark:bg-obsidian-750 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06]'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                }`}
              >
                {task.priority}
              </span>

              {!isCompleted && !relative.isOverdue && dangerRatio > 0.6 && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                  title="Danger Score: high effort remaining relative to deadline window"
                >
                  <Flame className="w-3 h-3 text-rose-500" />
                  Danger: {Math.round(dangerRatio * 100)}% Load
                </span>
              )}
            </div>

            <h4
              className={`text-sm font-bold truncate leading-snug ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              } transition-colors`}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Countdown Pill */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : relative.isOverdue
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 font-bold'
                : relative.isUrgent
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                : 'bg-slate-100 dark:bg-obsidian-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06]'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isCompleted ? 'Done' : relative.text}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            {formatFriendlyDate(task.deadlineDate, task.deadlineTime)}
          </span>
        </div>
      </div>

      {/* Bottom Subtask / Prep info */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            {completedSubtasks}/{task.subtasks.length} subtasks
          </span>
          {task.preparationSessions && task.preparationSessions.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/40">
              <ListTodo className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              {task.preparationSessions.length} prep blocks
            </span>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
