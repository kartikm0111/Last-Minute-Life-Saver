import React, { useState } from "react";
import { Task, TaskPriority, TaskCategory, TaskStatus } from "../types";
import { 
  Plus, Calendar, Clock, AlertCircle, ChevronDown, ChevronUp, Sparkles, CheckSquare, Square, 
  Trash2, Mail, ArrowUpRight, CheckSquare2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "completedSteps">) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onTriggerQuickDraft: (task: Task, draftType: string) => void;
  onAskAiToBreakDown: (task: Task) => void;
  isAiOptimizing: boolean;
  highlightedTaskId?: string | null;
}

export default function TaskList({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onTriggerQuickDraft,
  onAskAiToBreakDown,
  isAiOptimizing,
  highlightedTaskId
}: TaskListProps) {
  const [filter, setFilter] = useState<"ALL" | "DUE_TODAY" | "CRITICAL" | "DONE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isAdding, setIsAdding] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("General");
  const [dueDate, setDueDate] = useState("2026-06-24");
  const [priority, setPriority] = useState<TaskPriority>("HIGH");
  const [estimatedHours, setEstimatedHours] = useState(2);

  // Filter logic
  const todayStr = "2026-06-23";
  const filteredTasks = tasks.filter(t => {
    // Status filters
    if (filter === "DUE_TODAY" && t.dueDate !== todayStr) return false;
    if (filter === "CRITICAL" && t.priority !== "CRITICAL") return false;
    if (filter === "DONE" && t.status !== "DONE") return false;
    if (filter === "ALL" && t.status === "DONE" && tasks.length > 4) {
      // Keep done tasks but separate them or show based on choice
    }

    // Category filter
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    
    return true;
  });

  const categoryOptions: TaskCategory[] = ["Assignment", "Bill", "Meeting", "Interview", "Project", "General"];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title,
      category,
      dueDate,
      priority,
      status: "TODO",
      estimatedHours
    });
    // Reset Form
    setTitle("");
    setCategory("General");
    setEstimatedHours(2);
    setIsAdding(false);
  };

  const handleToggleStep = (task: Task, step: string) => {
    const currentlyCompleted = task.completedSteps || [];
    let nextCompleted: string[];
    if (currentlyCompleted.includes(step)) {
      nextCompleted = currentlyCompleted.filter(s => s !== step);
    } else {
      nextCompleted = [...currentlyCompleted, step];
    }
    
    // Check if all steps completed, optionally transition task status
    const allCompleted = task.actionSteps?.every(s => nextCompleted.includes(s));
    const nextStatus: TaskStatus = allCompleted ? "DONE" : "IN_PROGRESS";

    onUpdateTask(task.id, { 
      completedSteps: nextCompleted,
      status: nextStatus
    });
  };

  const toggleTaskStatus = (task: Task) => {
    const nextStatus: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    onUpdateTask(task.id, { 
      status: nextStatus,
      completedSteps: nextStatus === "DONE" && task.actionSteps ? [...task.actionSteps] : []
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="task-list-panel">
      {/* Decorative ambient background light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Companion Agenda
            <span className="text-xs font-mono font-medium bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800/50">
              {tasks.length} target{tasks.length !== 1 && "s"}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Autonomous companion prioritizing and resolving critical stress-points.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
          id="btn-add-task-toggle"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Task Creation Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleCreate}
            className="mb-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 overflow-hidden relative z-10"
            id="task-create-form"
          >
            <h3 className="text-sm font-semibold text-white mb-3">Record New Critical Deadline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">TASK TITLE / OBLIGATION</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., CS50 Assignment 3 Submission" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  id="form-task-title"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">CATEGORY</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  id="form-task-category"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">DUE DATE</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  id="form-task-duedate"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">PRIORITY</label>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    id="form-task-priority"
                  >
                    <option value="CRITICAL">🔥 CRITICAL</option>
                    <option value="HIGH">⭐️ HIGH</option>
                    <option value="MEDIUM">⚖️ MEDIUM</option>
                    <option value="LOW">🛡️ LOW</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1">EST. WORK (HRS)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    id="form-task-hours"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-400 transition"
                id="btn-add-task-cancel"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/35 hover:bg-cyan-500/30 px-4 py-1.5 rounded-lg transition font-medium"
                id="btn-add-task-submit"
              >
                Insert Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid view filter triggers */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4 relative z-10">
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800/80">
          <button 
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === "ALL" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setFilter("DUE_TODAY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === "DUE_TODAY" ? "bg-red-950/80 text-red-400 shadow-sm border border-red-900/40" : "text-slate-400 hover:text-white"}`}
          >
            Due Today
          </button>
          <button 
            onClick={() => setFilter("CRITICAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === "CRITICAL" ? "bg-amber-950/80 text-amber-500 shadow-sm border border-amber-900/40" : "text-slate-400 hover:text-white"}`}
          >
            ⚠️ Critical
          </button>
          <button 
            onClick={() => setFilter("DONE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === "DONE" ? "bg-green-950/80 text-green-400 shadow-sm border border-green-900/40" : "text-slate-400 hover:text-white"}`}
          >
            Done
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Filter Category:</span>
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            id="list-category-filter"
          >
            <option value="ALL">All Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards List representing priority stress points */}
      <div className="space-y-3 relative z-10" id="task-list-container">
        {isAiOptimizing ? (
          <div className="space-y-3" id="task-list-skeletons">
            {[1, 2, 3].map((val) => (
              <motion.div
                key={val}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: val * 0.08 }}
                className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-3/4">
                  <div className="w-5 h-5 rounded bg-slate-800 animate-pulse shrink-0" />
                  <div className="space-y-2 w-full">
                    <div className="h-3.5 bg-slate-800 rounded w-2/3 animate-pulse" />
                    <div className="h-2 bg-slate-900 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-slate-850 rounded-full animate-pulse" />
              </motion.div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 bg-slate-950/45 border border-slate-850 rounded-2xl flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
              className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-800/30 flex items-center justify-center mb-4 text-cyan-400 font-extrabold shadow shadow-cyan-500/10"
            >
              🎉
            </motion.div>
            <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">No Active Strain Detected</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
              Wonderful! You have successfully resolved or averted all active scheduling bottlenecks. Enjoy the calm.
            </p>
          </motion.div>
        ) : (
          filteredTasks.map(task => {
            const isCritical = task.priority === "CRITICAL";
            const isHigh = task.priority === "HIGH";
            const isMedium = task.priority === "MEDIUM";
            const isDone = task.status === "DONE";
            const isExpanded = expandedTaskId === task.id;

            const totalSteps = task.actionSteps?.length || 0;
            const completedCount = task.completedSteps?.length || 0;
            const percentProgress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

            return (
              <motion.div 
                key={task.id}
                layoutId={`task-card-${task.id}`}
                className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                  highlightedTaskId === task.id
                    ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.45)] ring-2 ring-red-500/50 scale-[1.02] bg-slate-900"
                    : isDone 
                      ? "bg-slate-950/40 border-slate-900/50 opacity-60" 
                      : isCritical
                        ? "bg-slate-950 border-red-950 shadow-md shadow-red-950/10"
                        : isHigh
                          ? "bg-slate-900/80 border-amber-950"
                          : "bg-slate-900/50 border-slate-800/80"
                }`}
                id={`task-card-${task.id}`}
              >
                {/* Upper row: brief view */}
                <div className="p-4 flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Visual Checkbox */}
                    <button 
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-0.5 text-slate-500 hover:text-cyan-400 transition"
                      title="Mark entire task Done/Todo"
                    >
                      {isDone ? (
                        <CheckSquare2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-md border ${isCritical ? 'border-red-700/80 hover:border-red-500' : 'border-slate-700 hover:border-cyan-400'}`} />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium uppercase tracking-wider ${
                          isDone 
                            ? "bg-slate-900 text-slate-500 border border-slate-850"
                            : task.category === "Assignment"
                              ? "bg-purple-950/55 text-purple-400 border border-purple-900/30"
                              : task.category === "Bill"
                                ? "bg-rose-950/55 text-rose-400 border border-rose-900/30"
                                : task.category === "Interview"
                                  ? "bg-orange-950/55 text-orange-400 border border-orange-900/30"
                                  : task.category === "Meeting"
                                    ? "bg-teal-950/55 text-teal-400 border border-teal-900/30"
                                    : "bg-slate-950 text-slate-400 border border-slate-800"
                        }`}>
                          {task.category}
                        </span>

                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-medium ${
                          isDone
                            ? "text-slate-500"
                            : isCritical
                              ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                              : isHigh
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-slate-850 text-slate-400"
                        }`}>
                          {task.priority}
                        </span>

                        {task.dueDate === todayStr && !isDone && (
                          <span className="text-[9px] font-mono bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-900 animate-bounce">
                            ⚠️ TODAY
                          </span>
                        )}
                      </div>

                      <h3 className={`text-sm font-semibold mt-1.5 ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </h3>

                      {task.reason && (
                        <div className="mt-1.5 flex items-start gap-1 pb-1">
                          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed w-full">
                            <span className="font-bold text-cyan-400 uppercase tracking-widest font-mono text-[9px] mr-1">Why:</span>
                            <span className="text-slate-300 italic">{task.reason}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> Deadline: {task.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> Est: {task.estimatedHours}h
                        </span>
                        {totalSteps > 0 && (
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-1.5 py-0.2 rounded-md">
                            Progress: {percentProgress}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 transition"
                      title="Inspect priority context"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 text-red-400/80 hover:text-red-300 transition"
                      title="Suck out item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lower row: expanded layout with AI broken down milestones and recommendations */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-800/80 bg-slate-950/50 p-4"
                    >
                      {/* AI Priority Justification */}
                      {task.reason && (
                        <div className="mb-4 bg-slate-950 border border-slate-900 rounded-xl p-3 flex gap-2.5 items-start">
                          <div className="bg-cyan-950 p-1.5 rounded-lg border border-cyan-800/30 text-cyan-400 shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">AI Stress-Averter Analysis</h4>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{task.reason}</p>
                          </div>
                        </div>
                      )}

                      {/* AI Generated Action Pipeline */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                            Autonomous Execution Steps
                          </h4>
                          {!task.actionSteps && (
                            <button 
                              type="button"
                              disabled={isAiOptimizing}
                              onClick={() => onAskAiToBreakDown(task)}
                              className="bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/20 hover:bg-cyan-500/20 px-2 py-0.5 rounded-md transition flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 animate-pulse" /> Ask AI to Break Down
                            </button>
                          )}
                        </div>

                        {task.actionSteps && task.actionSteps.length > 0 ? (
                          <div className="space-y-2 mt-1.5 bg-slate-950/80 border border-slate-900/60 p-3 rounded-xl">
                            {task.actionSteps.map((step, idx) => {
                              const stepCompleted = (task.completedSteps || []).includes(step);
                              return (
                                <button 
                                  key={idx}
                                  type="button"
                                  onClick={() => handleToggleStep(task, step)}
                                  className="w-full text-left flex items-start gap-2.5 py-1.5 px-2 hover:bg-slate-900/30 rounded-lg transition"
                                >
                                  {stepCompleted ? (
                                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600 shrink-0 mt-0.5 hover:text-cyan-400" />
                                  )}
                                  <span className={`text-xs ${stepCompleted ? 'line-through text-slate-550' : 'text-slate-300'}`}>
                                    {step}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic mt-1 px-1">
                            No milestone steps defined yet. Tap "Ask AI to Break Down" to get an immediate, manageable action roadmap.
                          </p>
                        )}
                      </div>

                      {/* AI Quick Actions (Trigger to draft letters/scripts, which we can resolve in Companion panel) */}
                      {!isDone && (
                        <div className="mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Emergency Quick-Actions:</span>
                          
                          <button 
                            onClick={() => onTriggerQuickDraft(task, "extension_request")}
                            className="bg-slate-900 border border-slate-800 hover:border-cyan-550/30 hover:bg-slate-850 text-slate-300 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                            title="Help write a smart, respectful extension request email"
                          >
                            <Mail className="w-3 h-3 text-cyan-400" /> Draft Extension Request
                          </button>

                          <button 
                            onClick={() => onTriggerQuickDraft(task, "instant_starter_roadmap")}
                            className="bg-slate-900 border border-slate-800 hover:border-cyan-550/30 hover:bg-slate-850 text-slate-300 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                            title="Help wire the literal skeleton code or writeup introduction"
                          >
                            <ArrowUpRight className="w-3 h-3 text-yellow-500" /> Draft Starter Code/Outline
                          </button>
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
