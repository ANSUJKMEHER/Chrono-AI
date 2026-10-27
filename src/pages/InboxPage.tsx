import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useToast } from '../components/common/Toast';
import { InboxItem, ExtractedTaskCandidate } from '../types/task';
import { formatFriendlyDate } from '../utils/dateUtils';
import { DeadlineInputModal } from '../components/ai/DeadlineInputModal';

interface InboxPageProps {
  onOpenAddModal: () => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({ onOpenAddModal }) => {
  const { inbox, deleteInboxItem } = useTasks();
  const { info } = useToast();
  const [reopenText, setReopenText] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteInboxItem(id);
    info('Inbox item removed.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            AI Extraction Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            History of raw announcements, extracted candidates, and parser engine execution logs
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Process New Text</span>
        </button>
      </div>

      {/* Inbox Items List */}
      {inbox.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Inbox is empty</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Whenever you paste an assignment description or announcement, the raw text and extraction candidate log will be stored here.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Extract First Announcement</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {inbox.map((item: InboxItem) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-obsidian-900 rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-2xs space-y-4 hover:border-slate-300 dark:hover:border-white/[0.15] transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      item.status === 'scheduled'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                        : item.status === 'ready_to_approve'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                        : item.status === 'dismissed'
                        ? 'bg-slate-100 dark:bg-obsidian-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.06]'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>

                  {item.parserMode === 'ai' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60">
                      <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> AI LLM ({item.modelUsed || 'Model'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                      <Zap className="w-3 h-3 text-amber-600" /> Deterministic Rule Parser
                    </span>
                  )}

                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReopenText(item.originalText)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
                    title="Re-open and re-extract"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Source Text Box */}
              <div className="p-3.5 bg-slate-50 dark:bg-obsidian-850 rounded-2xl border border-slate-200 dark:border-white/[0.06] text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed max-h-28 overflow-y-auto">
                {item.originalText}
              </div>

              {/* Extracted Tasks Candidates */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Extracted Candidates ({item.extractedTaskCandidates.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {item.extractedTaskCandidates.map((cand: ExtractedTaskCandidate, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50/70 dark:bg-obsidian-850 border border-slate-200 dark:border-white/[0.06] rounded-2xl text-xs space-y-1.5"
                    >
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span className="truncate">{cand.title}</span>
                        <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-obsidian-750 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded">
                          {cand.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>Due: {formatFriendlyDate(cand.deadlineDate, cand.deadlineTime)}</span>
                        <span>•</span>
                        <span>{cand.subtasks.length} subtasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for reopening text */}
      {reopenText && (
        <DeadlineInputModal
          isOpen={Boolean(reopenText)}
          onClose={() => setReopenText(null)}
          initialText={reopenText}
        />
      )}
    </div>
  );
};
