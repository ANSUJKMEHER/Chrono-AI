import React from 'react';
import { Clock, CheckCircle2, Circle, Calendar, Sparkles, Plus } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Today's Action Plan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalItemsToday === 0
              ? 'No scheduled sessions or deadlines today.'
              : `${completedTodaySessions}/${todaySessions.length} prep blocks completed today`}
          </p>
        </div>

        {totalItemsToday > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
            {totalItemsToday} event{totalItemsToday > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {totalItemsToday === 0 ? (
        <div className="p-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">
            Your schedule for today is completely clear!
          </p>
          <p className="text-[11px] text-slate-400">
            Paste an assignment announcement to automatically generate a preparation schedule.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Import a Deadline</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Due Today Warnings */}
          {dueTodayTasks.map(t => (
            <div
              key={t.id}
              onClick={() => onOpenTaskDetails(t)}
              className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 cursor-pointer hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    toggleTaskStatus(t.id);
                  }}
                  className="text-amber-500 hover:text-emerald-600"
                  title="Mark deadline completed"
                >
                  <Circle className="w-4 h-4 stroke-[2]" />
                </button>
                <div>
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <span>⚠️ DUE TODAY:</span>
                    <span>{t.title}</span>
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Deadline: {formatTime12h(t.deadlineTime || '23:59')}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
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
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSession(session.taskId, session.id)}
                    className="text-slate-400 hover:text-emerald-600 transition-colors"
                    title={session.completed ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {session.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>

                  <div>
                    <div
                      className={`font-semibold text-slate-800 ${
                        session.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {session.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {parentTask?.course && (
                        <span className="font-semibold text-slate-600">{parentTask.course}</span>
                      )}
                      <span>•</span>
                      <span>
                        {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {session.durationMinutes}m
                  </span>
                  {parentTask && (
                    <button
                      onClick={() => onOpenTaskDetails(parentTask)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-[11px] px-1"
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
  );
};
