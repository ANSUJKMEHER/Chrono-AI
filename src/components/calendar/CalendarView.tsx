import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Flag,
  ListTodo,
  Download,
  Filter,
  X,
  ExternalLink,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { exportTasksToICS } from '../../utils/icsExport';
import { Task, CalendarEventItem } from '../../types/task';
import {
  getTodayString,
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
  const { calendarEvents, tasks, toggleSession, toggleTaskStatus } = useTasks();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filterType, setFilterType] = useState<'all' | 'deadline' | 'preparation'>('all');
  const [selectedPreviewEvent, setSelectedPreviewEvent] = useState<CalendarEventItem | null>(null);

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

  // Filter events
  const filteredEvents = calendarEvents.filter(ev => {
    if (filterType === 'all') return true;
    return ev.type === filterType;
  });

  // Map events to dateStr
  const eventsByDate = filteredEvents.reduce<Record<string, CalendarEventItem[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const monthTitle = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const deadlineCount = calendarEvents.filter(e => e.type === 'deadline').length;
  const prepCount = calendarEvents.filter(e => e.type === 'preparation').length;

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col transition-colors">
      {/* Calendar Top Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/60 dark:bg-obsidian-850/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{monthTitle}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                Google Calendar Upgrade
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive timeline with automatic backward-scheduled preparation blocks
            </p>
          </div>
        </div>

        {/* View Toggle, Filter & Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-obsidian-800 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({calendarEvents.length})
            </button>
            <button
              onClick={() => setFilterType('deadline')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'deadline'
                  ? 'bg-white dark:bg-obsidian-700 text-rose-700 dark:text-rose-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Deadlines</span>
              <span className="text-[10px] font-mono">({deadlineCount})</span>
            </button>
            <button
              onClick={() => setFilterType('preparation')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                filterType === 'preparation'
                  ? 'bg-white dark:bg-obsidian-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Prep Blocks</span>
              <span className="text-[10px] font-mono">({prepCount})</span>
            </button>
          </div>

          {/* Month / Week switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-obsidian-800 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation Arrows & Today */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-obsidian-800 border border-slate-200/80 dark:border-white/[0.08] rounded-xl hover:bg-slate-50 dark:hover:bg-obsidian-750 shadow-2xs transition-all"
            >
              Today
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-obsidian-800 border border-slate-200/80 dark:border-white/[0.08] rounded-xl hover:bg-slate-50 dark:hover:bg-obsidian-750 shadow-2xs transition-all"
            title="Export all deadlines & preparation blocks to .ics file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Export .ICS</span>
          </button>
        </div>
      </div>

      {/* Legend & Sync Notice */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-obsidian-950 border-b border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Submission Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Preparation Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Completed Session</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Click any card to inspect details or mark milestones
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' ? (
        <div className="flex-1 flex flex-col">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.06] text-center bg-slate-50/70 dark:bg-obsidian-850/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2.5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Cells Grid */}
          <div className="grid grid-cols-7 grid-rows-5 sm:grid-rows-5 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-white/[0.06] flex-1 min-h-[580px]">
            {daysMatrix.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateStr] || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col transition-colors group relative ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-obsidian-900'
                      : 'bg-slate-50/40 dark:bg-obsidian-950/40 text-slate-300 dark:text-slate-700'
                  } ${cell.isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white font-bold shadow-glow-indigo'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Quick Add icon on hover */}
                    <button
                      onClick={onOpenAddModal}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all"
                      title={`Add deadline for ${cell.dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events Stack */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[92px]">
                    {dayEvents.map(ev => {
                      const isDeadline = ev.type === 'deadline';
                      const isComplete = ev.completed;

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedPreviewEvent(ev)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-medium leading-tight truncate cursor-pointer transition-all border-l-4 shadow-2xs hover:scale-[1.01] ${
                            isComplete
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-l-emerald-500 border-y border-r border-emerald-200/60 dark:border-emerald-900/40 line-through opacity-70'
                              : isDeadline
                              ? ev.isOverdue
                                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-l-rose-600 border-y border-r border-rose-200/80 dark:border-rose-900/60 font-bold'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-rose-500 border-y border-r border-rose-200/80 dark:border-rose-900/50 font-semibold'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border-l-indigo-600 border-y border-r border-indigo-200/80 dark:border-indigo-900/50 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/70'
                          }`}
                          title={`${ev.title} (${ev.time ? formatTime12h(ev.time) : ''})`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isComplete ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : isDeadline ? (
                              <Flag className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
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
                  className={`p-3 rounded-2xl border flex flex-col min-h-[340px] transition-colors ${
                    day.isToday
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                      : 'bg-white dark:bg-obsidian-850 border-slate-200/80 dark:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-2.5">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        {day.dayName}
                      </div>
                      <div
                        className={`text-lg font-extrabold ${
                          day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {day.dayNum}
                      </div>
                    </div>

                    <button
                      onClick={onOpenAddModal}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      title="Add task for this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-12 text-[11px] text-slate-400 dark:text-slate-600 italic">
                        No events
                      </div>
                    ) : (
                      dayEvents.map(ev => {
                        const isDeadline = ev.type === 'deadline';
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedPreviewEvent(ev)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all border-l-4 shadow-2xs hover:scale-[1.01] ${
                              ev.completed
                                ? 'bg-slate-50 dark:bg-obsidian-800/40 border-slate-200 dark:border-white/[0.04] text-slate-400 dark:text-slate-500 line-through border-l-emerald-500'
                                : isDeadline
                                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200 border-l-rose-500 font-semibold'
                                : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50 text-indigo-950 dark:text-indigo-200 border-l-indigo-600'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              {isDeadline ? (
                                <Flag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              )}
                              <span className="font-bold tracking-wider text-[10px] uppercase">
                                {isDeadline ? 'DEADLINE' : 'PREPARATION'}
                              </span>
                            </div>
                            <div className="font-semibold text-xs leading-snug line-clamp-2">
                              {ev.title}
                            </div>
                            {ev.time && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
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

      {/* Event Quick Preview Drawer / Popover Modal */}
      {selectedPreviewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-modal rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    selectedPreviewEvent.type === 'deadline'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
                  }`}
                >
                  {selectedPreviewEvent.type === 'deadline' ? 'Submission Deadline' : 'Preparation Block'}
                </span>
                {selectedPreviewEvent.rawTask.course && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-750 text-slate-700 dark:text-slate-300">
                    {selectedPreviewEvent.rawTask.course}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedPreviewEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                {selectedPreviewEvent.title}
              </h3>
              {selectedPreviewEvent.type === 'preparation' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  For assignment: <strong className="text-slate-700 dark:text-slate-300">{selectedPreviewEvent.rawTask.title}</strong>
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Scheduled Date:</span>
                <span className="font-bold">{formatFriendlyDate(selectedPreviewEvent.date)}</span>
              </div>
              {selectedPreviewEvent.time && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Window:</span>
                  <span className="font-mono font-bold">
                    {formatTime12h(selectedPreviewEvent.time)}
                    {selectedPreviewEvent.durationMinutes ? ` (${selectedPreviewEvent.durationMinutes}m)` : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                <span
                  className={`font-bold ${
                    selectedPreviewEvent.completed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {selectedPreviewEvent.completed ? 'Completed' : 'Scheduled / In-Progress'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  if (selectedPreviewEvent.type === 'preparation' && selectedPreviewEvent.rawSession) {
                    toggleSession(selectedPreviewEvent.taskId, selectedPreviewEvent.rawSession.id);
                  } else {
                    toggleTaskStatus(selectedPreviewEvent.taskId);
                  }
                  setSelectedPreviewEvent(null);
                  toast('Status updated successfully.', 'success');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                {selectedPreviewEvent.completed ? (
                  <>
                    <Circle className="w-3.5 h-3.5" />
                    <span>Mark Incomplete</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Mark Done</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const t = selectedPreviewEvent.rawTask;
                  setSelectedPreviewEvent(null);
                  onOpenTaskDetails(t);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <span>View Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
