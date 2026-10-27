import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { Task } from '../../types/task';
import { formatFriendlyDate, getRelativeTimeString } from '../../utils/dateUtils';
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

  return (
    <div
      onClick={() => onOpenDetails(task)}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isCompleted
          ? 'bg-slate-50/60 border-slate-200/80 opacity-70'
          : relative.isOverdue
          ? 'bg-white border-rose-200/80 hover:border-rose-300 shadow-2xs hover:shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
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
            className="mt-0.5 text-slate-300 hover:text-emerald-600 transition-colors shrink-0"
            title={isCompleted ? 'Mark as in-progress' : 'Mark completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {task.course && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {task.course}
                </span>
              )}
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full border ${
                  task.priority === 'urgent'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : task.priority === 'high'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : task.priority === 'low'
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {task.priority}
              </span>
            </div>

            <h4
              className={`text-sm font-bold truncate leading-snug ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-indigo-600'
              } transition-colors`}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
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
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : relative.isOverdue
                ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                : relative.isUrgent
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            {isCompleted ? 'Done' : relative.text}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatFriendlyDate(task.deadlineDate, task.deadlineTime)}
          </span>
        </div>
      </div>

      {/* Bottom Subtask / Prep info */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            {completedSubtasks}/{task.subtasks.length} subtasks
          </span>
          {task.preparationSessions && task.preparationSessions.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md">
              <ListTodo className="w-3 h-3 text-indigo-500" />
              {task.preparationSessions.length} prep blocks
            </span>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
