import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Trash2,
  Edit2,
  Sparkles,
  Zap,
  RotateCcw,
  Check,
  ChevronRight,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Task, TaskPriority, PlanningStrategy } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import {
  formatFriendlyDate,
  formatTime12h,
  getRelativeTimeString,
} from '../../utils/dateUtils';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, onClose }) => {
  const {
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubtask,
    toggleSession,
    regenerateTaskPlan,
  } = useTasks();
  const { success, info } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDesc, setEditedDesc] = useState(task.description);
  const [editedCourse, setEditedCourse] = useState(task.course || '');
  const [editedDate, setEditedDate] = useState(task.deadlineDate);
  const [editedTime, setEditedTime] = useState(task.deadlineTime || '23:59');
  const [editedPriority, setEditedPriority] = useState<TaskPriority>(task.priority);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenOptions, setShowRegenOptions] = useState(false);

  const relative = getRelativeTimeString(task.deadlineDate, task.deadlineTime);
  const completedSubtasksCount = task.subtasks.filter(st => st.completed).length;
  const progressPercent = task.subtasks.length > 0
    ? Math.round((completedSubtasksCount / task.subtasks.length) * 100)
    : task.status === 'completed'
    ? 100
    : 0;

  const handleSaveEdit = () => {
    updateTask(task.id, {
      title: editedTitle.trim() || task.title,
      description: editedDesc,
      course: editedCourse.trim() || undefined,
      deadlineDate: editedDate,
      deadlineTime: editedTime,
      priority: editedPriority,
    });
    setIsEditing(false);
    success('Task details updated.');
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
    info('Task removed.');
  };

  const handleRegenPlan = (strategy: PlanningStrategy) => {
    regenerateTaskPlan(task.id, strategy);
    setShowRegenOptions(false);
    success(`Schedule regenerated using ${strategy.replace('_', ' ')} strategy.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                task.priority === 'urgent'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : task.priority === 'high'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : task.priority === 'low'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              {task.priority} priority
            </span>
            {task.course && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md">
                {task.course}
              </span>
            )}
            {task.extractionSource === 'ai' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3" /> AI Extracted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <Zap className="w-3 h-3 text-amber-500" /> Rule Parser
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Task Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Editing Form */}
          {isEditing ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Edit Task
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  placeholder="Task Title"
                  className="w-full text-sm font-semibold p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  value={editedDesc}
                  onChange={e => setEditedDesc(e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={editedCourse}
                    onChange={e => setEditedCourse(e.target.value)}
                    placeholder="Course"
                    className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <input
                    type="date"
                    value={editedDate}
                    onChange={e => setEditedDate(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <input
                    type="time"
                    value={editedTime}
                    onChange={e => setEditedTime(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <select
                    value={editedPriority}
                    onChange={e => setEditedPriority(e.target.value as TaskPriority)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      task.status === 'completed'
                        ? 'line-through text-slate-400'
                        : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {task.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Status and Countdown Pill */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatFriendlyDate(task.deadlineDate, task.deadlineTime)}</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : relative.isOverdue
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : relative.isUrgent
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {task.status === 'completed' ? 'Completed' : relative.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>Est. {Math.round(task.estimatedMinutes / 60 * 10) / 10}h total</span>
                </div>
              </div>
            </div>
          )}

          {/* Subtasks Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Preparation Checklist ({completedSubtasksCount}/{task.subtasks.length})
              </span>
              <span className="font-semibold text-slate-500">{progressPercent}% done</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : progressPercent > 50
                    ? 'bg-indigo-600'
                    : 'bg-indigo-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Subtask Item List */}
            <div className="space-y-1.5">
              {task.subtasks.map(st => (
                <button
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    st.completed
                      ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-900'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  {st.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={`flex-1 text-xs font-medium ${
                      st.completed ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {st.title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {st.estimatedMinutes}m
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preparation Schedule Sessions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Scheduled Calendar Blocks ({task.preparationSessions?.length || 0})
              </span>
              <button
                onClick={() => setShowRegenOptions(!showRegenOptions)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reschedule Plan
              </button>
            </div>

            {/* Reschedule options picker */}
            {showRegenOptions && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                <p className="text-xs text-indigo-900 font-medium">
                  Select new preparation pacing strategy:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRegenPlan('standard')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Spaced (Balanced)
                  </button>
                  <button
                    onClick={() => handleRegenPlan('early_bird')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Early Bird (-1 day buffer)
                  </button>
                  <button
                    onClick={() => handleRegenPlan('intensive')}
                    className="px-2.5 py-1 text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Intensive (Last 48h)
                  </button>
                </div>
              </div>
            )}

            {/* Sessions List */}
            {task.preparationSessions && task.preparationSessions.length > 0 ? (
              <div className="space-y-2">
                {task.preparationSessions.map(session => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      session.completed
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSession(task.id, session.id)}
                        className="text-slate-400 hover:text-indigo-600"
                        title={session.completed ? 'Mark pending' : 'Mark session done'}
                      >
                        {session.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                      <div>
                        <div
                          className={`font-semibold text-slate-800 ${
                            session.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {session.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{formatFriendlyDate(session.date)}</span>
                          <span>•</span>
                          <span>
                            {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {session.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No preparation blocks scheduled yet. Click Reschedule Plan to generate blocks.
              </div>
            )}
          </div>

          {/* Source Text Snippet */}
          {task.sourceText && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Original Announcement Snippet
              </span>
              <p className="text-slate-600 font-mono text-[11px] leading-relaxed italic">
                "{task.sourceText}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                toggleTaskStatus(task.id);
                onClose();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                task.status === 'completed'
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20'
              }`}
            >
              {task.status === 'completed' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Task
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Mark Task Complete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-sm w-full space-y-3 border border-slate-200">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Task Deletion</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete "{task.title}" and its preparation schedule? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
