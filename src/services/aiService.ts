import { ExtractedTaskCandidate, InboxItem, UserSettings, TaskPriority } from '../types/task';
import { parseTextDeterministic } from './taskParser';
import { getTodayString, parseDateSafe } from '../utils/dateUtils';

export interface AIParseResponse {
  tasks: ExtractedTaskCandidate[];
  parserMode: 'ai' | 'fallback';
  modelUsed?: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are ChronoAI's deadline intelligence engine.
Your mission is to extract structured tasks and deadlines from unstructured messages, assignment announcements, syllabi, or emails.

CRITICAL INSTRUCTIONS:
1. Return strictly valid JSON with no markdown formatting around it (do not wrap in \`\`\`json blocks).
2. Return an object matching this JSON schema:
{
  "tasks": [
    {
      "title": string,
      "description": string,
      "course": string or null,
      "deadlineDate": "YYYY-MM-DD",
      "deadlineTime": "HH:MM" (24-hour format, or null if not specified),
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedMinutes": number,
      "subtasks": [
        {
          "title": string,
          "estimatedMinutes": number
        }
      ],
      "missingInformation": string[],
      "warnings": string[],
      "confidence": "high" | "medium" | "low",
      "isDateAmbiguous": boolean,
      "isTimeMissing": boolean,
      "isYearInferred": boolean
    }
  ]
}

DATE RULES:
- Never silently invent dates or times.
- If the year is missing, infer the current year (assume current year is ${new Date().getFullYear()}) and add a note in missingInformation.
- If date is ambiguous (e.g. "by Friday"), set isDateAmbiguous: true and add a warning.
- If time is missing, set deadlineTime: null, isTimeMissing: true, and add a note in missingInformation.
- If the deadline is in the past relative to today (${getTodayString()}), add a warning.
- If multiple tasks are described, return an element for each task in the tasks array.`;

export async function extractTasksFromText(
  rawText: string,
  settings: UserSettings
): Promise<AIParseResponse> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { tasks: [], parserMode: 'fallback' };
  }

  // Check if user has an AI key configured and is not fallback_only
  const env = (import.meta as any).env;
  const apiKey = settings.apiKey.trim() || (env?.VITE_NVIDIA_API_KEY as string | undefined) || '';
  const canUseAI = settings.aiProvider !== 'fallback_only' && apiKey.length > 0;

  if (!canUseAI) {
    // Honest deterministic fallback
    const result = parseTextDeterministic(trimmed);
    return {
      tasks: result.tasks,
      parserMode: 'fallback',
    };
  }

  // Attempt real AI call
  try {
    const endpoint = getEndpoint(settings);
    const model = settings.modelName || 'meta/llama-3.1-70b-instruct';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: trimmed },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('AI API responded with error status:', response.status, errText);
      const fallback = parseTextDeterministic(trimmed);
      return {
        tasks: fallback.tasks,
        parserMode: 'fallback',
        error: `AI call failed (HTTP ${response.status}). Switched to local deterministic parser.`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from model');
    }

    // Sanitize and parse JSON
    const cleanJson = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      throw new Error('Model response did not contain a tasks array');
    }

    const validatedTasks: ExtractedTaskCandidate[] = parsed.tasks.map((t: any, idx: number) => {
      const subtasks = Array.isArray(t.subtasks)
        ? t.subtasks.map((st: any) => ({
            title: String(st.title || 'Step'),
            estimatedMinutes: Number(st.estimatedMinutes) || 45,
          }))
        : [];

      const rawDate = String(t.deadlineDate || '');
      const validDate = parseDateSafe(rawDate) ? rawDate : getTodayString();
      const priority: TaskPriority = ['low', 'medium', 'high', 'urgent'].includes(t.priority)
        ? t.priority
        : 'medium';

      return {
        id: `ai-extracted-${Date.now()}-${idx}`,
        title: String(t.title || 'Untitled Deadline').trim(),
        description: String(t.description || trimmed).trim(),
        course: t.course ? String(t.course).trim() : undefined,
        deadlineDate: validDate,
        deadlineTime: t.deadlineTime ? String(t.deadlineTime) : '23:59',
        priority,
        estimatedMinutes: Number(t.estimatedMinutes) || 120,
        subtasks: subtasks.length > 0 ? subtasks : [
          { title: 'Initial preparation', estimatedMinutes: 45 },
          { title: 'Main deliverable development', estimatedMinutes: 60 },
          { title: 'Review and submission', estimatedMinutes: 30 },
        ],
        missingInformation: Array.isArray(t.missingInformation) ? t.missingInformation : [],
        warnings: Array.isArray(t.warnings) ? t.warnings : [],
        confidence: ['high', 'medium', 'low'].includes(t.confidence) ? t.confidence : 'high',
        sourceSnippet: trimmed,
        isDateAmbiguous: Boolean(t.isDateAmbiguous),
        isTimeMissing: Boolean(t.isTimeMissing),
        isYearInferred: Boolean(t.isYearInferred),
      };
    });

    return {
      tasks: validatedTasks,
      parserMode: 'ai',
      modelUsed: model,
    };
  } catch (err: any) {
    console.error('Error invoking AI service:', err);
    const fallback = parseTextDeterministic(trimmed);
    return {
      tasks: fallback.tasks,
      parserMode: 'fallback',
      error: `AI parsing failed (${err.message || 'Network error'}). Switched to local deterministic parser.`,
    };
  }
}

function getEndpoint(settings: UserSettings): string {
  if (settings.aiProvider === 'openai') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  if (settings.aiProvider === 'nvidia') {
    return 'https://integrate.api.nvidia.com/v1/chat/completions';
  }
  if (settings.apiEndpoint) {
    return settings.apiEndpoint.endsWith('/chat/completions')
      ? settings.apiEndpoint
      : `${settings.apiEndpoint.replace(/\/+$/, '')}/chat/completions`;
  }
  return 'https://integrate.api.nvidia.com/v1/chat/completions';
}

export async function testAIConnection(settings: UserSettings): Promise<{ success: boolean; message: string }> {
  const apiKey = settings.apiKey.trim();
  if (!apiKey) {
    return { success: false, message: 'Please provide an API key first.' };
  }

  try {
    const endpoint = getEndpoint(settings);
    const model = settings.modelName || 'meta/llama-3.1-70b-instruct';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "pong"' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { success: true, message: `Connected successfully to ${model}!` };
    } else {
      const errText = await response.text();
      return { success: false, message: `API Error ${response.status}: ${errText.slice(0, 100)}` };
    }
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message || 'Network error'}` };
  }
}
