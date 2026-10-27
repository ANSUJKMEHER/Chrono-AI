import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  ListTodo,
  CheckCircle,
  Settings,
  Plus,
  Clock,
  User,
  ChevronsUpDown,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { stats, inbox, settings } = useTasks();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: stats.dueToday > 0 ? `${stats.dueToday}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    },
    {
      id: 'calendar',
      label: 'Interactive Calendar',
      icon: Calendar,
      badge: stats.upcomingTasks.length > 0 ? `${stats.upcomingTasks.length}` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    },
    {
      id: 'inbox',
      label: 'AI Inbox',
      icon: Sparkles,
      badge: inbox.length > 0 ? `${inbox.length}` : undefined,
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
    },
    {
      id: 'plans',
      label: 'Preparation Plans',
      icon: ListTodo,
      badge: stats.todaySessions.length > 0 ? `${stats.todaySessions.length}` : '1',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    },
    {
      id: 'completed',
      label: 'Completed Tasks',
      icon: CheckCircle,
      badge: stats.totalCompleted > 0 ? `${stats.totalCompleted}` : '1',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
    {
      id: 'settings',
      label: 'Settings & Preferences',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  const env = (import.meta as any).env;
  const hasEnvKey = Boolean(env?.VITE_NVIDIA_API_KEY);
  const isAiActive = (settings.aiProvider !== 'fallback_only' && settings.apiKey.length > 0) || hasEnvKey;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/85 dark:bg-obsidian-900/85 backdrop-blur-xl border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Chrono<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button with ⌘N badge */}
        <div className="p-4">
          <button
            onClick={() => {
              onOpenAddModal();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-between py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/25 border border-indigo-500/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              <span>Add from Text</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white/90">
              ⌘N
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border dark:border-indigo-500/25 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.2]'
                        : 'text-slate-400 dark:text-slate-500 stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full whitespace-nowrap shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Engine Status Card (Matching Reference Design) */}
        <div className="p-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-obsidian-950/50 space-y-2">
          {/* Parser Engine Pill */}
          <div className="flex items-center justify-between px-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAiActive ? 'NVIDIA Nemotron Live' : 'Local Parser'}</span>
            </div>
            <span className="text-slate-400 dark:text-slate-500">18ms</span>
          </div>

          {/* Student Profile Selector Box */}
          <div className="p-2 bg-white dark:bg-obsidian-850 rounded-xl border border-slate-200/70 dark:border-white/[0.08] shadow-xs flex items-center justify-between group cursor-pointer hover:border-slate-300 dark:hover:border-white/[0.15] transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  Student Profile
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">
                  cs-major@univ.edu
                </div>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
