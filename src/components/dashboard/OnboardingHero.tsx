import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  MessageSquareText,
  CalendarCheck2,
  X,
  Zap,
  Clock,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

interface OnboardingHeroProps {
  onOpenAddModal: () => void;
}

export const OnboardingHero: React.FC<OnboardingHeroProps> = ({ onOpenAddModal }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('chrono_onboarding_dismissed') === 'true';
  });
  const { loadDemoData, isDemoLoaded } = useTasks();

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('chrono_onboarding_dismissed', 'true');
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-7 shadow-xl border border-indigo-800/40 animate-in fade-in duration-300">
      {/* Background ambient lighting */}
      <div className="absolute -right-16 -top-16 w-72 h-72 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute left-1/3 -bottom-16 w-80 h-40 bg-violet-600/15 blur-3xl rounded-full pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 text-indigo-300/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Dismiss guide"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 space-y-5">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Hack to the Future 2026
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            Proposed Feature Enhancement for <strong className="text-white">Google Calendar</strong>
          </span>
        </div>

        {/* Value Proposition Headline */}
        <div className="max-w-2xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Don't just remember your deadlines.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Know exactly how to prepare for them.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-2 leading-relaxed">
            Students receive deadlines in messy emails and announcements. ChronoAI extracts every requirement,
            identifies missing constraints, and builds an automatic backward preparation schedule.
          </p>
        </div>

        {/* 3-Step Visual Workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-indigo-400" /> Paste Raw Notice
              </div>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                Copy syllabus, assignment email, or Slack prompt.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> AI Decodes Intent
              </div>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                Extracts dates, effort, and breaks down subtasks.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Backward Plan
              </div>
              <p className="text-[11px] text-indigo-200/70 mt-0.5">
                Schedules spaced prep blocks on your calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>+ Paste Your First Deadline</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isDemoLoaded && (
            <button
              onClick={loadDemoData}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-indigo-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              Or load sample college assignments →
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="text-xs text-indigo-300/80 hover:text-white ml-auto underline underline-offset-4"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
};
