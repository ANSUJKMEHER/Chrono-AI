import { Task, InboxItem, UserSettings } from '../types/task';
import { getTodayString, addDays } from '../utils/dateUtils';

const STORAGE_KEYS = {
  TASKS: 'chrono_tasks_v1',
  INBOX: 'chrono_inbox_v1',
  SETTINGS: 'chrono_settings_v1',
  DEMO_LOADED: 'chrono_demo_loaded_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  preferredWorkingHours: {
    start: '09:00',
    end: '21:00',
  },
  dailyPrepLimitMinutes: 180, // 3 hours
  defaultTaskDurationMinutes: 60,
  bufferHoursBeforeDeadline: 4,
  planningStrategy: 'standard',
  aiProvider: 'fallback_only',
  apiKey: '',
  apiEndpoint: 'https://integrate.api.nvidia.com/v1',
  modelName: 'nvidia/nemotron-3-ultra-550b-a55b',
};

// Safe JSON Parse wrapper
function safeJsonParse<T>(data: string | null, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (err) {
    console.error('Storage JSON parse error:', err);
    return fallback;
  }
}

export const StorageService = {
  getTasks(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks = safeJsonParse<Task[]>(raw, []);
      // Recalculate dynamic status (like overdue) on load
      return tasks.map(task => {
        if (task.status === 'completed') return task;
        const now = new Date();
        const parts = task.deadlineDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          if (task.deadlineTime) {
            const [h, m] = task.deadlineTime.split(':').map(Number);
            d.setHours(h, m, 59);
          } else {
            d.setHours(23, 59, 59);
          }
          if (d < now) {
            return { ...task, status: 'overdue' as const, isPastDeadline: true };
          }
        }
        return task;
      });
    } catch {
      return [];
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  },

  getInboxItems(): InboxItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.INBOX);
      return safeJsonParse<InboxItem[]>(raw, []);
    } catch {
      return [];
    }
  },

  saveInboxItems(items: InboxItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save inbox to localStorage', e);
    }
  },

  getSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return safeJsonParse<UserSettings>(raw, DEFAULT_SETTINGS);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  },

  isDemoLoaded(): boolean {
    return localStorage.getItem(STORAGE_KEYS.DEMO_LOADED) === 'true';
  },

  setDemoLoaded(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.DEMO_LOADED, val ? 'true' : 'false');
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.INBOX);
    localStorage.removeItem(STORAGE_KEYS.DEMO_LOADED);
  },

  // Generates realistic sample tasks matching the reference syllabus timeline
  loadDemoData(): Task[] {
    const today = getTodayString();
    // Anchor to today's week or default to Oct 2026
    const oct25 = today.startsWith('2026-10') ? '2026-10-25' : addDays(today, -3);
    const oct26 = today.startsWith('2026-10') ? '2026-10-26' : addDays(today, -2);
    const oct27 = today.startsWith('2026-10') ? '2026-10-27' : addDays(today, -1);
    const oct28 = today.startsWith('2026-10') ? '2026-10-28' : today;
    const oct29 = today.startsWith('2026-10') ? '2026-10-29' : addDays(today, 1);
    const oct30 = today.startsWith('2026-10') ? '2026-10-30' : addDays(today, 2);
    const oct31 = today.startsWith('2026-10') ? '2026-10-31' : addDays(today, 3);

    const demoTasks: Task[] = [
      {
        id: 'demo-task-1',
        title: 'CS 4803: Deep Learning Assignment (CNN Image Classifier)',
        description: 'Implement and train a convolutional neural network on CIFAR-10. Submit a comprehensive analysis report with validation accuracy curves and screenshots.',
        course: 'Georgia Tech CS 4803 (Deep Learning)',
        deadlineDate: oct29,
        deadlineTime: '23:59',
        priority: 'high',
        estimatedMinutes: 270,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: 'Submit the deep learning assignment by Thursday at 11:59 PM. Train a CNN model, evaluate its performance, and submit a report with screenshots. The final report must be uploaded before the deadline.',
        confidenceScore: 0.98,
        extractionSource: 'ai',
        tags: ['CS4803', 'Deep Learning', 'PyTorch'],
        subtasks: [
          { id: 'sub-1-1', title: 'Data preprocessing & augmentation pipeline', estimatedMinutes: 45, completed: true },
          { id: 'sub-1-2', title: 'Implement CNN architecture with PyTorch', estimatedMinutes: 60, completed: true },
          { id: 'sub-1-3', title: 'Train model & hyperparameter tuning', estimatedMinutes: 60, completed: false },
          { id: 'sub-1-4', title: 'Write evaluation report & generate loss curves', estimatedMinutes: 45, completed: false },
          { id: 'sub-1-5', title: 'Verify submission zip & upload to portal', estimatedMinutes: 30, completed: false },
        ],
        preparationSessions: [
          {
            id: 'prep-1-1',
            taskId: 'demo-task-1',
            taskTitle: 'CS 4803: Deep Learning Assignment (CNN Image Classifier)',
            title: 'Prep 1: Pipeline & Tests',
            description: 'Finish data pipeline and verify model architecture.',
            date: oct27,
            startTime: '14:00',
            endTime: '15:30',
            durationMinutes: 90,
            completed: true,
          },
          {
            id: 'prep-1-2',
            taskId: 'demo-task-1',
            taskTitle: 'CS 4803: Deep Learning Assignment (CNN Image Classifier)',
            title: 'Prep 2: Training & Hyperparams',
            description: 'Run training epochs and log validation metrics on CIFAR-10.',
            date: oct28,
            startTime: '14:00',
            endTime: '16:00',
            durationMinutes: 120,
            completed: false,
          },
          {
            id: 'prep-1-3',
            taskId: 'demo-task-1',
            taskTitle: 'CS 4803: Deep Learning Assignment (CNN Image Classifier)',
            title: 'Prep 3: Report & Metrics',
            description: 'Write report and assemble final deliverable.',
            date: oct29,
            startTime: '18:00',
            endTime: '19:00',
            durationMinutes: 60,
            completed: false,
          }
        ]
      },
      {
        id: 'demo-task-2',
        title: 'Math 3012: Combinatorics Homework 6',
        description: 'Solve problem set covering chromatic numbers, Ramsey theory, and bipartite graph matchings.',
        course: 'Math 3012',
        deadlineDate: oct29,
        deadlineTime: '23:59',
        priority: 'high',
        estimatedMinutes: 120,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: 'Submit Math 3012 homework 6 on combinatorics by Thursday Oct 29 at 11:59 PM.',
        confidenceScore: 0.95,
        extractionSource: 'ai',
        tags: ['Math3012', 'Combinatorics'],
        subtasks: [
          { id: 'sub-2-1', title: 'Draft proofs for chromatic bounds', estimatedMinutes: 45, completed: false },
          { id: 'sub-2-2', title: 'Solve bipartite matching problems', estimatedMinutes: 45, completed: false },
          { id: 'sub-2-3', title: 'Typeset solutions in LaTeX and proofread', estimatedMinutes: 30, completed: false },
        ],
        preparationSessions: [
          {
            id: 'prep-2-1',
            taskId: 'demo-task-2',
            taskTitle: 'Math 3012: Combinatorics Homework 6',
            title: 'Prep 1: Graph Theory & Pigeonhole Proofs',
            date: oct29,
            startTime: '14:00',
            endTime: '16:00',
            durationMinutes: 120,
            completed: false,
          }
        ]
      },
      {
        id: 'demo-task-3',
        title: 'CS 3200: Database Systems B-Tree Indexing Project Report',
        description: 'Complete the performance evaluation between B+ Tree and Hash Indexing in PostgreSQL. Compile benchmark results into the IEEE format report.',
        course: 'CS 3200 / Database Systems',
        deadlineDate: oct31,
        deadlineTime: '17:00',
        priority: 'medium',
        estimatedMinutes: 180,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: 'Submit the DBMS indexing benchmark report by Saturday at 5:00 PM. Include execution plans and query cost charts.',
        confidenceScore: 0.92,
        extractionSource: 'ai',
        tags: ['Databases', 'PostgreSQL', 'CS3200'],
        subtasks: [
          { id: 'sub-3-1', title: 'Execute query benchmark scripts', estimatedMinutes: 60, completed: false },
          { id: 'sub-3-2', title: 'Analyze EXPLAIN ANALYZE cost outputs', estimatedMinutes: 45, completed: false },
          { id: 'sub-3-3', title: 'Draft report comparisons & diagrams', estimatedMinutes: 50, completed: false },
          { id: 'sub-3-4', title: 'Final proofread and PDF export', estimatedMinutes: 25, completed: false },
        ],
        preparationSessions: [
          {
            id: 'prep-3-1',
            taskId: 'demo-task-3',
            taskTitle: 'CS 3200: Database Systems B-Tree Indexing Project Report',
            title: 'Prep 1: Benchmarking & Query Analysis',
            date: oct30,
            startTime: '14:00',
            endTime: '16:00',
            durationMinutes: 120,
            completed: false,
          },
          {
            id: 'prep-3-2',
            taskId: 'demo-task-3',
            taskTitle: 'CS 3200: Database Systems B-Tree Indexing Project Report',
            title: 'Prep 2: Draft Synthesis & Export',
            date: oct31,
            startTime: '10:00',
            endTime: '11:00',
            durationMinutes: 60,
            completed: false,
          }
        ]
      },
      {
        id: 'demo-task-4',
        title: 'Software Engineering Sprint Retrospective Document',
        description: 'Prepare the sprint review slide deck and retrospective summary for team meeting.',
        course: 'CS 4300 / Agile Dev',
        deadlineDate: oct25,
        deadlineTime: '16:00',
        priority: 'medium',
        estimatedMinutes: 90,
        status: 'completed',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        sourceText: 'Prepare sprint retrospective by Sunday 4 PM.',
        confidenceScore: 0.98,
        extractionSource: 'fallback',
        tags: ['Agile', 'Team', 'CS4300'],
        subtasks: [
          { id: 'sub-4-1', title: 'Gather velocity metrics and burndown chart', estimatedMinutes: 30, completed: true },
          { id: 'sub-4-2', title: 'Write What Went Well & Action Items', estimatedMinutes: 40, completed: true },
          { id: 'sub-4-3', title: 'Share deck on Slack', estimatedMinutes: 20, completed: true },
        ],
        preparationSessions: [
          {
            id: 'prep-4-1',
            taskId: 'demo-task-4',
            taskTitle: 'Software Engineering Sprint Retrospective Document',
            title: 'Software Eng Prep 1: Architecture Review & Velocity Charts',
            date: oct25,
            startTime: '14:00',
            endTime: '15:30',
            durationMinutes: 90,
            completed: true,
          }
        ]
      }
    ];

    this.saveTasks(demoTasks);
    this.setDemoLoaded(true);
    return demoTasks;
  }
};
