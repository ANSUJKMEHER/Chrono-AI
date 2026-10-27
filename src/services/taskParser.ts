import { ExtractedTaskCandidate, TaskPriority } from '../types/task';
import { getTodayString, addDays, parseDateSafe } from '../utils/dateUtils';

// Helper to sanitize title
function cleanTitle(str: string): string {
  return str
    .replace(/^(\d+[\.\)]|\-|\*)\s*/, '')
    .replace(/^(submit|finish|complete|do|prepare|work on)\s+/i, '')
    .trim();
}

// Map month names to numbers
const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

export interface FallbackParseResult {
  tasks: ExtractedTaskCandidate[];
  parserMode: 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

export function parseTextDeterministic(rawText: string): FallbackParseResult {
  if (!rawText || !rawText.trim()) {
    return { tasks: [], parserMode: 'fallback', confidence: 'low' };
  }

  const text = rawText.trim();
  const todayStr = getTodayString();
  const todayParts = todayStr.split('-').map(Number);
  const currentYear = todayParts[0];

  // Step 1: Detect if text contains multiple distinct deadlines/tasks
  const candidateSnippets = splitIntoCandidates(text);
  const tasks: ExtractedTaskCandidate[] = [];

  for (let i = 0; i < candidateSnippets.length; i++) {
    const snippet = candidateSnippets[i];
    const extracted = extractSingleCandidate(snippet, i, currentYear, todayStr);
    tasks.push(extracted);
  }

  return {
    tasks,
    parserMode: 'fallback',
    confidence: tasks.length > 0 && tasks.every(t => !t.isDateAmbiguous) ? 'medium' : 'low',
  };
}

function splitIntoCandidates(text: string): string[] {
  // Check for numbered items (1. ... 2. ...)
  const numbered = text.split(/(?:^|\n)\s*\d+[\.\)]\s+/).map(s => s.trim()).filter(Boolean);
  if (numbered.length > 1) {
    return numbered;
  }

  // Check for bullet items (- ... or * ...)
  const bullets = text.split(/(?:^|\n)\s*[\-\*•]\s+/).map(s => s.trim()).filter(Boolean);
  if (bullets.length > 1) {
    return bullets;
  }

  // Check for conjunction-separated task lists:
  // e.g. "Submit the DBMS assignment by Friday, attend the project review on Saturday, and finish the DSA sheet by Sunday"
  const multiClauseRegex = /([A-Z][^,;\n]+(?:by|on|before|at)\s+[A-Za-z0-9\s:]+?)(?:,\s*(?:and\s+)?|;\s*|\s+and\s+(?=[A-Z]|submit|finish|attend|complete))/gi;
  const matches = [...text.matchAll(multiClauseRegex)].map(m => m[1].trim());
  if (matches.length > 1) {
    return matches;
  }

  return [text];
}

function extractSingleCandidate(
  snippet: string,
  index: number,
  currentYear: number,
  todayStr: string
): ExtractedTaskCandidate {
  const missingInfo: string[] = [];
  const warnings: string[] = [];
  let isDateAmbiguous = false;
  let isTimeMissing = false;
  let isYearInferred = false;

  // Extract Deadline Date & Time
  const dateResult = parseDatesFromText(snippet, currentYear, todayStr);
  let deadlineDate = dateResult.date;
  let deadlineTime = dateResult.time || '23:59';

  if (!dateResult.time) {
    isTimeMissing = true;
    missingInfo.push('Exact submission time not specified (defaulted to 23:59 EOD).');
  }

  if (dateResult.isYearInferred) {
    isYearInferred = true;
    missingInfo.push(`Year was not explicitly mentioned. Inferred as ${currentYear}.`);
  }

  if (dateResult.isAmbiguous) {
    isDateAmbiguous = true;
    warnings.push(`Relative date parsed from "${dateResult.matchedPhrase}". Please verify target date.`);
  }

  if (!deadlineDate) {
    // Missing date completely
    deadlineDate = addDays(todayStr, 3);
    missingInfo.push('No deadline date found in message. Assigned placeholder (3 days out).');
    isDateAmbiguous = true;
  }

  // Check if date is in the past
  const parsedTarget = parseDateSafe(deadlineDate);
  const now = new Date();
  const isPast = parsedTarget ? parsedTarget < new Date(now.getFullYear(), now.getMonth(), now.getDate()) : false;
  if (isPast) {
    warnings.push(`⚠️ Extracted deadline (${deadlineDate}) is in the past!`);
  }

  // Extract Priority
  const priority = detectPriority(snippet);

  // Extract Course Code / Subject
  const course = detectCourse(snippet);

  // Extract Title
  const title = extractTitle(snippet, course);

  // Extract Effort estimation
  const estimatedMinutes = extractEffortMinutes(snippet);

  // Extract Subtasks
  const subtasks = extractSubtasks(snippet);

  // Description is the snippet without heavy repetition
  const description = snippet.length > 250 ? `${snippet.slice(0, 247)}...` : snippet;

  return {
    id: `extracted-${Date.now()}-${index}`,
    title,
    description,
    course,
    deadlineDate,
    deadlineTime,
    priority,
    estimatedMinutes,
    subtasks,
    missingInformation: missingInfo,
    warnings,
    confidence: isDateAmbiguous || isPast ? 'low' : isTimeMissing ? 'medium' : 'high',
    sourceSnippet: snippet,
    isDateAmbiguous,
    isTimeMissing,
    isYearInferred,
    isPast,
  };
}

