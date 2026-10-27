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
  ChevronRight,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { extractTasksFromText } from '../../services/aiService';
import { generatePreparationPlan } from '../../services/planningService';
import { ExtractedTaskCandidate, TaskPriority, PlanningStrategy } from '../../types/task';
import { formatTime12h, getTodayString } from '../../utils/dateUtils';

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

    // Validate that dates are provided
    for (const c of extractedCandidates) {
      if (!c.deadlineDate) {
        warning(`Please provide a valid deadline date for "${c.title}"`);
        return;
      }
    }

    // Save to AI Inbox for tracking history
    addInboxItem({
      originalText: rawText,
      extractedTaskCandidates: extractedCandidates,
      status: 'scheduled',
      parserMode,
      modelUsed,
    });

    // Create tasks with preparation plans
    for (const c of extractedCandidates) {
      const subtasks = c.subtasks.map((st, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: st.title,
        estimatedMinutes: st.estimatedMinutes || 45,
        completed: false,
      }));

      // Generate backward preparation plan
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {extractedCandidates ? 'Review & Plan Schedule' : 'Add Task from Text'}
                </h2>
                {parserMode === 'ai' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> AI Powered ({modelUsed || 'LLM'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Zap className="w-3 h-3 text-amber-600" /> Deterministic Rule Parser (Fallback)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {extractedCandidates
                  ? 'Inspect extracted dates, customize subtasks, and verify the backward preparation plan.'
                  : 'Paste an assignment email, syllabus deadline, or Slack message.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
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
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Quick Examples (Click to insert)
                </label>
                <div className="flex flex-wrap gap-2">
                  {sampleMessages.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawText(sample.text)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200/80 transition-all text-left"
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
                  className="w-full p-4 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans leading-relaxed resize-y"
                  disabled={isProcessing}
                />
                <div className="absolute right-3 bottom-3 text-xs text-slate-400 font-mono">
                  {rawText.length} chars
                </div>
              </div>

              {/* Live Intelligence Pipeline Indicator */}
              {isProcessing && (
                <div className="p-4 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                      Deconstructing Assignment Requirements
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 font-semibold">{loadingStep.slice(0, 3)}</span>
                  </div>
                  <div className="text-xs text-indigo-900 font-semibold flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{loadingStep.slice(4)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-indigo-200/70 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-pulse transition-all duration-300 w-4/5" />
                  </div>
                </div>
              )}

              {/* Mode indicator banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
                {isAiActive ? (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Live AI Extraction Ready: </span>
                      Configured with model <span className="font-mono text-indigo-700">{settings.modelName || 'LLM'}</span>.
                      Will parse complex context, dates, subtasks, and effort.
                    </div>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Deterministic Fallback Active: </span>
                      No API key is configured. ChronoAI uses built-in regex & natural language date heuristics.
                      (To enable live LLM, configure an API key in <span className="font-semibold text-indigo-600">Settings</span>).
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Review & Edit Extracted Tasks View */
            <div className="space-y-6">
              {/* Planning strategy picker */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Preparation Strategy
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Choose how ChronoAI schedules preparation sessions backward from the deadline.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200/60 shadow-xs">
                  <button
                    onClick={() => setPlanningStrategy('standard')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      planningStrategy === 'standard'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Standard (Spaced)
                  </button>
                  <button
                    onClick={() => setPlanningStrategy('early_bird')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      planningStrategy === 'early_bird'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Early Bird (-1 Day)
                  </button>
                  <button
                    onClick={() => setPlanningStrategy('intensive')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      planningStrategy === 'intensive'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                    className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Top Row: Title, Course, and Delete Candidate */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={candidate.course || ''}
                            onChange={e => handleCandidateChange(candIdx, 'course', e.target.value)}
                            placeholder="Course / Category (e.g. CS 4803)"
                            className="w-36 text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500"
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
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none ${
                              candidate.priority === 'urgent'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : candidate.priority === 'high'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : candidate.priority === 'low'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
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
                          className="w-full text-base font-bold text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-50 focus:bg-white border border-transparent focus:border-indigo-500 focus:outline-none transition-all"
                        />
                      </div>

                      {extractedCandidates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(candIdx)}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove this extracted task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Deadline Date, Time & Effort Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline Date
                        </label>
                        <input
                          type="date"
                          value={candidate.deadlineDate}
                          onChange={e =>
                            handleCandidateChange(candIdx, 'deadlineDate', e.target.value)
                          }
                          className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline Time
                        </label>
                        <input
                          type="time"
                          value={candidate.deadlineTime}
                          onChange={e =>
                            handleCandidateChange(candIdx, 'deadlineTime', e.target.value)
                          }
                          className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
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
                            className="w-full text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-500 font-medium">mins</span>
                        </div>
                      </div>
                    </div>

                    {/* Ambiguity or Warning Alerts */}
                    {(candidate.warnings.length > 0 || candidate.missingInformation.length > 0) && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Detected Ambiguities / Missing Info:</span>
                        </div>
                        <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
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
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                          Preparation Subtasks ({candidate.subtasks.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddSubtask(candIdx)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Step
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {candidate.subtasks.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group hover:bg-slate-100/70 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
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
                              className="flex-1 text-xs text-slate-800 bg-transparent focus:bg-white px-2 py-0.5 rounded border border-transparent focus:border-slate-300 focus:outline-none"
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
                                className="w-14 text-[11px] font-medium text-slate-700 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-center focus:outline-none"
                              />
                              <span className="text-[11px] text-slate-400">m</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtask(candIdx, sIdx)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-all"
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
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          {!extractedCandidates ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing || !rawText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-sm shadow-indigo-600/25 transition-all"
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
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ← Back to Edit Text
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-sm shadow-emerald-600/25 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Create Plan</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
