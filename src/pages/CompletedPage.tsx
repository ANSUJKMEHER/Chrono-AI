import React from 'react';
import { CheckCircle2, RotateCcw, Award, Trash2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types/task';
import { formatFriendlyDate } from '../utils/dateUtils';
import { useToast } from '../components/common/Toast';

interface CompletedPageProps {
  onOpenTaskDetails: (task: Task) => void;
  searchQuery?: string;
}

export const CompletedPage: React.FC<CompletedPageProps> = ({
  onOpenTaskDetails,
  searchQuery = '',
}) => {
  const { tasks, toggleTaskStatus, deleteTask } = useTasks();
  const { info } = useToast();

  const completedTasks = tasks.filter((t: Task) => {
    if (t.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.course?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPrepMinutes = completedTasks.reduce((acc: number, t: Task) => acc + (t.estimatedMinutes || 0), 0);
  const totalSubtasksDone = completedTasks.reduce(
    (acc: number, t: Task) => acc + t.subtasks.filter(st => st.completed).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Achievement & Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Completed Assignments</h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 mt-1 max-w-lg leading-relaxed">
            Track your completed academic submissions, logged preparation hours, and milestones.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-emerald-950/70 p-4 rounded-2xl border border-emerald-800/60 text-center backdrop-blur-sm">
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">{completedTasks.length}</div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Tasks Done</div>
          </div>
          <div className="border-x border-emerald-800/60 px-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {Math.round(totalPrepMinutes / 60 * 10) / 10}h
            </div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Prep Logged</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">{totalSubtasksDone}</div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">Subtasks</div>
          </div>
        </div>
      </div>

      {/* Completed Tasks List */}
      {completedTasks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-obsidian-850 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No completed tasks yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When you complete an assignment or check off all its subtasks, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedTasks.map((task: Task) => (
            <div
              key={task.id}
              className="p-4 sm:p-5 bg-white dark:bg-obsidian-900 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-300 dark:hover:border-white/[0.15] transition-all"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    {task.course && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300">
                        {task.course}
                      </span>
                    )}
                    <h3
                      onClick={() => onOpenTaskDetails(task)}
                      className="text-sm font-bold text-slate-800 dark:text-slate-200 line-through group-hover:text-indigo-600 dark:group-hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                    <span>Deadline was: {formatFriendlyDate(task.deadlineDate, task.deadlineTime)}</span>
                    <span>•</span>
                    <span>{task.subtasks.length} subtasks completed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    toggleTaskStatus(task.id);
                    info(`Reopened "${task.title}"`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 rounded-xl transition-colors"
                  title="Move back to in-progress"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </button>

                <button
                  onClick={() => {
                    deleteTask(task.id);
                    info('Task removed permanently.');
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                  title="Delete from archive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
