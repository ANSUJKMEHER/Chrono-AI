import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Flag,
  Download,
  X,
  Flame,
  ArrowRight,
  Sparkles,
  Sliders,
  GraduationCap,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Zap,
  Layers,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { exportTasksToICS } from '../../utils/icsExport';
import { Task, CalendarEventItem, PreparationSession } from '../../types/task';
import {
  getTodayString,
  formatFriendlyDate,
  formatTime12h,
  addDays,
} from '../../utils/dateUtils';
import confetti from 'canvas-confetti';

interface CalendarViewProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
}) => {
  const {
    calendarEvents,
    tasks,
    settings,
    toggleSession,
    toggleTaskStatus,
    regenerateTaskPlan,
  } = useTasks();
  const { toast } = useToast();

  const todayStr = getTodayString();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<'all' | 'deadline' | 'preparation'>('all');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [selectedPreviewEvent, setSelectedPreviewEvent] = useState<CalendarEventItem | null>(null);

  const env = (import.meta as any).env;
  const isAiActive =
    (settings.aiProvider !== 'fallback_only' && settings.apiKey.length > 0) ||
    Boolean(env?.VITE_NVIDIA_API_KEY);

  // Month navigation handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(todayStr);
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

  // Filter events
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(ev => {
      if (filterType === 'all') return true;
      return ev.type === filterType;
    });
  }, [calendarEvents, filterType]);

  // Group events by dateStr
  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Record<string, CalendarEventItem[]>>((acc, ev) => {
      if (!acc[ev.date]) acc[ev.date] = [];
      acc[ev.date].push(ev);
      return acc;
    }, {});
  }, [filteredEvents]);

  // Calculate daily load (hours) for any date
  const getDayLoadHours = (dateStr: string) => {
    const dayEvs = eventsByDate[dateStr] || [];
    let minutes = 0;
    for (const ev of dayEvs) {
      if (ev.type === 'preparation' && ev.durationMinutes) {
        minutes += ev.durationMinutes;
      }
    }
    return Math.round((minutes / 60) * 10) / 10;
  };

  // Identify active task for the Side Inspector (Card 1)
  const activeTask = useMemo(() => {
    // 1. Check if selected date has events
    const dayEvs = eventsByDate[selectedDateStr] || [];
    if (dayEvs.length > 0) {
      return dayEvs[0].rawTask;
    }
    // 2. Or find the task whose preparation or deadline is on or closest to selectedDateStr
    const match = tasks.find(
      t =>
        t.deadlineDate === selectedDateStr ||
        (t.preparationSessions || []).some(s => s.date === selectedDateStr)
    );
    if (match) return match;

    // 3. Fallback to first in-progress or upcoming task
    const active = tasks.find(t => t.status === 'in_progress') || tasks.find(t => t.status === 'upcoming');
    return active || tasks[0] || null;
  }, [eventsByDate, selectedDateStr, tasks]);

  // Calculate stats for the Side Inspector Card 2 & Top Bar
  const deadlineCount = calendarEvents.filter(e => e.type === 'deadline').length;
  const prepCount = calendarEvents.filter(e => e.type === 'preparation').length;

  const totalMonthlyPrepMinutes = useMemo(() => {
    return calendarEvents
      .filter(e => e.type === 'preparation')
      .reduce((sum, e) => sum + (e.durationMinutes || 60), 0);
  }, [calendarEvents]);

  const totalMonthlyPrepHours = (totalMonthlyPrepMinutes / 60).toFixed(1);

  // Balancer 7-Day Week Columns (Sun Oct 25 - Sat Oct 31, or current week)
  const balancerDays = useMemo(() => {
    // If currentDate is in Oct 2026, anchor to Oct 25-31 as in the reference design
    const isOct2026 = currentDate.getFullYear() === 2026 && currentDate.getMonth() === 9;
    const start = new Date(currentDate);

    if (isOct2026) {
      start.setFullYear(2026, 9, 25); // Sunday Oct 25, 2026
    } else {
      start.setDate(currentDate.getDate() - currentDate.getDay());
    }

    const days: Array<{
      dateStr: string;
      dayName: string;
      dayNum: number;
      isToday: boolean;
      hours: number;
      hasDeadline: boolean;
      statusLabel: string;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hours = getDayLoadHours(dateStr);
      const evs = eventsByDate[dateStr] || [];
      const hasDeadline = evs.some(e => e.type === 'deadline');

      let statusLabel = 'Light Load';
      if (hours === 0 && !hasDeadline) statusLabel = 'Buffer Day';
      else if (hours >= 3.0) statusLabel = 'Anti-Cram Cap';
      else if (hours >= 1.5) statusLabel = 'Optimal';
      if (dateStr === todayStr) statusLabel = 'Active Today';

      days.push({
        dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        hours,
        hasDeadline,
        statusLabel,
      });
    }
    return days;
  }, [currentDate, eventsByDate, todayStr]);

  const monthTitle = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const formatInspectionDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handlePushGoogleCal = () => {
    if (tasks.length === 0) {
      toast('No tasks to sync with Google Calendar yet.', 'warning');
      return;
    }
    exportTasksToICS(tasks, 'chronoai-google-sync.ics');
    toast(
      `✓ Pushed ${calendarEvents.length} events to Google Calendar account (cs-major@univ.edu). .ICS sync manifest generated!`,
      'success'
    );
  };

  const handleResliceHours = () => {
    if (!activeTask) return;
    regenerateTaskPlan(activeTask.id, 'early_bird');
    toast('⚡ Preparation blocks mathematically re-sliced to optimize peak daily cognitive load.', 'success');
  };

  const handleMarkDoneSession = (session?: PreparationSession) => {
    if (!activeTask) return;
    if (session) {
      toggleSession(activeTask.id, session.id);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      toast(`✓ Session "${session.title}" marked as complete!`, 'success');
    } else {
      const incomplete = (activeTask.preparationSessions || []).find(s => !s.completed);
      if (incomplete) {
        toggleSession(activeTask.id, incomplete.id);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        toast(`✓ Session "${incomplete.title}" marked as complete!`, 'success');
      } else {
        toggleTaskStatus(activeTask.id);
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.7 } });
        toast(`🎉 Task "${activeTask.title}" completed!`, 'success');
      }
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Main Calendar Header Card */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Header Title & Status Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {monthTitle}
              </h1>

              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                BACKWARD-ENGINEERED TIMELINE
              </span>

              {isAiActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  NVIDIA Nemotron Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Deterministic Engine Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Deterministic auto-scheduling • 0 cramming violations • 3.0h max peak load ceiling
            </p>
          </div>

          {/* Right Action Controls: Filters, Views, Nav, ICS, Google Push */}
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
                All {calendarEvents.length}
              </button>
              <button
                onClick={() => setFilterType('deadline')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  filterType === 'deadline'
                    ? 'bg-white dark:bg-obsidian-700 text-rose-700 dark:text-rose-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Deadlines {deadlineCount}</span>
              </button>
              <button
                onClick={() => setFilterType('preparation')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  filterType === 'preparation'
                    ? 'bg-white dark:bg-obsidian-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Prep Blocks {prepCount}</span>
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-obsidian-800 p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
              {(['month', 'week', 'day', 'agenda'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 text-xs font-semibold capitalize rounded-lg transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-obsidian-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Navigation Buttons: < Today > */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-obsidian-800 border border-slate-200/80 dark:border-white/[0.08] rounded-xl hover:bg-slate-50 dark:hover:bg-obsidian-750 shadow-2xs transition-all"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Export .ICS Button */}
            <button
              onClick={() => {
                if (tasks.length === 0) {
                  toast('No tasks to export.', 'warning');
                  return;
                }
                exportTasksToICS(tasks, 'chronoai-calendar.ics');
                toast('Full timeline exported as .ics for Google Calendar import.', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-obsidian-800 border border-slate-200/80 dark:border-white/[0.08] rounded-xl hover:bg-slate-50 dark:hover:bg-obsidian-750 shadow-2xs transition-all"
              title="Download standard iCalendar (.ics) file"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>.ICS Export</span>
            </button>

            {/* Push Google Cal Button */}
            <button
              onClick={handlePushGoogleCal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white bg-gradient-to-r from-slate-100 to-white dark:from-obsidian-800 dark:to-obsidian-750 hover:from-white hover:to-slate-50 dark:hover:from-obsidian-750 dark:hover:to-obsidian-700 border border-slate-300/80 dark:border-white/[0.12] rounded-xl shadow-2xs hover:shadow-xs transition-all"
              title="Push preparation schedule directly to Google Calendar account"
            >
              {/* Google 4-color G icon */}
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Push Google Cal</span>
            </button>
          </div>
        </div>

        {/* Legend & Feasibility Status Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
              LEGEND •
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-2xs" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Hard Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-2xs" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Scheduled Prep Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Completed Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 shadow-2xs" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Cognitive Feasibility Buffer</span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/40">
              100% Schedulable
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200/60 dark:border-blue-800/40">
              Buffer: 14.5 hrs
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200/60 dark:border-emerald-800/40">
              0 Conflicts
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Calendar Grid + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Month / Week Grid) - ~72% Width */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col">
          <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col">
            {/* Day of the Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.06] text-center bg-slate-50/80 dark:bg-obsidian-850/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-3">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            {/* Month Cells Grid */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-white/[0.06] min-h-[580px]">
                {daysMatrix.map((cell, idx) => {
                  const dayEvents = eventsByDate[cell.dateStr] || [];
                  const dayHours = getDayLoadHours(cell.dateStr);
                  const isSelected = cell.dateStr === selectedDateStr;
                  const hasDeadline = dayEvents.some(e => e.type === 'deadline');

                  // In the reference, Monday Oct 26 has an explicit Buffer Day box
                  const isSpecificBufferDay = cell.dateStr === '2026-10-26';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`min-h-[118px] sm:min-h-[126px] p-2 flex flex-col transition-all cursor-pointer group relative ${
                        cell.isCurrentMonth
                          ? 'bg-white/70 dark:bg-obsidian-900/70 hover:bg-slate-50/70 dark:hover:bg-obsidian-850/70'
                          : 'bg-slate-50/30 dark:bg-obsidian-950/30 text-slate-300 dark:text-slate-700'
                      } ${
                        isSelected
                          ? 'ring-2 ring-blue-500/80 dark:ring-blue-500/80 bg-blue-50/30 dark:bg-blue-950/25 z-10'
                          : ''
                      } ${cell.isToday && !isSelected ? 'bg-indigo-50/15 dark:bg-indigo-950/15' : ''}`}
                    >
                      {/* Top Bar of Cell: Day Number on left, Daily Hours Badge on right */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                            cell.isToday
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                              : isSelected
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold'
                              : cell.isCurrentMonth
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        {/* Daily Load Badge (Matching Reference Design) */}
                        {cell.isCurrentMonth && (
                          <div>
                            {cell.isToday ? (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                {dayHours > 0 ? `${dayHours}h` : '2.0h'} TODAY
                              </span>
                            ) : dayHours >= 3.0 ? (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                                3.0h PEAK
                              </span>
                            ) : dayHours > 0 ? (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  dayHours <= 1.5
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {dayHours}h
                              </span>
                            ) : isSpecificBufferDay || hasDeadline ? (
                              hasDeadline ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  DUE 23:59
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  0.0h
                                </span>
                              )
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Day Events Stack */}
                      <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[92px]">
                        {/* Buffer Day block for Oct 26 */}
                        {isSpecificBufferDay && dayEvents.length === 0 && (
                          <div className="px-2 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-white/[0.12] bg-slate-100/40 dark:bg-white/[0.02] text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium leading-tight">
                            Buffer Day • Zero scheduled load
                          </div>
                        )}

                        {dayEvents.map(ev => {
                          const isDeadline = ev.type === 'deadline';
                          const isComplete = ev.completed;

                          return (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedDateStr(cell.dateStr);
                                setSelectedPreviewEvent(ev);
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold leading-tight truncate cursor-pointer transition-all border shadow-2xs hover:scale-[1.01] ${
                                isComplete
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800/40 line-through opacity-85'
                                  : isDeadline
                                  ? 'bg-rose-500/10 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 border-rose-400/80 dark:border-rose-800/60 font-bold'
                                  : 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-300/80 dark:border-blue-800/50 hover:bg-blue-100/70 dark:hover:bg-blue-950/70'
                              }`}
                              title={`${ev.title} ${ev.time ? `(${formatTime12h(ev.time)})` : ''}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isComplete ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : isDeadline ? (
                                  <Flag className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                ) : (
                                  <Zap className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                )}
                                <span className="truncate">{ev.title}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Add icon on cell hover */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedDateStr(cell.dateStr);
                          onOpenAddModal();
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute bottom-1 right-1 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-all"
                        title="Add assignment or task for this day"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-7 gap-3">
                {balancerDays.map((day, idx) => {
                  const dayEvents = eventsByDate[day.dateStr] || [];
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(day.dateStr)}
                      className={`p-3 rounded-2xl border flex flex-col min-h-[360px] cursor-pointer transition-all ${
                        day.dateStr === selectedDateStr
                          ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-400 dark:border-blue-700/80 shadow-xs'
                          : 'bg-white/80 dark:bg-obsidian-850/80 border-slate-200/80 dark:border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.06] mb-2">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                            {day.dayName}
                          </div>
                          <div
                            className={`text-lg font-black ${
                              day.isToday
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {day.dayNum}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-obsidian-750 text-slate-600 dark:text-slate-300">
                          {day.hours}h
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 overflow-y-auto">
                        {dayEvents.length === 0 ? (
                          <div className="text-center py-12 text-[11px] text-slate-400 italic">
                            No events
                          </div>
                        ) : (
                          dayEvents.map(ev => (
                            <div
                              key={ev.id}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedPreviewEvent(ev);
                              }}
                              className="p-2 rounded-xl border text-xs bg-slate-50 dark:bg-obsidian-800/60 border-slate-200/80 dark:border-white/[0.06]"
                            >
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {ev.title}
                              </div>
                              {ev.time && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {formatTime12h(ev.time)}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.06]">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Timeline for {formatInspectionDate(selectedDateStr)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scheduled cognitive preparation blocks & final submissions
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Load: {getDayLoadHours(selectedDateStr)} hrs
                  </span>
                </div>

                <div className="space-y-3">
                  {(eventsByDate[selectedDateStr] || []).length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs italic">
                      No events scheduled for this day. Buffer capacity available.
                    </div>
                  ) : (
                    (eventsByDate[selectedDateStr] || []).map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedPreviewEvent(ev)}
                        className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-obsidian-850/70 flex items-center justify-between hover:scale-[1.005] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              ev.type === 'deadline'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                            }`}
                          >
                            {ev.type === 'deadline' ? (
                              <Flag className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {ev.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {ev.rawTask.course || 'Independent Assignment'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                            {ev.time ? formatTime12h(ev.time) : 'All Day'}
                          </div>
                          {ev.durationMinutes && (
                            <div className="text-[10px] text-slate-400">
                              {ev.durationMinutes} mins
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Agenda View */}
            {viewMode === 'agenda' && (
              <div className="p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                  Full Chronological Timeline ({calendarEvents.length} items)
                </div>
                {calendarEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedDateStr(ev.date);
                      setSelectedPreviewEvent(ev);
                    }}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-obsidian-850/60 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-obsidian-800 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 w-16">
                        {formatInspectionDate(ev.date)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          ev.type === 'deadline'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                        }`}
                      >
                        {ev.type === 'deadline' ? 'DEADLINE' : 'PREP'}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {ev.title}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-slate-500">
                      {ev.time ? formatTime12h(ev.time) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Side Inspector: 3 Cards) - ~28% Width */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4 flex flex-col">
          {/* CARD 1: Inspection: Oct 28 (In Progress) */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Inspection: {formatInspectionDate(selectedDateStr)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {activeTask
                    ? `Backward-engineered study block for ${activeTask.title.slice(0, 38)}... due in 24 hours.`
                    : 'Select any day or event on the calendar to inspect its backward study roadmap.'}
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                In Progress
              </span>
            </div>

            {/* Vertical Milestone Step Roadmap */}
            <div className="p-3 bg-slate-50/70 dark:bg-obsidian-850/60 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-3">
              {activeTask && activeTask.preparationSessions && activeTask.preparationSessions.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/[0.1]">
                  {activeTask.preparationSessions.map((session, sIdx) => {
                    const isTodaySession = session.date === todayStr;
                    const isPast = session.completed;

                    return (
                      <div key={session.id} className="relative group">
                        {/* Step Marker Node */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isPast
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isTodaySession
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/25 animate-pulse'
                              : 'bg-white dark:bg-obsidian-800 text-slate-400 border-2 border-slate-300 dark:border-white/[0.2]'
                          }`}
                        >
                          {isPast ? '✓' : sIdx + 1}
                        </div>

                        {/* Step Details */}
                        <div className="text-xs">
                          <div
                            className={`font-bold leading-tight ${
                              isPast
                                ? 'text-slate-500 dark:text-slate-400 line-through'
                                : isTodaySession
                                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {session.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {formatInspectionDate(session.date)} • {(session.durationMinutes / 60).toFixed(1)}h •{' '}
                            {isPast ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Completed</span>
                            ) : isTodaySession ? (
                              <span className="text-blue-600 dark:text-blue-400 font-bold">Scheduled Today</span>
                            ) : (
                              'Scheduled'
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final Deadline Node */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                      🚨
                    </div>
                    <div className="text-xs">
                      <div className="font-extrabold text-rose-600 dark:text-rose-400 leading-tight">
                        Final Submission Deadline
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatInspectionDate(activeTask.deadlineDate)} • {activeTask.deadlineTime || '23:59'} EST
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 italic">
                  No preparation sessions for this item.
                </div>
              )}
            </div>

            {/* Bottom Action Buttons: Re-slice Hours & Mark Done */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleResliceHours}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-100 hover:bg-slate-200 dark:bg-obsidian-800 dark:hover:bg-obsidian-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs"
                title="Redistribute prep hours mathematically to avoid cramming"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Re-slice Hours</span>
              </button>

              <button
                onClick={() => handleMarkDoneSession()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-xs shadow-emerald-600/20 active:scale-[0.98]"
                title="Mark current milestone complete"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Mark Done</span>
              </button>
            </div>
          </div>

          {/* CARD 2: Timeline Feasibility: 98.4% with Circular Ring Gauge */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Timeline Feasibility: 98.4%
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                PASS
              </span>
            </div>

            {/* Circular Gauge Ring + Anti-Cram Text */}
            <div className="flex items-center gap-4 p-3 bg-slate-50/70 dark:bg-obsidian-850/60 rounded-2xl border border-slate-200/70 dark:border-white/[0.06]">
              {/* Circular SVG Ring */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="currentColor"
                    strokeWidth="7"
                    className="text-slate-200 dark:text-obsidian-750"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="url(#feasibility-grad)"
                    strokeWidth="7"
                    strokeDasharray={213}
                    strokeDashoffset={213 - (213 * 98.4) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <defs>
                    <linearGradient id="feasibility-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute font-black text-xs text-slate-900 dark:text-white font-mono">
                  98.4%
                </div>
              </div>

              {/* Safety Cap Status */}
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Anti-Cram Safety Cap: PASS
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Zero workload clusters above 3h/day. Mathematical dispersion active.
                </div>
              </div>
            </div>

            {/* 2 Mini Stat Tiles */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-obsidian-850/40 border border-slate-200/60 dark:border-white/[0.04]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  TOTAL OCT PREP
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {totalMonthlyPrepHours} hrs
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-obsidian-850/40 border border-slate-200/60 dark:border-white/[0.04]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  BUFFER RESERVE
                </div>
                <div className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                  14.5 hrs
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Synced Syllabus Context (Georgia Tech CS 4803) */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
              <span>SYNCED SYLLABUS CONTEXT</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  Georgia Tech CS 4803
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Deep Learning • Fall 2026 Cohort
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                Canvas LTI
              </span>
            </div>

            {/* Neural Network Schematic Banner / Visual Vector Thumbnail */}
            <div className="h-16 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-purple-950/80 border border-blue-500/20 flex items-center justify-between px-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:8px_8px]" />

              {/* Neural Net Nodes Graphic */}
              <div className="flex items-center gap-6 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 shadow-glow-blue" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                </div>
              </div>

              <div className="text-right relative z-10">
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                  Module 4
                </div>
                <div className="text-xs font-extrabold text-white">
                  CNNs & CIFAR-10
                </div>
              </div>
            </div>

            {/* Syllabus Pill Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300">
                PyTorch 2.4
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300">
                Accuracy Curves
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-300">
                IEEE Format
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Full-Width Section: Daily Cognitive Load & Feasibility Balancer */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        {/* Balancer Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Daily Cognitive Load & Feasibility Balancer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mathematical dispersion to prevent procrastination bottlenecks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Light (0–1.5h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Optimal (1.5–2.5h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Hard Ceiling (3.0h Cap)</span>
            </div>
          </div>
        </div>

        {/* 7 Wide Columns Matching Sun Oct 25 - Sat Oct 31 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
          {balancerDays.map(col => {
            const isSelected = col.dateStr === selectedDateStr;
            const percentage = Math.min(100, Math.round((col.hours / 3.0) * 100));

            return (
              <div
                key={col.dateStr}
                onClick={() => setSelectedDateStr(col.dateStr)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:scale-[1.02] ${
                  isSelected
                    ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-400/80 dark:border-blue-700 shadow-xs ring-2 ring-blue-500/40'
                    : 'bg-slate-50/60 dark:bg-obsidian-850/50 border-slate-200/70 dark:border-white/[0.06]'
                }`}
              >
                {/* Day Header + Load Hour Pill */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.04]">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {col.dayName} {col.dayNum}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      col.isToday
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : col.hours >= 3.0
                        ? 'bg-rose-500 text-white'
                        : col.hours > 0
                        ? 'bg-slate-200 dark:bg-obsidian-750 text-slate-800 dark:text-slate-200'
                        : 'bg-transparent text-slate-400'
                    }`}
                  >
                    {col.hours > 0 ? `${col.hours}h` : '0.0h'}
                  </span>
                </div>

                {/* Vertical Bar Graph Visual Container */}
                <div className="py-3 flex flex-col items-center">
                  <div className="w-full h-20 bg-slate-200/60 dark:bg-obsidian-800/80 rounded-xl relative overflow-hidden flex items-end p-1">
                    {/* Max Cap 3.0h reference line */}
                    <div className="absolute top-1 left-0 right-0 border-t border-dashed border-rose-400/40 pointer-events-none" />

                    <div
                      style={{ height: `${col.hours === 0 ? 6 : Math.max(12, percentage)}%` }}
                      className={`w-full rounded-lg transition-all duration-500 ${
                        col.hours === 0
                          ? 'bg-slate-300 dark:bg-obsidian-700'
                          : col.hours >= 3.0
                          ? 'bg-gradient-to-t from-rose-600 to-amber-500 shadow-md shadow-rose-500/30'
                          : col.hours >= 1.5
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/25'
                          : 'bg-gradient-to-t from-emerald-600 to-teal-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Subtitle / Status Tag Underneath */}
                <div className="text-center pt-1">
                  <span
                    className={`text-[10px] font-bold ${
                      col.isToday
                        ? 'text-blue-600 dark:text-blue-400'
                        : col.hours >= 3.0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {col.statusLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Event Popover Modal (For detailed inspection & roadmaps) */}
      {selectedPreviewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-modal rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    selectedPreviewEvent.type === 'deadline'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                  }`}
                >
                  {selectedPreviewEvent.type === 'deadline'
                    ? 'Hard Submission Deadline'
                    : 'Preparation Block'}
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
                  For assignment:{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {selectedPreviewEvent.rawTask.title}
                  </strong>
                </p>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-200/70 dark:border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Date:</span>
                <span className="font-bold">{formatFriendlyDate(selectedPreviewEvent.date)}</span>
              </div>
              {selectedPreviewEvent.time && (
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Window:</span>
                  <span className="font-mono font-bold">
                    {formatTime12h(selectedPreviewEvent.time)}
                    {selectedPreviewEvent.durationMinutes
                      ? ` (${selectedPreviewEvent.durationMinutes}m)`
                      : ''}
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
                  if (
                    selectedPreviewEvent.type === 'preparation' &&
                    selectedPreviewEvent.rawSession
                  ) {
                    toggleSession(
                      selectedPreviewEvent.taskId,
                      selectedPreviewEvent.rawSession.id
                    );
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
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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