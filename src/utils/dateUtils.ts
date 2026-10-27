// Date utility functions for ChronoAI

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dt = new Date(y, m, d);
      if (dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
        return dt;
      }
    }
  }
  const dt = new Date(dateStr);
  return isNaN(dt.getTime()) ? null : dt;
}

export function parseDateTime(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const d = parseDateSafe(dateStr);
  if (!d) return null;

  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      d.setHours(h, m, 0, 0);
      return d;
    }
  } else {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

export function formatFriendlyDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return 'No date';
  const todayStr = getTodayString();
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;

  const timeFormatted = timeStr ? formatTime12h(timeStr) : '';

  if (dateStr === todayStr) {
    return timeFormatted ? `Today at ${timeFormatted}` : 'Today';
  }

  const tomorrow = addDays(todayStr, 1);
  if (dateStr === tomorrow) {
    return timeFormatted ? `Tomorrow at ${timeFormatted}` : 'Tomorrow';
  }

  const yesterday = addDays(todayStr, -1);
  if (dateStr === yesterday) {
    return timeFormatted ? `Yesterday at ${timeFormatted}` : 'Yesterday';
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const currentYear = new Date().getFullYear();
  if (d.getFullYear() !== currentYear) {
    options.year = 'numeric';
  }

  const formatted = d.toLocaleDateString(undefined, options);
  return timeFormatted ? `${formatted} at ${timeFormatted}` : formatted;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) return timeStr;

  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const minFormatted = isNaN(m) ? '00' : String(m).padStart(2, '0');
  return `${h12}:${minFormatted} ${ampm}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateSafe(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function diffInDays(dateStr1: string, dateStr2: string): number {
  const d1 = parseDateSafe(dateStr1);
  const d2 = parseDateSafe(dateStr2);
  if (!d1 || !d2) return 0;
  const msDiff = d2.getTime() - d1.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

export function getRelativeTimeString(dateStr: string, timeStr?: string): { text: string; isUrgent: boolean; isOverdue: boolean } {
  const target = parseDateTime(dateStr, timeStr);
  if (!target) return { text: 'Invalid date', isUrgent: false, isOverdue: false };

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    if (overdueHours < 1) {
      return { text: 'Just overdue', isUrgent: true, isOverdue: true };
    }
    if (overdueHours < 24) {
      return { text: `Overdue by ${Math.round(overdueHours)}h`, isUrgent: true, isOverdue: true };
    }
    const overdueDays = Math.round(overdueHours / 24);
    return { text: `Overdue by ${overdueDays}d`, isUrgent: true, isOverdue: true };
  }

  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { text: `Due in ${mins}m`, isUrgent: true, isOverdue: false };
  }

  if (diffHours < 24) {
    return { text: `Due in ${Math.round(diffHours)}h`, isUrgent: true, isOverdue: false };
  }

  const days = Math.round(diffHours / 24);
  return {
    text: days === 1 ? 'Due tomorrow' : `Due in ${days} days`,
    isUrgent: days <= 2,
    isOverdue: false,
  };
}

export function isDateInThisWeek(dateStr: string): boolean {
  const today = new Date();
  const target = parseDateSafe(dateStr);
  if (!target) return false;

  // Day of week (0 is Sunday, 6 is Saturday)
  const currentDay = today.getDay();
  // Start of week (Sunday or Monday, let's treat Monday or Sunday as start)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return target >= startOfWeek && target <= endOfWeek;
}

export function getGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }
  return {
    greeting,
    subtitle: "Here's what needs your attention.",
  };
}
