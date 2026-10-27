import React from 'react';
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { formatFriendlyDate, formatTime12h } from '../utils/dateUtils';
import { Task, PlanningStrategy, PreparationSession } from '../types/task';
import { useToast } from '../components/common/Toast';

interface PlansPageProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
}

export const PlansPage: React.FC<PlansPageProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
}) => {
  const { tasks, toggleSession, regenerateTaskPlan } = useTasks();
  const { success } = useToast();

  // Active tasks with preparation sessions
  const plannedTasks = tasks.filter(
    (t: Task) => t.status !== 'completed' && t.preparationSessions && t.preparationSessions.length > 0
  );

  const handleStrategyChange = (taskId: string, strategy: PlanningStrategy) => {
    regenerateTaskPlan(taskId, strategy);
    success(`Schedule regenerated using ${strategy.replace('_', ' ')} strategy.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Smart Preparation Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Backward-scheduled preparation workflows designed to eliminate deadline cramming
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {plannedTasks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No active preparation plans</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            When you extract deadlines, ChronoAI automatically calculates spaced preparation blocks leading up to submission.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate First Plan</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {plannedTasks.map((task: Task) => {
            const completedCount = task.preparationSessions.filter((s: PreparationSession) => s.completed).length;
            const totalCount = task.preparationSessions.length;
            const progress = Math.round((completedCount / totalCount) * 100);

            return (
              <div
                key={task.id}
                className="p-5 sm:p-6 glass-card rounded-3xl space-y-5 transition-colors"
              >
                {/* Task Title & Rationale Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {task.course && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300">
                          {task.course}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60 font-mono">
                        Target Deadline: {formatFriendlyDate(task.deadlineDate, task.deadlineTime)}
                      </span>
                    </div>
                    <h2
                      onClick={() => onOpenTaskDetails(task)}
                      className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </h2>
                  </div>

                  {/* Strategy Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-obsidian-800 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
                    <button
                      onClick={() => handleStrategyChange(task.id, 'standard')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-obsidian-700 rounded-lg transition-colors"
                      title="Evenly spread across remaining days"
                    >
                      Spaced
                    </button>
                    <button
                      onClick={() => handleStrategyChange(task.id, 'early_bird')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-obsidian-700 rounded-lg transition-colors"
                      title="Wrap up 1 day before deadline"
                    >
                      Early Bird
                    </button>
                    <button
                      onClick={() => handleStrategyChange(task.id, 'intensive')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-obsidian-700 rounded-lg transition-colors"
                      title="Concentrate in final 48 hours"
                    >
                      Intensive
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Preparation Progress ({completedCount}/{totalCount} sessions done)
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-obsidian-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Chronological Sessions Timeline */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Preparation Milestones
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {task.preparationSessions.map((session: PreparationSession) => (
                      <div
                        key={session.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          session.completed
                            ? 'bg-slate-50/60 dark:bg-obsidian-850/40 border-slate-200 dark:border-white/[0.04] opacity-60'
                            : 'bg-white dark:bg-obsidian-850 border-slate-200/90 dark:border-white/[0.08] shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                              {formatFriendlyDate(session.date)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {session.durationMinutes}m
                            </span>
                          </div>
                          <h4
                            className={`text-xs font-bold leading-snug ${
                              session.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {session.title}
                          </h4>
                          {session.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {session.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                          </span>

                          <button
                            onClick={() => toggleSession(task.id, session.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                              session.completed
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-obsidian-750 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {session.completed ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Done
                              </>
                            ) : (
                              <>
                                <Circle className="w-3.5 h-3.5" /> Mark Done
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
