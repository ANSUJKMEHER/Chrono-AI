import {
  Task,
  Subtask,
  PreparationSession,
  UserSettings,
  PlanningStrategy,
} from '../types/task';
import {
  getTodayString,
  addDays,
  diffInDays,
  parseDateSafe,
  parseDateTime,
  formatFriendlyDate,
} from '../utils/dateUtils';

export interface GeneratedPlanResult {
  sessions: PreparationSession[];
  warnings: string[];
  rationale: string;
  isFeasible: boolean;
  totalDurationMinutes: number;
}

export function generatePreparationPlan(
  task: {
    id: string;
    title: string;
    deadlineDate: string;
    deadlineTime?: string;
    subtasks: Array<{ id?: string; title: string; estimatedMinutes?: number }>;
    estimatedMinutes?: number;
  },
  existingTasks: Task[],
  settings: UserSettings,
  strategyOverride?: PlanningStrategy
): GeneratedPlanResult {
  const strategy = strategyOverride || settings.planningStrategy || 'standard';
  const todayStr = getTodayString();
  const deadlineDate = task.deadlineDate;
  const deadlineTime = task.deadlineTime || '23:59';
  const deadlineTarget = parseDateTime(deadlineDate, deadlineTime);

  const warnings: string[] = [];
  const now = new Date();

  // 1. Check if deadline has already passed
  if (!deadlineTarget || deadlineTarget.getTime() <= now.getTime()) {
    return {
      sessions: [],
      warnings: ['This deadline has already passed. A preparation schedule cannot be generated in the past.'],
      rationale: 'No schedule created because the target deadline is in the past.',
      isFeasible: false,
      totalDurationMinutes: 0,
    };
  }

  // 2. Prepare subtasks and durations
  const rawSubtasks = task.subtasks && task.subtasks.length > 0
    ? task.subtasks
    : [
        { title: 'Research & project setup', estimatedMinutes: 45 },
        { title: 'Drafting & core development', estimatedMinutes: 60 },
        { title: 'Review, verification & submission', estimatedMinutes: 45 },
      ];

  const totalEffort = task.estimatedMinutes ||
    rawSubtasks.reduce((acc, st) => acc + (st.estimatedMinutes || 45), 0);

  // Calculate available days between today and deadline
  const daysUntilDeadline = Math.max(0, diffInDays(todayStr, deadlineDate));
  const hoursUntilDeadline = (deadlineTarget.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Collect existing sessions by date to avoid overloading
  const existingMinutesByDate: Record<string, number> = {};
  for (const t of existingTasks) {
    if (t.id === task.id) continue;
    for (const sess of t.preparationSessions || []) {
      existingMinutesByDate[sess.date] = (existingMinutesByDate[sess.date] || 0) + sess.durationMinutes;
    }
  }

  // Determine target completion date based on strategy
  let targetEndDay = deadlineDate;
  if (strategy === 'early_bird' && daysUntilDeadline >= 2) {
    targetEndDay = addDays(deadlineDate, -1);
  }

  // Feasibility check: Can we fit totalEffort hours in available days?
  const maxDailyCapacity = settings.dailyPrepLimitMinutes || 180;
  const availableDaysCount = Math.max(1, diffInDays(todayStr, targetEndDay) + 1);
  const totalMaxCapacity = availableDaysCount * maxDailyCapacity;

  let isFeasible = true;
  if (hoursUntilDeadline < totalEffort / 60) {
    isFeasible = false;
    warnings.push(
      `⚠️ Time deficit: Task requires ~${Math.round(totalEffort / 60)}h of effort, but only ${Math.round(hoursUntilDeadline)}h remain before the deadline!`
    );
  } else if (totalEffort > totalMaxCapacity) {
    warnings.push(
      `⚠️ Exceeds daily limit: Requires ${Math.round(totalEffort / 60)}h across ${availableDaysCount} days, which exceeds your configured ${Math.round(maxDailyCapacity / 60)}h/day limit.`
    );
  }

  if (hoursUntilDeadline < 24) {
    warnings.push('⚡ Imminent deadline: All preparation sessions have been compressed into today.');
  }

  // Generate sessions working backwards or spaced forward
  const sessions: PreparationSession[] = [];
  const sessionCount = rawSubtasks.length;

  // Working hours range (e.g. 09:00 to 21:00)
  const [prefStartH] = (settings.preferredWorkingHours?.start || '09:00').split(':').map(Number);
  const [prefEndH] = (settings.preferredWorkingHours?.end || '21:00').split(':').map(Number);

  // Assign each subtask to a target date
  for (let i = 0; i < sessionCount; i++) {
    const subtask = rawSubtasks[i];
    const duration = subtask.estimatedMinutes || Math.round(totalEffort / sessionCount);

    let sessionDate = todayStr;

    if (daysUntilDeadline === 0 || hoursUntilDeadline < 24) {
      // All today
      sessionDate = todayStr;
    } else {
      let dayOffset = 0;
      if (strategy === 'intensive') {
        // Cram in last 1-2 days
        const lastDays = Math.min(2, daysUntilDeadline);
        const dayProgress = i / (sessionCount > 1 ? sessionCount - 1 : 1);
        const relativeDay = Math.floor(dayProgress * lastDays);
        sessionDate = addDays(targetEndDay, - (lastDays - 1 - relativeDay));
      } else if (strategy === 'early_bird') {
        // Space between today and 1 day before deadline
        const span = Math.max(1, diffInDays(todayStr, targetEndDay));
        const dayProgress = i / (sessionCount > 1 ? sessionCount - 1 : 1);
        dayOffset = Math.round(dayProgress * span);
        sessionDate = addDays(todayStr, dayOffset);
      } else {
        // Standard spaced distribution
        const span = Math.max(1, daysUntilDeadline);
        const dayProgress = i / (sessionCount > 1 ? sessionCount - 1 : 1);
        dayOffset = Math.round(dayProgress * span);
        sessionDate = addDays(todayStr, dayOffset);
      }
    }

    // Determine smart time slot for the session
    // Morning slot: 10:00, Afternoon slot: 15:00, Evening slot: 18:30
    let startHour = 15;
    let startMin = 0;

    if (i % 3 === 0) {
      startHour = Math.max(prefStartH, 10);
    } else if (i % 3 === 1) {
      startHour = Math.min(prefEndH - 2, 15);
    } else {
      startHour = Math.min(prefEndH - 2, 18);
      startMin = 30;
    }

    // If session is scheduled on deadline day, make sure it ends at least bufferHours before deadline
    if (sessionDate === deadlineDate && deadlineTime) {
      const [deadH] = deadlineTime.split(':').map(Number);
      const buffer = settings.bufferHoursBeforeDeadline || 3;
      if (startHour + duration / 60 > deadH - buffer) {
        startHour = Math.max(prefStartH, deadH - buffer - Math.ceil(duration / 60));
      }
    }

    const endTotalMinutes = startHour * 60 + startMin + duration;
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;

    const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    sessions.push({
      id: `prep-${task.id || 'new'}-${i + 1}-${Date.now()}`,
      taskId: task.id || 'temp',
      taskTitle: task.title,
      title: `Prep ${i + 1}: ${subtask.title}`,
      description: `Focus on: ${subtask.title}. Estimated time: ${duration} mins.`,
      date: sessionDate,
      startTime: startTimeStr,
      endTime: endTimeStr,
      durationMinutes: duration,
      completed: false,
      subtaskIds: subtask.id ? [subtask.id] : undefined,
    });
  }

  // Generate clear rationale
  let rationale = '';
  if (daysUntilDeadline === 0) {
    rationale = `Due today! Structured ${sessions.length} rapid prep blocks today before ${deadlineTime}, reserving a final submission window.`;
  } else if (strategy === 'early_bird') {
    rationale = `Early-Bird Plan: Scheduled ${sessions.length} sessions to wrap up by ${formatFriendlyDate(targetEndDay)}, providing a full day of buffer before the official deadline.`;
  } else if (strategy === 'intensive') {
    rationale = `Intensive Plan: Focused ${sessions.length} work blocks in the final 48 hours leading up to the deadline.`;
  } else {
    rationale = `Spaced Plan: Balanced ${sessions.length} preparation sessions evenly across ${daysUntilDeadline} days, preventing burnout and reserving final hours for submission validation.`;
  }

  return {
    sessions,
    warnings,
    rationale,
    isFeasible,
    totalDurationMinutes: totalEffort,
  };
}
