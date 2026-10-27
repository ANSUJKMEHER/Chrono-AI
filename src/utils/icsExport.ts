import { Task, PreparationSession } from '../types/task';
import { parseDateTime } from './dateUtils';

function formatDateToICS(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth() + 1);
  const d = pad(dt.getUTCDate());
  const h = pad(dt.getUTCHours());
  const min = pad(dt.getUTCMinutes());
  const s = pad(dt.getUTCSeconds());
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

export function exportTasksToICS(tasks: Task[], filename = 'chronoai-schedule.ics'): void {
  const events: string[] = [];

  for (const t of tasks) {
    // 1. Deadline Event
    const deadlineTarget = parseDateTime(t.deadlineDate, t.deadlineTime);
    if (deadlineTarget) {
      const dtStart = new Date(deadlineTarget.getTime() - 30 * 60 * 1000); // 30 min block
      const dtEnd = deadlineTarget;

      events.push(
        [
          'BEGIN:VEVENT',
          `UID:chrono-deadline-${t.id}@chronoai.app`,
          `DTSTAMP:${formatDateToICS(new Date())}`,
          `DTSTART:${formatDateToICS(dtStart)}`,
          `DTEND:${formatDateToICS(dtEnd)}`,
          `SUMMARY:🚩 DEADLINE: ${t.title.replace(/[\n\r]/g, ' ')}`,
          `DESCRIPTION:${(t.description || t.title).replace(/[\n\r]/g, ' ')}\\n\\nPriority: ${t.priority.toUpperCase()}\\nManaged by ChronoAI`,
          `CATEGORIES:DEADLINE,${t.course || 'ACADEMIC'}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n')
      );
    }

    // 2. Preparation Session Events
    for (const s of t.preparationSessions || []) {
      const startDt = parseDateTime(s.date, s.startTime);
      const endDt = parseDateTime(s.date, s.endTime);

      if (startDt && endDt) {
        events.push(
          [
            'BEGIN:VEVENT',
            `UID:chrono-prep-${s.id}@chronoai.app`,
            `DTSTAMP:${formatDateToICS(new Date())}`,
            `DTSTART:${formatDateToICS(startDt)}`,
            `DTEND:${formatDateToICS(endDt)}`,
            `SUMMARY:⏱️ [ChronoAI] ${s.title.replace(/[\n\r]/g, ' ')}`,
            `DESCRIPTION:Preparation for: ${t.title.replace(/[\n\r]/g, ' ')}\\nDuration: ${s.durationMinutes} mins\\n${(s.description || '').replace(/[\n\r]/g, ' ')}`,
            `CATEGORIES:PREPARATION,STUDY`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
          ].join('\r\n')
        );
      }
    }
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronoAI//Deadline Intelligence//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ChronoAI Preparation Schedule',
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  // Trigger download in browser
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
