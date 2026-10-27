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
  Download,
  Flame,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Task, TaskPriority, PlanningStrategy } from '../../types/task';
import { useTasks } from '../../context/TaskContext';
import { useToast } from '../common/Toast';
import { exportTasksToICS } from '../../utils/icsExport';
import {
  formatFriendlyDate,
  formatTime12h,
  getRelativeTimeString,
  parseDateTime,
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
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0
    ? Math.round((completedSubtasksCount / totalSubtasks) * 100)
    : task.status === 'completed'
    ? 100
    : 0;

  // Danger calculation
  const now = new Date();
  const targetDt = parseDateTime(task.deadlineDate, task.deadlineTime);
  const hoursUntil = targetDt ? (targetDt.getTime() - now.getTime()) / (1000 * 60 * 60) : 999;
  const uncompletedSubtasks = task.subtasks.filter(st => !st.completed);
  const remainingMinutes = uncompletedSubtasks.reduce((acc, st) => acc + (st.estimatedMinutes || 45), 0);
  const remainingEffortHours = remainingMinutes > 0 ? remainingMinutes / 60 : (task.estimatedMinutes || 60) / 60;
  const dangerRatio = hoursUntil > 0 ? remainingEffortHours / hoursUntil : 999;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                task.priority === 'urgent'
                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                  : task.priority === 'high'
                  ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                  : task.priority === 'low'
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  task.priority === 'urgent'
                    ? 'bg-rose-500 animate-pulse'
                    : task.priority === 'high'
                    ? 'bg-amber-500'
                    : task.priority === 'low'
                    ? 'bg-slate-400'
                    : 'bg-indigo-500'
                }`}
              />
              {task.priority} priority
            </span>

            {/* Course Tag */}
            {task.course && (
              <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-slate-200/80 text-slate-700 rounded-lg shadow-3xs">
                {task.course}
              </span>
            )}

            {/* AI Source Tag */}
            {task.extractionSource === 'ai' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/90 border border-indigo-200/70 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3 h-3 text-indigo-500" /> AI Decoded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                <Zap className="w-3 h-3 text-amber-500" /> Rule Parser
              </span>
            )}
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Edit Task Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Edit Mode vs Display Mode */}
          {isEditing ? (
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Edit Assignment Details
              </h4>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  placeholder="Task Title"
                  className="w-full text-sm font-semibold p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  value={editedDesc}
                  onChange={e => setEditedDesc(e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={editedCourse}
                    onChange={e => setEditedCourse(e.target.value)}
                    placeholder="Course"
                    className="text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <input
                    type="date"
                    value={editedDate}
                    onChange={e => setEditedDate(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <input
                    type="time"
                    value={editedTime}
                    onChange={e => setEditedTime(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                  />
                  <select
                    value={editedPriority}
                    onChange={e => setEditedPriority(e.target.value as TaskPriority)}
                    className="text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
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
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3
                  className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                    task.status === 'completed'
                      ? 'line-through text-slate-400'
                      : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {task.description || 'No description provided.'}
                </p>
              </div>

              {/* Status and Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Metric 1: Deadline */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Due Date
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {formatFriendlyDate(task.deadlineDate, task.deadlineTime)}
                    </span>
                  </div>
                </div>

                {/* Metric 2: Relative Countdown */}
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 ${
                    task.status === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-800'
                      : relative.isOverdue
                      ? 'bg-rose-50/60 border-rose-200/80 text-rose-800'
                      : relative.isUrgent
                      ? 'bg-amber-50/60 border-amber-200/80 text-amber-800'
                      : 'bg-indigo-50/60 border-indigo-200/80 text-indigo-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/80 border border-current/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold opacity-75 uppercase tracking-wider block">
                      Timeline Status
                    </span>
                    <span className="text-xs font-bold truncate block">
                      {task.status === 'completed' ? 'Completed' : relative.text}
                    </span>
                  </div>
                </div>

                {/* Metric 3: Effort / Danger */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                      dangerRatio > 0.6 && task.status !== 'completed' && !relative.isOverdue
                        ? 'bg-rose-100 text-rose-600 border-rose-200'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {dangerRatio > 0.6 && task.status !== 'completed' && !relative.isOverdue ? (
                      <Flame className="w-4 h-4" />
                    ) : (
                      <Sliders className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {dangerRatio > 0.6 && task.status !== 'completed' && !relative.isOverdue
                        ? 'Danger Load'
                        : 'Estimated Effort'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {dangerRatio > 0.6 && task.status !== 'completed' && !relative.isOverdue
                        ? `${Math.round(dangerRatio * 100)}% Capacity`
                        : `${Math.round((task.estimatedMinutes / 60) * 10) / 10} hours`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtasks Preparation Checklist */}
          <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Preparation Checklist ({completedSubtasksCount}/{totalSubtasks})
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Subtask Interactive Items */}
            <div className="space-y-1.5 pt-1">
              {task.subtasks.map(st => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    st.completed
                      ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900'
                      : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-3xs text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="shrink-0 focus:outline-none"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-slate-300 hover:text-indigo-500 transition-colors" />
                      )}
                    </button>
                    <span
                      className={`text-xs font-medium truncate ${
                        st.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md shrink-0">
                    {st.estimatedMinutes}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Calendar Blocks (Visual Timeline Roadmap) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Scheduled Calendar Blocks ({task.preparationSessions?.length || 0})
              </span>
              <button
                onClick={() => setShowRegenOptions(!showRegenOptions)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg transition-colors border border-indigo-200/60"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reschedule Plan
              </button>
            </div>

            {/* Reschedule options drawer */}
            {showRegenOptions && (
              <div className="p-3.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-2 animate-in fade-in duration-150 shadow-2xs">
                <p className="text-xs text-indigo-950 font-bold">
                  Choose New Preparation Pacing Strategy:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleRegenPlan('standard')}
                    className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-800 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-3xs"
                  >
                    Spaced (Balanced Across Days)
                  </button>
                  <button
                    onClick={() => handleRegenPlan('early_bird')}
                    className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-800 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-3xs"
                  >
                    Early Bird (-1 Day Safety Buffer)
                  </button>
                  <button
                    onClick={() => handleRegenPlan('intensive')}
                    className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-800 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-3xs"
                  >
                    Intensive (Final 48h Sprint)
                  </button>
                </div>
              </div>
            )}

            {/* Connected Vertical Timeline View */}
            {task.preparationSessions && task.preparationSessions.length > 0 ? (
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-100">
                {task.preparationSessions.map((session, idx) => (
                  <div key={session.id} className="relative group">
                    {/* Node Dot on Timeline */}
                    <div
                      className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                        session.completed
                          ? 'bg-emerald-600 border-white text-white shadow-xs'
                          : 'bg-white border-indigo-400 text-indigo-700'
                      }`}
                    >
                      {session.completed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                    </div>

                    {/* Timeline Item Card */}
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        session.completed
                          ? 'bg-slate-50/70 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleSession(task.id, session.id)}
                            className="mt-0.5 text-slate-300 hover:text-emerald-600 transition-colors"
                            title={session.completed ? 'Mark pending' : 'Mark done'}
                          >
                            {session.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                {formatFriendlyDate(session.date)}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)}
                              </span>
                            </div>

                            <h4
                              className={`text-xs font-bold leading-snug ${
                                session.completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {session.title}
                            </h4>

                            {session.description && (
                              <p className="text-[11px] text-slate-500 mt-1">
                                {session.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                          {session.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                No preparation blocks scheduled yet. Click Reschedule Plan to generate blocks.
              </div>
            )}
          </div>

          {/* Source Text Box */}
          {task.sourceText && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                Original Announcement Snippet
              </span>
              <p className="text-slate-600 font-mono text-[11px] leading-relaxed italic">
                "{task.sourceText}"
              </p>
            </div>
          )}
        </div>

        {/* Cohesive Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportTasksToICS([task], `${task.title.replace(/\s+/g, '-').toLowerCase()}.ics`);
                success('Schedule exported as .ics calendar file.');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-100/80 rounded-xl transition-all shadow-3xs"
              title="Download calendar file for Google Calendar or Apple Calendar"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export .ICS</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                toggleTaskStatus(task.id);
                onClose();
              }}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                task.status === 'completed'
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {task.status === 'completed' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Task
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Mark Task Complete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-sm w-full space-y-3 border border-slate-200 animate-in zoom-in-95 duration-150">
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
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
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
