import React from 'react';
import { Menu, Search, Sparkles, Zap, RefreshCw, Plus, Globe } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { formatTime12h, getCurrentTimeString } from '../../utils/dateUtils';

interface TopbarProps {
  onOpenAddModal: () => void;
  onToggleMobileSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenAddModal,
  onToggleMobileSidebar,
  searchQuery,
  setSearchQuery,
}) => {
  const { settings, isDemoLoaded, loadDemoData, clearAllData } = useTasks();
  const { toast } = useToast();

  const isAiActive = settings.aiProvider !== 'fallback_only' && settings.apiKey.length > 0;

  const handleDemoToggle = () => {
    if (isDemoLoaded) {
      clearAllData();
      toast('Demo data cleared. Switched to clean workspace.', 'info');
    } else {
      loadDemoData();
      toast('Demo sample assignments loaded successfully!', 'success');
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assignments, tags, or prep sessions..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions & Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Timezone pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{settings.timezone.split('/').pop()?.replace('_', ' ') || 'Local Time'}</span>
        </div>

        {/* Demo Button */}
        <button
          onClick={handleDemoToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isDemoLoaded
              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Toggle Hackathon Demo Sample Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDemoLoaded ? 'text-amber-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">{isDemoLoaded ? 'Reset Demo Data' : 'Try Demo Mode'}</span>
          <span className="sm:hidden">{isDemoLoaded ? 'Reset' : 'Demo'}</span>
        </button>

        {/* AI Status Badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            isAiActive
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
          title={isAiActive ? 'Real AI LLM active' : 'Deterministic rule-based fallback active (offline friendly)'}
        >
          {isAiActive ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>AI Mode</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Fallback Mode</span>
            </>
          )}
        </div>

        {/* Persistent Primary CTA in topbar */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Task</span>
        </button>
      </div>
    </header>
  );
};
