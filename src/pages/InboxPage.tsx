import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  Plus,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useToast } from '../components/common/Toast';
import { InboxItem, ExtractedTaskCandidate } from '../types/task';
import { formatFriendlyDate, formatTime12h } from '../utils/dateUtils';
import { DeadlineInputModal } from '../components/ai/DeadlineInputModal';

interface InboxPageProps {
  onOpenAddModal: () => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({ onOpenAddModal }) => {
  const { inbox, deleteInboxItem, updateInboxItem } = useTasks();
  const { info, success } = useToast();
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Extraction Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            History of raw pasted announcements, extracted tasks, and engine logs
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Process New Text</span>
        </button>
      </div>

      {/* Inbox Items List */}
      {inbox.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Inbox is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
              className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      item.status === 'scheduled'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.status === 'ready_to_approve'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : item.status === 'dismissed'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>

                  {item.parserMode === 'ai' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      <Sparkles className="w-3 h-3 text-indigo-500" /> AI LLM ({item.modelUsed || 'Model'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Zap className="w-3 h-3 text-amber-600" /> Deterministic Rule Parser
                    </span>
                  )}

                  <span className="text-xs text-slate-400">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReopenText(item.originalText)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Re-open and re-extract"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Source Text Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed max-h-28 overflow-y-auto">
                {item.originalText}
              </div>

              {/* Extracted Tasks Candidates */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Extracted Candidates ({item.extractedTaskCandidates.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {item.extractedTaskCandidates.map((cand: ExtractedTaskCandidate, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span className="truncate">{cand.title}</span>
                        <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                          {cand.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
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
