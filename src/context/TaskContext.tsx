import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  InboxItem,
  UserSettings,
  CalendarEventItem,
  PreparationSession,
  PlanningStrategy,
} from '../types/task';
import { StorageService, DEFAULT_SETTINGS } from '../services/storageService';
import {
  getTodayString,
  isDateInThisWeek,
  parseDateSafe,
  parseDateTime,
  addDays,
} from '../utils/dateUtils';
import { generatePreparationPlan } from '../services/planningService';
import confetti from 'canvas-confetti';

interface TaskContextType {
  tasks: Task[];
  inbox: InboxItem[];
  settings: UserSettings;
  isDemoLoaded: boolean;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  toggleSession: (taskId: string, sessionId: string) => void;
  addInboxItem: (item: Omit<InboxItem, 'id' | 'createdAt'>) => InboxItem;
  updateInboxItem: (id: string, updates: Partial<InboxItem>) => void;
  deleteInboxItem: (id: string) => void;
  updateSettings: (newSettings: UserSettings) => void;
  loadDemoData: () => void;
  clearAllData: () => void;
  regenerateTaskPlan: (taskId: string, strategy?: PlanningStrategy) => void;
  stats: {
    dueToday: number;
    dueThisWeek: number;
    overdue: number;
    completedThisWeek: number;
    totalCompleted: number;
    upcomingTasks: Task[];
    todaySessions: PreparationSession[];
    workloadByDay: Array<{ date: string; dayLabel: string; prepMinutes: number; deadlineCount: number }>;
  };
  calendarEvents: CalendarEventItem[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [inbox, setInbox] = useState<InboxItem[]>(() => StorageService.getInboxItems());
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [isDemoLoaded, setIsDemoLoaded] = useState<boolean>(() => StorageService.isDemoLoaded());

  // Automatically seed demo data on fresh first run if completely empty
  useEffect(() => {
    if (tasks.length === 0 && !StorageService.isDemoLoaded()) {
      const demo = StorageService.loadDemoData();
      setTasks(demo);
      setIsDemoLoaded(true);
    }
  }, []);

  // Save changes to storage
  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    StorageService.saveInboxItems(inbox);
  }, [inbox]);

  const updateSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  }, []);

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const newStatus = t.status === 'completed' ? 'in_progress' : 'completed';
        if (newStatus === 'completed') {
          try {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.8 },
            });
          } catch {}
        }
        return {
          ...t,
          status: newStatus,
          // Mark all subtasks and sessions as completed if marking task complete
          subtasks: t.subtasks.map(st => ({
            ...st,
            completed: newStatus === 'completed' ? true : st.completed,
          })),
          preparationSessions: (t.preparationSessions || []).map(ps => ({
            ...ps,
            completed: newStatus === 'completed' ? true : ps.completed,
          })),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const updatedSubtasks = t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = updatedSubtasks.every(st => st.completed);
        return {
          ...t,
          subtasks: updatedSubtasks,
          status: allCompleted ? 'completed' : t.status === 'completed' ? 'in_progress' : t.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const toggleSession = useCallback((taskId: string, sessionId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const updatedSessions = (t.preparationSessions || []).map(s => {
          if (s.id !== sessionId) return s;
          const nextCompleted = !s.completed;
          if (nextCompleted) {
            try {
              confetti({
                particleCount: 35,
                spread: 45,
                origin: { y: 0.85 },
              });
            } catch {}
          }
          return { ...s, completed: nextCompleted };
        });
        return {
          ...t,
          preparationSessions: updatedSessions,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const regenerateTaskPlan = useCallback((taskId: string, strategy?: PlanningStrategy) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === taskId);
      if (!target) return prev;

      const planResult = generatePreparationPlan(
        {
          id: target.id,
          title: target.title,
          deadlineDate: target.deadlineDate,
          deadlineTime: target.deadlineTime,
          subtasks: target.subtasks,
          estimatedMinutes: target.estimatedMinutes,
        },
        prev,
        settings,
        strategy
      );

      return prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              preparationSessions: planResult.sessions,
              ambiguityNotes: planResult.warnings,
              updatedAt: new Date().toISOString(),
            }
          : t
      );
    });
  }, [settings]);

  const addInboxItem = useCallback((itemData: Omit<InboxItem, 'id' | 'createdAt'>): InboxItem => {
    const newItem: InboxItem = {
      ...itemData,
      id: `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setInbox(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  const updateInboxItem = useCallback((id: string, updates: Partial<InboxItem>) => {
    setInbox(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const deleteInboxItem = useCallback((id: string) => {
    setInbox(prev => prev.filter(item => item.id !== id));
  }, []);

  const loadDemoData = useCallback(() => {
    const demo = StorageService.loadDemoData();
    setTasks(demo);
    setIsDemoLoaded(true);
  }, []);

  const clearAllData = useCallback(() => {
    StorageService.clearAllData();
    setTasks([]);
    setInbox([]);
    setIsDemoLoaded(false);
  }, []);

  // Compute live statistics
  const stats = useMemo(() => {
    const todayStr = getTodayString();
    let dueToday = 0;
    let dueThisWeek = 0;
    let overdue = 0;
    let completedThisWeek = 0;
    let totalCompleted = 0;
    const upcomingTasks: Task[] = [];
    const todaySessions: PreparationSession[] = [];

    const now = new Date();

    for (const t of tasks) {
      if (t.status === 'completed') {
        totalCompleted++;
        if (t.updatedAt && isDateInThisWeek(t.updatedAt.split('T')[0])) {
          completedThisWeek++;
        }
        continue;
      }

      // Check if overdue
      const targetDt = parseDateTime(t.deadlineDate, t.deadlineTime);
      const isPast = targetDt ? targetDt < now : false;

      if (isPast) {
        overdue++;
      } else {
        upcomingTasks.push(t);
        if (t.deadlineDate === todayStr) {
          dueToday++;
        }
        if (isDateInThisWeek(t.deadlineDate)) {
          dueThisWeek++;
        }
      }

      // Collect today's preparation sessions
      if (t.preparationSessions) {
        for (const sess of t.preparationSessions) {
          if (sess.date === todayStr) {
            todaySessions.push(sess);
          }
        }
      }
    }

    // Sort upcoming tasks by deadline
    upcomingTasks.sort((a, b) => {
      const dtA = parseDateTime(a.deadlineDate, a.deadlineTime)?.getTime() || 0;
      const dtB = parseDateTime(b.deadlineDate, b.deadlineTime)?.getTime() || 0;
      return dtA - dtB;
    });

    // 7-day workload distribution
    const workloadByDay: Array<{ date: string; dayLabel: string; prepMinutes: number; deadlineCount: number }> = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(todayStr, i);
      const d = parseDateSafe(dayDate);
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d ? d.toLocaleDateString(undefined, { weekday: 'short' }) : dayDate;

      let prepMinutes = 0;
      let deadlineCount = 0;

      for (const t of tasks) {
        if (t.status !== 'completed' && t.deadlineDate === dayDate) {
          deadlineCount++;
        }
        for (const sess of t.preparationSessions || []) {
          if (sess.date === dayDate) {
            prepMinutes += sess.durationMinutes;
          }
        }
      }

      workloadByDay.push({
        date: dayDate,
        dayLabel,
        prepMinutes,
        deadlineCount,
      });
    }

    return {
      dueToday,
      dueThisWeek,
      overdue,
      completedThisWeek,
      totalCompleted,
      upcomingTasks,
      todaySessions,
      workloadByDay,
    };
  }, [tasks]);

  // Unified Calendar Events (combining deadlines and preparation sessions)
  const calendarEvents = useMemo<CalendarEventItem[]>(() => {
    const events: CalendarEventItem[] = [];
    const now = new Date();

    for (const t of tasks) {
      const isCompleted = t.status === 'completed';
      const targetDt = parseDateTime(t.deadlineDate, t.deadlineTime);
      const isOverdue = !isCompleted && (targetDt ? targetDt < now : false);

      // Event for the deadline itself
      events.push({
        id: `event-deadline-${t.id}`,
        type: 'deadline',
        taskId: t.id,
        title: t.title,
        subtitle: t.course ? `${t.course} • Deadline` : 'Deadline',
        date: t.deadlineDate,
        time: t.deadlineTime,
        priority: t.priority,
        completed: isCompleted,
        isOverdue,
        rawTask: t,
      });

      // Events for each preparation session
      if (t.preparationSessions) {
        for (const ps of t.preparationSessions) {
          events.push({
            id: `event-prep-${ps.id}`,
            type: 'preparation',
            taskId: t.id,
            title: ps.title,
            subtitle: `${t.title} (${ps.durationMinutes}m)`,
            date: ps.date,
            time: ps.startTime,
            durationMinutes: ps.durationMinutes,
            priority: t.priority,
            completed: ps.completed,
            isOverdue: false,
            rawTask: t,
            rawSession: ps,
          });
        }
      }
    }

    return events;
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        inbox,
        settings,
        isDemoLoaded,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,
        toggleSession,
        addInboxItem,
        updateInboxItem,
        deleteInboxItem,
        updateSettings,
        loadDemoData,
        clearAllData,
        regenerateTaskPlan,
        stats,
        calendarEvents,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return ctx;
}
