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
  Zap,
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
  const { stats, inbox, settings, isDemoLoaded } = useTasks();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: stats.dueToday > 0 ? `${stats.dueToday} today` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'calendar',
      label: 'Interactive Calendar',
      icon: Calendar,
      badge: stats.upcomingTasks.length > 0 ? `${stats.upcomingTasks.length}` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'inbox',
      label: 'AI Inbox',
      icon: Sparkles,
      badge: inbox.length > 0 ? `${inbox.length}` : undefined,
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'plans',
      label: 'Preparation Plans',
      icon: ListTodo,
      badge: stats.todaySessions.length > 0 ? `${stats.todaySessions.length} active` : undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'completed',
      label: 'Completed Tasks',
      icon: CheckCircle,
      badge: stats.totalCompleted > 0 ? `${stats.totalCompleted}` : undefined,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  const isAiActive = settings.aiProvider !== 'fallback_only' && settings.apiKey.length > 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Chrono<span className="text-indigo-600">AI</span></span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                  Concept
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">Google Calendar Intelligence</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onOpenAddModal();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl shadow-sm shadow-indigo-600/25 transition-all group"
          >
            <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
            <span>+ Add from Text</span>
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-600 stroke-[2.2]' : 'text-slate-400 stroke-[1.8]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status & Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-xs mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500">Engine Status</span>
              {isAiActive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> AI Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Zap className="w-3 h-3 text-amber-500" /> Fallback Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isAiActive
                ? `Connected to ${settings.modelName || 'LLM'}`
                : 'Deterministic regex & natural date parser active.'}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Hack to the Future 2026</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
