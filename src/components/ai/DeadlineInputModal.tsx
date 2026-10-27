import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { extractTasksFromText } from '../../services/aiService';
import { generatePreparationPlan } from '../../services/planningService';
import { ExtractedTaskCandidate, TaskPriority, PlanningStrategy } from '../../types/task';
import confetti from 'canvas-confetti';

interface DeadlineInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
}

export const DeadlineInputModal: React.FC<DeadlineInputModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
}) => {
  const { settings, createTask, addInboxItem, tasks } = useTasks();
  const { success, warning, error } = useToast();

  const [rawText, setRawText] = useState(initialText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [extractedCandidates, setExtractedCandidates] = useState<ExtractedTaskCandidate[] | null>(null);
  const [parserMode, setParserMode] = useState<'ai' | 'fallback'>('fallback');
  const [modelUsed, setModelUsed] = useState<string | undefined>(undefined);
  const [planningStrategy, setPlanningStrategy] = useState<PlanningStrategy>(settings.planningStrategy || 'standard');

  if (!isOpen) return null;

  const sampleMessages = [
    {
      label: 'ML Assignment (Detailed)',
      text: 'Submit the machine learning assignment by October 29, 2026, at 11:59 PM. Train a CNN model, evaluate its performance, and submit a report with screenshots. The final report must be uploaded before the deadline.',
    },
    {
      label: 'Multi-Task Notice (3 Deadlines)',
      text: 'Submit the DBMS assignment by Friday, attend the project review on Saturday, and finish the DSA practice sheet by Sunday evening.',
    },
    {
      label: 'Urgent Project (Tomorrow)',
      text: 'Important: CS 3200 final database benchmark report is due tomorrow by 5:00 PM. Analyze EXPLAIN cost outputs, write comparison graphs, and submit 5-page PDF.',
    },
  ];

  const handleExtract = async () => {
    if (!rawText.trim()) {
      warning('Please enter or paste an assignment message first.');
      return;
    }

    setIsProcessing(true);
    setLoadingStep('1/4 Scanning natural language & deadline syntax...');

    const timer1 = setTimeout(() => {
      setLoadingStep('2/4 Identifying courses, priorities & subtasks...');
    }, 400);

    const timer2 = setTimeout(() => {
      setLoadingStep('3/4 Detecting dates & resolving ambiguities...');
    }, 800);

    const timer3 = setTimeout(() => {
      setLoadingStep('4/4 Synthesizing backward preparation plan...');
    }, 1200);

    try {
      const response = await extractTasksFromText(rawText, settings);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setExtractedCandidates(response.tasks);
      setParserMode(response.parserMode);
      setModelUsed(response.modelUsed);

      if (response.error) {
        warning(response.error);
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      error(`Extraction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCandidateChange = (
    index: number,
    field: keyof ExtractedTaskCandidate,
    value: any
  ) => {
    if (!extractedCandidates) return;
    const updated = [...extractedCandidates];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedCandidates(updated);
  };

  const handleSubtaskChange = (
    candIndex: number,
    subtaskIndex: number,
    title: string,
    estimatedMinutes: number
  ) => {
    if (!extractedCandidates) return;
    const updated = [...extractedCandidates];
    const subtasks = [...updated[candIndex].subtasks];
    subtasks[subtaskIndex] = { title, estimatedMinutes };
    updated[candIndex].subtasks = subtasks;
    setExtractedCandidates(updated);
  };

  const handleAddSubtask = (candIndex: number) => {
    if (!extractedCandidates) return;
    const updated = [...extractedCandidates];
    updated[candIndex].subtasks.push({
      title: 'New preparation step',
      estimatedMinutes: 45,
    });
    setExtractedCandidates(updated);
  };

  const handleRemoveSubtask = (candIndex: number, subtaskIndex: number) => {
    if (!extractedCandidates) return;
    const updated = [...extractedCandidates];
    updated[candIndex].subtasks.splice(subtaskIndex, 1);
    setExtractedCandidates(updated);
  };

  const handleRemoveCandidate = (index: number) => {
    if (!extractedCandidates) return;
    const updated = [...extractedCandidates];
    updated.splice(index, 1);
    if (updated.length === 0) {
      setExtractedCandidates(null);
    } else {
      setExtractedCandidates(updated);
    }
  };

  const handleApproveAll = () => {
    if (!extractedCandidates || extractedCandidates.length === 0) return;

    for (const c of extractedCandidates) {
      if (!c.deadlineDate) {
        warning(`Please provide a valid deadline date for "${c.title}"`);
        return;
      }
    }

    addInboxItem({
      originalText: rawText,
      extractedTaskCandidates: extractedCandidates,
      status: 'scheduled',
      parserMode,
      modelUsed,
    });

    for (const c of extractedCandidates) {
      const subtasks = c.subtasks.map((st, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: st.title,
        estimatedMinutes: st.estimatedMinutes || 45,
        completed: false,
      }));

      const plan = generatePreparationPlan(
        {
          id: `task-${Date.now()}`,
          title: c.title,
          deadlineDate: c.deadlineDate,
          deadlineTime: c.deadlineTime,
          subtasks,
          estimatedMinutes: c.estimatedMinutes,
        },
        tasks,
        settings,
        planningStrategy
      );

      createTask({
        title: c.title,
        description: c.description,
        course: c.course,
        deadlineDate: c.deadlineDate,
        deadlineTime: c.deadlineTime || '23:59',
        priority: c.priority,
        estimatedMinutes: c.estimatedMinutes || 120,
        status: 'upcoming',
        subtasks,
        preparationSessions: plan.sessions,
        sourceText: rawText,
        confidenceScore: c.confidence === 'high' ? 0.95 : c.confidence === 'medium' ? 0.8 : 0.6,
        isPastDeadline: c.isPast,
        ambiguityNotes: [...c.missingInformation, ...c.warnings, ...plan.warnings],
        extractionSource: parserMode,
      });
    }

    // Joyful celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    success(
      `Successfully created ${extractedCandidates.length} task${
        extractedCandidates.length > 1 ? 's' : ''
      } with smart preparation schedules!`
    );
    onClose();
  };

  const env = (import.meta as any).env;
  const isAiActive = (settings.aiProvider !== 'fallback_only' && settings.apiKey.length > 0) || Boolean(env?.VITE_NVIDIA_API_KEY);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-obsidian-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/[0.12] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/60 dark:bg-obsidian-850/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {extractedCandidates ? 'Review & Plan Schedule' : 'Add Task from Text'}
                </h2>
                {parserMode === 'ai' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> AI Powered ({modelUsed || 'LLM'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                    <Zap className="w-3 h-3 text-amber-500" /> Deterministic Rule Parser
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {extractedCandidates
                  ? 'Inspect extracted dates, customize subtasks, and verify the backward preparation plan.'
                  : 'Paste an assignment email, syllabus deadline, or announcement.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!extractedCandidates ? (
            /* Input View */
            <div className="space-y-4">
              {/* Sample Prompts */}
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Examples (Click to insert)
                </label>
                <div className="flex flex-wrap gap-2">
                  {sampleMessages.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawText(sample.text)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-obsidian-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200/80 dark:border-white/[0.06] transition-all text-left"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiline textarea */}
              <div className="relative">
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste an assignment announcement, email, syllabus snippet, or message containing your deadlines..."
                  rows={7}
                  className="w-full p-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-slate-50/50 dark:bg-obsidian-850/60 hover:bg-slate-50 dark:hover:bg-obsidian-850 focus:bg-white dark:focus:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
                  disabled={isProcessing}
                />
                <div className="absolute right-3.5 bottom-3.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {rawText.length} chars
                </div>
              </div>

              {/* Live Intelligence Pipeline Indicator */}
              {isProcessing && (
                <div className="p-4 bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                      Deconstructing Assignment Requirements
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold">{loadingStep.slice(0, 3)}</span>
                  </div>
                  <div className="text-xs text-indigo-900 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>{loadingStep.slice(4)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-indigo-200/70 dark:bg-indigo-900/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-pulse transition-all duration-300 w-4/5" />
                  </div>
                </div>
              )}

              {/* Mode indicator banner */}
              <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                {isAiActive ? (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Live AI Extraction Ready: </span>
                      Configured with model <span className="font-mono text-indigo-700 dark:text-indigo-300">{settings.modelName || 'LLM'}</span>.
                      Will parse complex context, dates, subtasks, and effort.
                    </div>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Deterministic Fallback Active: </span>
                      No API key is configured. ChronoAI uses built-in regex & natural language date heuristics.
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Review & Edit Extracted Tasks View */
            <div className="space-y-6">
              {/* Planning strategy picker */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                      Preparation Strategy
                    </h4>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300">
                      Choose how ChronoAI schedules preparation sessions backward from the deadline.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-obsidian-800 p-1 rounded-xl border border-indigo-200/60 dark:border-white/[0.08] shadow-xs">
                  <button
                    onClick={() => setPlanningStrategy('standard')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      planningStrategy === 'standard'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Standard (Spaced)
                  </button>
                  <button
                    onClick={() => setPlanningStrategy('early_bird')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      planningStrategy === 'early_bird'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Early Bird (-1 Day)
                  </button>
                  <button
                    onClick={() => setPlanningStrategy('intensive')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      planningStrategy === 'intensive'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Intensive (48h)
                  </button>
                </div>
              </div>

              {/* Task Candidate Cards */}
              <div className="space-y-5">
                {extractedCandidates.map((candidate, candIdx) => (
                  <div
                    key={candidate.id}
                    className="p-5 bg-white dark:bg-obsidian-850 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm space-y-4 transition-all"
                  >
                    {/* Top Row: Title, Course, and Delete Candidate */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={candidate.course || ''}
                            onChange={e => handleCandidateChange(candIdx, 'course', e.target.value)}
                            placeholder="Course / Category"
                            className="w-36 text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                          <select
                            value={candidate.priority}
                            onChange={e =>
                              handleCandidateChange(
                                candIdx,
                                'priority',
                                e.target.value as TaskPriority
                              )
                            }
                            className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none ${
                              candidate.priority === 'urgent'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                                : candidate.priority === 'high'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                                : candidate.priority === 'low'
                                ? 'bg-slate-100 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                            }`}
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>

                        <input
                          type="text"
                          value={candidate.title}
                          onChange={e => handleCandidateChange(candIdx, 'title', e.target.value)}
                          placeholder="Assignment Title"
                          className="w-full text-base font-bold text-slate-900 dark:text-white px-2 py-1 -ml-2 rounded-xl hover:bg-slate-50 dark:hover:bg-obsidian-800 focus:bg-white dark:focus:bg-obsidian-750 border border-transparent focus:border-indigo-500 focus:outline-none transition-all"
                        />
                      </div>

                      {extractedCandidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(candIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                          title="Remove this extracted task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Deadline Date, Time & Effort Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline Date
                        </label>
                        <input
                          type="date"
                          value={candidate.deadlineDate}
                          onChange={e =>
                            handleCandidateChange(candIdx, 'deadlineDate', e.target.value)
                          }
                          className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline Time
                        </label>
                        <input
                          type="time"
                          value={candidate.deadlineTime}
                          onChange={e =>
                            handleCandidateChange(candIdx, 'deadlineTime', e.target.value)
                          }
                          className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1 mb-1">
                          <Sliders className="w-3.5 h-3.5 text-slate-400" /> Estimated Effort
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="15"
                            step="15"
                            value={candidate.estimatedMinutes}
                            onChange={e =>
                              handleCandidateChange(
                                candIdx,
                                'estimatedMinutes',
                                parseInt(e.target.value, 10) || 60
                              )
                            }
                            className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-obsidian-800 border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-obsidian-750 focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">mins</span>
                        </div>
                      </div>
                    </div>

                    {/* Ambiguity or Warning Alerts */}
                    {(candidate.warnings.length > 0 || candidate.missingInformation.length > 0) && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Detected Ambiguities / Missing Info:</span>
                        </div>
                        <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc list-inside space-y-0.5">
                          {candidate.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                          {candidate.missingInformation.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Subtasks Section */}
                    <div className="border-t border-slate-100 dark:border-white/[0.06] pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Preparation Subtasks ({candidate.subtasks.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddSubtask(candIdx)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Step
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {candidate.subtasks.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-obsidian-800 rounded-xl group hover:bg-slate-100/70 dark:hover:bg-obsidian-750 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-white dark:bg-obsidian-700 border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {sIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={st.title}
                              onChange={e =>
                                handleSubtaskChange(
                                  candIdx,
                                  sIdx,
                                  e.target.value,
                                  st.estimatedMinutes
                                )
                              }
                              className="flex-1 text-xs text-slate-800 dark:text-slate-200 bg-transparent focus:bg-white dark:focus:bg-obsidian-700 px-2 py-0.5 rounded-lg border border-transparent focus:border-slate-300 dark:focus:border-white/[0.1] focus:outline-none"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="10"
                                step="10"
                                value={st.estimatedMinutes}
                                onChange={e =>
                                  handleSubtaskChange(
                                    candIdx,
                                    sIdx,
                                    st.title,
                                    parseInt(e.target.value, 10) || 45
                                  )
                                }
                                className="w-14 text-[11px] font-medium text-slate-700 dark:text-slate-200 px-1.5 py-0.5 bg-white dark:bg-obsidian-700 border border-slate-200 dark:border-white/[0.08] rounded-lg text-center focus:outline-none"
                              />
                              <span className="text-[11px] text-slate-400">m</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtask(candIdx, sIdx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-obsidian-850/70 flex items-center justify-between gap-3">
          {!extractedCandidates ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing || !rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-sm shadow-indigo-600/25 transition-all"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{loadingStep || 'Extracting Deadlines...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Deadlines & Plan</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExtractedCandidates(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
              >
                ← Back to Edit Text
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm shadow-emerald-600/25 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Add to Calendar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
