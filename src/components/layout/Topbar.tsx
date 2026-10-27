import React from 'react';
import { Menu, Search, Sparkles, Zap, RefreshCw, Plus, Globe, Sun, Moon } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';

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
  const { settings, isDemoLoaded, loadDemoData, clearAllData, toggleTheme } = useTasks();
  const { toast } = useToast();

  const env = (import.meta as any).env;
  const isAiActive = (settings.aiProvider !== 'fallback_only' && settings.apiKey.length > 0) || Boolean(env?.VITE_NVIDIA_API_KEY);
  const isDarkMode = settings.theme === 'dark';

  const handleDemoToggle = () => {
    if (isDemoLoaded) {
      clearAllData();
      toast('Demo data cleared. Clean workspace active.', 'info');
    } else {
      loadDemoData();
      toast('Demo assignments loaded with smart preparation blocks!', 'success');
    }
  };

  return (
    <header className="h-16 bg-white/70 dark:bg-obsidian-900/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors shadow-xs">
      {/* Left: Mobile hamburger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl lg:hidden transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search assignments, tags, or prep sessions..."
            className="w-full pl-9 pr-14 py-1.5 bg-slate-50 dark:bg-obsidian-800/80 hover:bg-slate-100/80 dark:hover:bg-obsidian-800 focus:bg-white dark:focus:bg-obsidian-750 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200/80 dark:border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner-light"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
            <kbd className="text-[10px] font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-obsidian-700 border border-slate-200/90 dark:border-white/[0.08] px-1.5 py-0.5 rounded shadow-2xs font-mono">
              Ctrl+K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions, Theme & Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Timezone pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-obsidian-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 border border-transparent dark:border-white/[0.06]">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{settings.timezone.split('/').pop()?.replace('_', ' ') || 'Local Time'}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-obsidian-800 hover:bg-slate-200 dark:hover:bg-obsidian-750 border border-transparent dark:border-white/[0.06] transition-all"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Demo Button */}
        <button
          onClick={handleDemoToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isDemoLoaded
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
              : 'bg-slate-50 dark:bg-obsidian-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-obsidian-750'
          }`}
          title="Toggle Hackathon Demo Sample Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDemoLoaded ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className="hidden sm:inline">{isDemoLoaded ? 'Reset Demo' : 'Demo Mode'}</span>
        </button>

        {/* AI Status Badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
            isAiActive
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
              : 'bg-slate-50 dark:bg-obsidian-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08]'
          }`}
          title={isAiActive ? 'Real AI LLM active via NVIDIA NIM / OpenAI' : 'Deterministic fallback parser active'}
        >
          {isAiActive ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span>AI Mode</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Fallback</span>
            </>
          )}
        </div>

        {/* Persistent Primary CTA in topbar */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Task</span>
        </button>
      </div>
    </header>
  );
};
