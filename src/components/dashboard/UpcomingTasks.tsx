import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { TaskCard } from '../tasks/TaskCard';
import { Task, TaskPriority } from '../../types/task';

interface UpcomingTasksProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
  searchQuery?: string;
}

export const UpcomingTasks: React.FC<UpcomingTasksProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
  searchQuery = '',
}) => {
  const { stats } = useTasks();
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');

  // Filter tasks
  const filteredTasks = stats.upcomingTasks.filter(t => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCourse = t.course?.toLowerCase().includes(q);
      const matchTag = t.tags?.some(tag => tag.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCourse || matchTag;
    }
    return true;
  });

  return (
    <div className="glass-card rounded-3xl p-6 space-y-4 transition-colors">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Upcoming Deadlines ({filteredTasks.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organized chronologically by submission deadline
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                priorityFilter === p
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-obsidian-850 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-obsidian-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 dark:bg-obsidian-850/50 rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No upcoming tasks found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searchQuery
              ? `No assignments match "${searchQuery}".`
              : 'Add your first deadline by pasting an email or announcement.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add from Text</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenDetails={onOpenTaskDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