interface DateParseResult {
  date: string;
  time?: string;
  isAmbiguous: boolean;
  isYearInferred: boolean;
  matchedPhrase?: string;
}

function parseDatesFromText(text: string, currentYear: number, todayStr: string): DateParseResult {
  let date = '';
  let time = '';
  let isAmbiguous = false;
  let isYearInferred = false;
  let matchedPhrase = '';

  // 1. Time regex: e.g., "11:59 PM", "11:59pm", "5:00 PM", "5 PM", "midnight", "noon"
  const timeRegex = /\b(?:at|by|before)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  } else if (/\bmidnight\b/i.test(text)) {
    time = '23:59';
  } else if (/\bnoon\b/i.test(text)) {
    time = '12:00';
  }

  // 2. ISO format: 2026-10-29
  const isoMatch = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return { date: `${y}-${m}-${d}`, time, isAmbiguous: false, isYearInferred: false, matchedPhrase: isoMatch[0] };
  }

  // 3. Month Day Year format: "October 29, 2026" or "Oct 29 2026" or "29th October 2026"
  const monthDayYearRegex = /\b(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?|(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s+(\d{4}))?)\b/i;
  const mdyMatch = text.match(monthDayYearRegex);
  if (mdyMatch) {
    let monthName = mdyMatch[1] || mdyMatch[5];
    let dayNum = parseInt(mdyMatch[2] || mdyMatch[4], 10);
    let yearNum = mdyMatch[3] || mdyMatch[6] ? parseInt(mdyMatch[3] || mdyMatch[6], 10) : currentYear;

    if (!mdyMatch[3] && !mdyMatch[6]) {
      isYearInferred = true;
    }

    const monthNum = MONTHS[monthName.toLowerCase()];
    if (monthNum && dayNum >= 1 && dayNum <= 31) {
      date = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return { date, time, isAmbiguous: false, isYearInferred, matchedPhrase: mdyMatch[0] };
    }
  }

  // 4. Relative days: "today", "tonight", "tomorrow", "in X days"
  if (/\b(?:today|tonight)\b/i.test(text)) {
    return { date: todayStr, time: time || '22:00', isAmbiguous: false, isYearInferred: false, matchedPhrase: 'today' };
  }
  if (/\btomorrow\b/i.test(text)) {
    return { date: addDays(todayStr, 1), time, isAmbiguous: false, isYearInferred: false, matchedPhrase: 'tomorrow' };
  }
  const inDaysMatch = text.match(/\bin\s+(\d+)\s+days?\b/i);
  if (inDaysMatch) {
    const daysToAdd = parseInt(inDaysMatch[1], 10);
    return { date: addDays(todayStr, daysToAdd), time, isAmbiguous: true, isYearInferred: false, matchedPhrase: inDaysMatch[0] };
  }

  // 5. Day of the week: "this Friday", "by Friday", "on Saturday", "Sunday evening"
  const dowRegex = /\b(?:this\s+|next\s+|by\s+|on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/i;
  const dowMatch = text.match(dowRegex);
  if (dowMatch) {
    const targetDayName = dowMatch[1].toLowerCase();
    const targetDayIndex = DAYS_OF_WEEK[targetDayName];
    if (targetDayIndex !== undefined) {
      const todayDate = new Date();
      const currentDayIndex = todayDate.getDay();
      let diff = targetDayIndex - currentDayIndex;
      if (diff <= 0) {
        diff += 7; // Nearest upcoming that day
      }
      // If user typed "this Friday" and today is Tuesday, diff is 3
      date = addDays(todayStr, diff);
      isAmbiguous = true;
      matchedPhrase = dowMatch[0];
      return { date, time, isAmbiguous, isYearInferred: true, matchedPhrase };
    }
  }

  return { date: '', time, isAmbiguous: true, isYearInferred: false };
}

function detectPriority(text: string): TaskPriority {
  const lower = text.toLowerCase();
  if (/urgent|asap|critical|immediate|mandatory|final exam|penalty|zero tolerance/i.test(lower)) {
    return 'urgent';
  }
  if (/important|graded|high priority|midterm|project submission|weightage|worth\s+\d+%/i.test(lower)) {
    return 'high';
  }
  if (/optional|bonus|extra credit|ungraded|recommended/i.test(lower)) {
    return 'low';
  }
  return 'medium';
}

