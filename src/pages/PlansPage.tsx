import React, { useState } from 'react';
import {
  ListTodo,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronRight,
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-600" />
            Smart Preparation Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Backward-scheduled preparation workflows designed to eliminate deadline cramming
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Plan</span>
        </button>
      </div>

      {plannedTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No active preparation plans</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-5"
              >
                {/* Task Title & Rationale Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {task.course && (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.course}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Target Deadline: {formatFriendlyDate(task.deadlineDate, task.deadlineTime)}
                      </span>
                    </div>
                    <h2
                      onClick={() => onOpenTaskDetails(task)}
                      className="text-base sm:text-lg font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </h2>
                  </div>

                  {/* Strategy Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => handleStrategyChange(task.id, 'standard')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
                      title="Evenly spread across remaining days"
                    >
                      Spaced
                    </button>
                    <button
                      onClick={() => handleStrategyChange(task.id, 'early_bird')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
                      title="Wrap up 1 day before deadline"
                    >
                      Early Bird
                    </button>
                    <button
                      onClick={() => handleStrategyChange(task.id, 'intensive')}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
                      title="Concentrate in final 48 hours"
                    >
                      Intensive
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      Preparation Progress ({completedCount}/{totalCount} sessions done)
                    </span>
                    <span className="font-bold text-indigo-600">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Chronological Sessions Timeline */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Preparation Milestones
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {task.preparationSessions.map((session: PreparationSession) => (
                      <div
                        key={session.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          session.completed
                            ? 'bg-slate-50/60 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {formatFriendlyDate(session.date)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {session.durationMinutes}m
                            </span>
                          </div>
                          <h4
                            className={`text-xs font-bold leading-snug ${
                              session.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {session.title}
                          </h4>
                          {session.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                          </span>

                          <button
                            onClick={() => toggleSession(task.id, session.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              session.completed
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'
                            }`}
                          >
                            {session.completed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
                              </>
                            ) : (
                              <>
                                <Circle className="w-3 h-3" /> Mark Done
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
