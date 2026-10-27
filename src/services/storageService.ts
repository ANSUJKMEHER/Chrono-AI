import { Task, InboxItem, UserSettings } from '../types/task';
import { getTodayString, addDays } from '../utils/dateUtils';

const STORAGE_KEYS = {
  TASKS: 'chrono_tasks_v1',
  INBOX: 'chrono_inbox_v1',
  SETTINGS: 'chrono_settings_v1',
  DEMO_LOADED: 'chrono_demo_loaded_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
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

  // Generates realistic sample tasks relative to current date (e.g. today + 2 days, today + 5 days)
  loadDemoData(): Task[] {
    const today = getTodayString();
    const dueIn2Days = addDays(today, 2);
    const dueIn4Days = addDays(today, 4);
    const dueYesterday = addDays(today, -1);
    const completed2DaysAgo = addDays(today, -2);

    const demoTasks: Task[] = [
      {
        id: 'demo-task-1',
        title: 'Machine Learning Assignment: CNN Image Classifier',
        description: 'Implement and train a convolutional neural network on CIFAR-10. Submit a comprehensive analysis report with validation accuracy curves and screenshots.',
        course: 'CS 4803 / Deep Learning',
        deadlineDate: dueIn2Days,
        deadlineTime: '23:59',
        priority: 'high',
        estimatedMinutes: 240,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: 'Submit the machine learning assignment by 2 days from now at 11:59 PM. Train a CNN model, evaluate its performance, and submit a report with screenshots. The final report must be uploaded before the deadline.',
        confidenceScore: 0.96,
        extractionSource: 'ai',
        tags: ['Academic', 'CS4803', 'PyTorch'],
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
            taskTitle: 'Machine Learning Assignment: CNN Image Classifier',
            title: 'Prep 1: Pipeline & Model Setup',
            description: 'Finish data pipeline and verify model architecture.',
            date: today,
            startTime: '16:00',
            endTime: '17:45',
            durationMinutes: 105,
            completed: true,
          },
          {
            id: 'prep-1-2',
            taskId: 'demo-task-1',
            taskTitle: 'Machine Learning Assignment: CNN Image Classifier',
            title: 'Prep 2: Training & Hyperparameter Tuning',
            description: 'Run training epochs and log validation metrics.',
            date: addDays(today, 1),
            startTime: '14:00',
            endTime: '15:30',
            durationMinutes: 90,
            completed: false,
          },
          {
            id: 'prep-1-3',
            taskId: 'demo-task-1',
            taskTitle: 'Machine Learning Assignment: CNN Image Classifier',
            title: 'Prep 3: Report & Submission Polish',
            description: 'Write report and assemble final deliverable.',
            date: dueIn2Days,
            startTime: '18:00',
            endTime: '19:15',
            durationMinutes: 75,
            completed: false,
          }
        ]
      },
      {
        id: 'demo-task-2',
        title: 'Database Systems: B-Tree Indexing Project Report',
        description: 'Complete the performance evaluation between B+ Tree and Hash Indexing in PostgreSQL. Compile benchmark results into the IEEE format report.',
        course: 'CS 3200 / Database Systems',
        deadlineDate: dueIn4Days,
        deadlineTime: '17:00',
        priority: 'medium',
        estimatedMinutes: 180,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: 'Submit the DBMS indexing benchmark report by 4 days from now at 5:00 PM. Include execution plans and query cost charts.',
        confidenceScore: 0.92,
        extractionSource: 'ai',
        tags: ['Databases', 'PostgreSQL'],
        subtasks: [
          { id: 'sub-2-1', title: 'Execute query benchmark scripts', estimatedMinutes: 60, completed: false },
          { id: 'sub-2-2', title: 'Analyze EXPLAIN ANALYZE cost outputs', estimatedMinutes: 45, completed: false },
          { id: 'sub-2-3', title: 'Draft report comparisons & diagrams', estimatedMinutes: 50, completed: false },
          { id: 'sub-2-4', title: 'Final proofread and PDF export', estimatedMinutes: 25, completed: false },
        ],
        preparationSessions: [
          {
            id: 'prep-2-1',
            taskId: 'demo-task-2',
            taskTitle: 'Database Systems: B-Tree Indexing Project Report',
            title: 'Prep 1: Benchmarking & Query Analysis',
            date: addDays(today, 2),
            startTime: '10:00',
            endTime: '11:45',
            durationMinutes: 105,
            completed: false,
          },
          {
            id: 'prep-2-2',
            taskId: 'demo-task-2',
            taskTitle: 'Database Systems: B-Tree Indexing Project Report',
            title: 'Prep 2: Draft Synthesis & Export',
            date: addDays(today, 3),
            startTime: '15:00',
            endTime: '16:15',
            durationMinutes: 75,
            completed: false,
          }
        ]
      },
      {
        id: 'demo-task-3',
        title: 'DSA Practice Sheet: Dynamic Programming & Graphs',
        description: 'Solve LeetCode Top Interview 150 problems on Dynamic Programming and Dijkstra algorithm before the technical interview simulation.',
        course: 'Placement Prep',
        deadlineDate: today,
        deadlineTime: '22:00',
        priority: 'urgent',
        estimatedMinutes: 120,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: 'Finish DSA practice problems for DP and Graphs tonight before 10 PM interview prep session.',
        confidenceScore: 0.95,
        extractionSource: 'fallback',
        tags: ['Interview', 'LeetCode'],
        subtasks: [
          { id: 'sub-3-1', title: 'Coin Change & Knapsack problems', estimatedMinutes: 45, completed: true },
          { id: 'sub-3-2', title: 'Dijkstra and Topological sort graph problems', estimatedMinutes: 45, completed: false },
          { id: 'sub-3-3', title: 'Review time & space complexities', estimatedMinutes: 30, completed: false },
        ],
        preparationSessions: [
          {
            id: 'prep-3-1',
            taskId: 'demo-task-3',
            taskTitle: 'DSA Practice Sheet: Dynamic Programming & Graphs',
            title: 'Prep 1: DP Patterns Mastery',
            date: today,
            startTime: '11:00',
            endTime: '11:45',
            durationMinutes: 45,
            completed: true,
          },
          {
            id: 'prep-3-2',
            taskId: 'demo-task-3',
            taskTitle: 'DSA Practice Sheet: Dynamic Programming & Graphs',
            title: 'Prep 2: Graph Algorithms & Edge Cases',
            date: today,
            startTime: '19:00',
            endTime: '20:15',
            durationMinutes: 75,
            completed: false,
          }
        ]
      },
      {
        id: 'demo-task-4',
        title: 'Software Engineering Sprint Retrospective Document',
        description: 'Prepare the sprint review slide deck and retrospective summary for team meeting.',
        course: 'CS 4300 / Agile Dev',
        deadlineDate: completed2DaysAgo,
        deadlineTime: '16:00',
        priority: 'medium',
        estimatedMinutes: 90,
        status: 'completed',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        sourceText: 'Prepare sprint retrospective by Tuesday 4 PM.',
        confidenceScore: 0.98,
        extractionSource: 'fallback',
        tags: ['Agile', 'Team'],
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
            title: 'Prep 1: Deck & Metrics Compilation',
            date: completed2DaysAgo,
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