function detectCourse(text: string): string | undefined {
  // Course codes like CS 101, CS4803, MATH 201, BIO-100, CSE 302, DBMS
  const match = text.match(/\b([A-Z]{2,4}\s*[-]?\s*\d{3,4}[A-Z]?)\b/i);
  if (match) return match[1].toUpperCase();

  if (/\b(DBMS|DSA|ML|AI|OS|OOP|SDLC|Web Dev|Computer Networks)\b/i.test(text)) {
    const topic = text.match(/\b(DBMS|DSA|ML|AI|OS|OOP|SDLC|Web Dev|Computer Networks)\b/i);
    return topic ? topic[1].toUpperCase() : undefined;
  }
  return undefined;
}

function extractTitle(text: string, course?: string): string {
  // First clean leading numbering or words
  const firstSentence = text.split(/[\.\n]/)[0].trim();

  // If starts with "Submit the ... by"
  const submitMatch = firstSentence.match(/(?:submit|complete|finish|prepare|work on)\s+(?:the\s+)?([^,]+?)(?:\s+by|\s+before|\s+at|\.|$)/i);
  if (submitMatch && submitMatch[1].length > 3) {
    let t = cleanTitle(submitMatch[1]);
    return course ? `${course}: ${t}` : t;
  }

  // Look for assignment/project/homework keywords
  const titleKeywordMatch = firstSentence.match(/([^,\.\n]+(?:Assignment|Project|Homework|Exam|Review|Presentation|Submission|Quiz|Report)[^,\.\n]*)/i);
  if (titleKeywordMatch && titleKeywordMatch[1].length > 4) {
    let t = cleanTitle(titleKeywordMatch[1]);
    return course && !t.includes(course) ? `${course}: ${t}` : t;
  }

  // Fallback to first 8 words
  const words = firstSentence.split(/\s+/).slice(0, 7).join(' ');
  const fallbackTitle = cleanTitle(words) || 'Deadline Task';
  return course ? `${course}: ${fallbackTitle}` : fallbackTitle;
}

function extractEffortMinutes(text: string): number {
  // Look for "4 hours", "2.5 hrs", "90 mins"
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (hoursMatch) {
    return Math.round(parseFloat(hoursMatch[1]) * 60);
  }

  const minsMatch = text.match(/(\d+)\s*(?:minutes?|mins?)\b/i);
  if (minsMatch) {
    return parseInt(minsMatch[1], 10);
  }

  // Default heuristic based on text length and subtasks
  if (text.length > 200 || /report|project|model|implementation|train/i.test(text)) {
    return 180; // 3 hours
  }
  return 90; // 1.5 hours default
}

function extractSubtasks(text: string): { title: string; estimatedMinutes: number }[] {
  const subtasks: { title: string; estimatedMinutes: number }[] = [];

  // Check for bullet or numbered list within text
  const listItems = text.match(/(?:^|\n)\s*(?:[0-9]+[\.\)]|[\-\*•])\s+([^\n]+)/g);
  if (listItems && listItems.length > 1) {
    listItems.forEach(item => {
      const clean = item.replace(/(?:^|\n)\s*(?:[0-9]+[\.\)]|[\-\*•])\s+/, '').trim();
      if (clean.length > 3) {
        subtasks.push({
          title: clean,
          estimatedMinutes: 45,
        });
      }
    });
    if (subtasks.length > 0) return subtasks;
  }

  // Action verbs heuristic: Train, evaluate, submit, prepare, draft, test, review
  const actionClauses = text.split(/[,;\n\.]+/).map(s => s.trim()).filter(Boolean);
  const actionRegex = /^(?:Train|Prepare|Implement|Evaluate|Build|Write|Draft|Review|Submit|Test|Design|Analyze|Solve|Finish|Read|Upload)\b/i;

  for (const clause of actionClauses) {
    if (actionRegex.test(clause) && clause.length > 5 && clause.length < 80) {
      subtasks.push({
        title: clause.charAt(0).toUpperCase() + clause.slice(1),
        estimatedMinutes: 45,
      });
    }
  }

  // If no action clauses found, generate standard structured subtasks
  if (subtasks.length === 0) {
    subtasks.push(
      { title: 'Initial research & environment setup', estimatedMinutes: 45 },
      { title: 'Core implementation & problem solving', estimatedMinutes: 60 },
      { title: 'Testing, verification & report synthesis', estimatedMinutes: 45 },
      { title: 'Final proofreading & submission upload', estimatedMinutes: 30 }
    );
  }

  return subtasks;
}
