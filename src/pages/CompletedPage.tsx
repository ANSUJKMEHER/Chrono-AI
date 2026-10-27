import React from 'react';
import { CheckCircle2, RotateCcw, Award, Clock, Calendar, Trash2 } from 'lucide-react';
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
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Achievement & Archive
            </span>
          </div>
          <h1 className="text-2xl font-extrabold">Completed Assignments</h1>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-lg">
            Track your completed academic submissions, logged preparation hours, and milestones.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/60 text-center">
          <div>
            <div className="text-2xl font-extrabold text-white">{completedTasks.length}</div>
            <div className="text-[10px] text-emerald-300 font-medium uppercase mt-0.5">Tasks Done</div>
          </div>
          <div className="border-x border-emerald-800/60 px-3">
            <div className="text-2xl font-extrabold text-white">
              {Math.round(totalPrepMinutes / 60 * 10) / 10}h
            </div>
            <div className="text-[10px] text-emerald-300 font-medium uppercase mt-0.5">Prep Logged</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{totalSubtasksDone}</div>
            <div className="text-[10px] text-emerald-300 font-medium uppercase mt-0.5">Subtasks</div>
          </div>
        </div>
      </div>

      {/* Completed Tasks List */}
      {completedTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No completed tasks yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you complete an assignment or check off all its subtasks, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedTasks.map((task: Task) => (
            <div
              key={task.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    {task.course && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.course}
                      </span>
                    )}
                    <h3
                      onClick={() => onOpenTaskDetails(task)}
                      className="text-sm font-bold text-slate-800 line-through group-hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
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
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
