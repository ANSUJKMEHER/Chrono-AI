export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue';

export type PlanningStrategy = 'standard' | 'intensive' | 'early_bird';

export interface Subtask {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
  scheduledDate?: string; // YYYY-MM-DD
}

export interface PreparationSession {
  id: string;
  taskId: string;
  taskTitle: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  completed: boolean;
  subtaskIds?: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  course?: string;
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:MM (24h)
  timezone?: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  status: TaskStatus;
  subtasks: Subtask[];
  preparationSessions: PreparationSession[];
  sourceText?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  confidenceScore?: number;
  isPastDeadline?: boolean;
  ambiguityNotes?: string[];
  extractionSource?: 'ai' | 'fallback';
}

export interface ExtractedTaskCandidate {
  id: string;
  title: string;
  description: string;
  course?: string;
  deadlineDate: string;
  deadlineTime: string;
  priority: TaskPriority;
  estimatedMinutes: number;
  subtasks: { title: string; estimatedMinutes: number }[];
  missingInformation: string[];
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
  sourceSnippet?: string;
  isDateAmbiguous?: boolean;
  isTimeMissing?: boolean;
  isYearInferred?: boolean;
  isPast?: boolean;
}

export interface InboxItem {
  id: string;
  originalText: string;
  extractedTaskCandidates: ExtractedTaskCandidate[];
  status: 'needs_review' | 'ready_to_approve' | 'scheduled' | 'dismissed';
  createdAt: string;
  parserMode: 'ai' | 'fallback';
  modelUsed?: string;
}

export interface UserSettings {
  theme?: 'light' | 'dark';
  timezone: string;
  preferredWorkingHours: {
    start: string; // "09:00"
    end: string;   // "21:00"
  };
  dailyPrepLimitMinutes: number; // e.g. 180 (3 hours)
  defaultTaskDurationMinutes: number; // e.g. 60
  bufferHoursBeforeDeadline: number; // e.g. 4 hours safety window
  planningStrategy: PlanningStrategy;
  aiProvider: 'nvidia' | 'openai' | 'gemini' | 'custom' | 'fallback_only';
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
}

export interface CalendarEventItem {
  id: string;
  type: 'deadline' | 'preparation';
  taskId: string;
  title: string;
  subtitle?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  durationMinutes?: number;
  priority: TaskPriority;
  completed: boolean;
  isOverdue: boolean;
  rawTask: Task;
  rawSession?: PreparationSession;
}
