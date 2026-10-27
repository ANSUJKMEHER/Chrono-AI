import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Flag,
  ListTodo,
  Download,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { exportTasksToICS } from '../../utils/icsExport';
import { Task, CalendarEventItem } from '../../types/task';
import {
  parseDateSafe,
  getTodayString,
  addDays,
  formatFriendlyDate,
  formatTime12h,
} from '../../utils/dateUtils';

interface CalendarViewProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
}) => {
  const { calendarEvents, tasks } = useTasks();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const todayStr = getTodayString();

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Build calendar matrix
  const daysMatrix: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysMatrix.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysMatrix.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding to fill complete grid of 35 or 42
  const totalCells = daysMatrix.length > 35 ? 42 : 35;
  const remaining = totalCells - daysMatrix.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysMatrix.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Week view dates (current week surrounding currentDate)
  const currentWeekDays: Array<{ dateStr: string; dayName: string; dayNum: number; isToday: boolean }> = [];
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    currentWeekDays.push({
      dateStr,
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  // Map events to dateStr
  const eventsByDate = calendarEvents.reduce<Record<string, CalendarEventItem[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const monthTitle = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Calendar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{monthTitle}</h2>
            <p className="text-xs text-slate-500">
              Interactive timeline • Deadlines & AI preparation blocks
            </p>
          </div>
        </div>

        {/* View Toggle & Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Export to Google Calendar / .ICS */}
          <button
            onClick={() => {
              if (tasks.length === 0) {
                toast('No tasks to export yet.', 'warning');
                return;
              }
              exportTasksToICS(tasks, 'chronoai-full-calendar.ics');
              toast('Full calendar exported as .ics file. Ready to import into Google Calendar!', 'success');
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-all"
            title="Export all deadlines & preparation blocks to .ics file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export .ICS</span>
          </button>

          {/* Month / Week switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-all"
            >
              Today
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend & Sync Notice */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span>Submission Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
            <span>Preparation Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span>Completed</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Internal ChronoAI Engine • Click any event to inspect or edit
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' ? (
        <div className="flex-1 flex flex-col">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 text-center bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider py-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 grid-rows-5 sm:grid-rows-5 auto-rows-fr divide-x divide-y divide-slate-100 flex-1 min-h-[540px]">
            {daysMatrix.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateStr] || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] sm:min-h-[115px] p-1.5 sm:p-2 flex flex-col transition-colors group relative ${
                    cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-300'
                  } ${cell.isToday ? 'bg-indigo-50/20' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add icon on hover */}
                    <button
                      onClick={onOpenAddModal}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                      title={`Add deadline for ${cell.dateStr}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Day Events Stack */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map(ev => {
                      const isDeadline = ev.type === 'deadline';
                      const isComplete = ev.completed;

                      return (
                        <div
                          key={ev.id}
                          onClick={() => onOpenTaskDetails(ev.rawTask)}
                          className={`px-1.5 py-1 rounded-md text-[11px] font-medium leading-tight truncate cursor-pointer transition-all border ${
                            isComplete
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 line-through opacity-70'
                              : isDeadline
                              ? ev.isOverdue
                                ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                                : 'bg-amber-50 text-amber-900 border-amber-200 font-semibold'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200/70 hover:bg-indigo-100'
                          }`}
                          title={`${ev.title} (${ev.time ? formatTime12h(ev.time) : ''})`}
                        >
                          <div className="flex items-center gap-1">
                            {isComplete ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            ) : isDeadline ? (
                              <Flag className="w-3 h-3 text-amber-600 shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            )}
                            <span className="truncate">{ev.title}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View Grid */
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {currentWeekDays.map((day, idx) => {
              const dayEvents = eventsByDate[day.dateStr] || [];

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col min-h-[300px] ${
                    day.isToday
                      ? 'bg-indigo-50/40 border-indigo-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div>
                      <div className="text-[11px] uppercase font-bold text-slate-400">
                        {day.dayName}
                      </div>
                      <div
                        className={`text-base font-extrabold ${
                          day.isToday ? 'text-indigo-600' : 'text-slate-800'
                        }`}
                      >
                        {day.dayNum}
                      </div>
                    </div>

                    <button
                      onClick={onOpenAddModal}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-400 italic">
                        No events
                      </div>
                    ) : (
                      dayEvents.map(ev => {
                        const isDeadline = ev.type === 'deadline';
                        return (
                          <div
                            key={ev.id}
                            onClick={() => onOpenTaskDetails(ev.rawTask)}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              ev.completed
                                ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                                : isDeadline
                                ? 'bg-amber-50 border-amber-200 text-amber-950 font-semibold'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {isDeadline ? (
                                <Flag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              )}
                              <span className="font-bold truncate text-[11px]">
                                {isDeadline ? 'DEADLINE' : 'PREPARATION'}
                              </span>
                            </div>
                            <div className="font-semibold text-xs leading-tight truncate">
                              {ev.title}
                            </div>
                            {ev.time && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                {formatTime12h(ev.time)}
                                {ev.durationMinutes ? ` (${ev.durationMinutes}m)` : ''}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
