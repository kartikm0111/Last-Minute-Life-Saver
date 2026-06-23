import React, { useState, useEffect, useRef } from "react";
import { Task, Habit, Recommendation, AIPrioritizationResult } from "./types";
import { getInitialTasks, getInitialHabits } from "./data";
import { safeStorage } from "./lib/storage";
import TaskList from "./components/TaskList";
import CalendarView from "./components/CalendarView";
import CompanionCoaching from "./components/CompanionCoaching";
import HabitAnalytics from "./components/HabitAnalytics";
import { 
  Sparkles, ShieldCheck, HeartPulse, Flame, BrainCircuit, Activity, Calendar, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// For counting up values elegantly
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    let start = prevValueRef.current;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    const duration = 800; // ms
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const current = Math.round(start + (end - start) * easeProgress);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        prevValueRef.current = end;
      }
    }
    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue}</span>;
}

// Shell Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 90,
      damping: 14
    }
  }
};

// Polished layout-animated StatCard that uses AnimatePresence to transition content shifts beautifully
function StatCard({ 
  icon, 
  title, 
  value, 
  colorClass, 
  bgClass, 
  borderClass 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: number; 
  colorClass: string; 
  bgClass: string; 
  borderClass: string; 
}) {
  return (
    <motion.div 
      layout
      variants={itemVariants}
      whileHover={{ scale: 1.02, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 shadow-xl transition-all duration-300 hover:border-slate-700/80`}
    >
      <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} ${borderClass} shadow-sm shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold truncate">{title}</p>
        <div className="h-7 overflow-hidden relative flex items-center mt-0.5">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={value}
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="text-lg font-extrabold text-white font-sans"
            >
              <AnimatedNumber value={value} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const todayStr = "2026-06-23";

  // State Management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeTab, setActiveTab] = useState<"agenda" | "coach" | "habits">("agenda");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      title: "The Eat-the-Frog Strategy",
      description: "Aura identified Rent bill & Utility payments as urgent. Handle financial chores first for absolute clean slate mind space.",
      impactType: "DECISION_MAKING"
    },
    {
      title: "Deploy 25-min Pomodoro focus blocks",
      description: "For tough deliverables like CS50, block cell notifications. Complete 2 action checkoffs per block.",
      impactType: "FOCUS"
    },
    {
      title: "Draft Early Extension Buffer",
      description: "When in doubt, use Aura's extension helper to message coordinators 24 hours BEFORE the deadline, not after.",
      impactType: "TIME_SAVER"
    }
  ]);

  // Loading States
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL");

  // Proactive Conflict / Overload Alerts
  const [aiAlerts, setAiAlerts] = useState<string[] | null>(null);

  // Crisis Mode States
  const [crisisModeActive, setCrisisModeActive] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [isCrisisSpeaking, setIsCrisisSpeaking] = useState(false);
  const crisisAudioRef = useRef<AudioBufferSourceNode | null>(null);

  // Debounce timeout tracking for auto audits
  const aiAuditDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const triggerDebouncedAiAudit = (tasksToAudit: Task[]) => {
    if (aiAuditDebounceRef.current) {
      clearTimeout(aiAuditDebounceRef.current);
    }
    aiAuditDebounceRef.current = setTimeout(() => {
      handleRunAiOptimization(tasksToAudit);
    }, 1200);
  };

  // Emergency Draft State (Inter-component communication)
  const [quickDraftTask, setQuickDraftTask] = useState<Task | null>(null);
  const [quickDraftType, setQuickDraftType] = useState<string | null>(null);

  // Initialize from safeStorage or seed data
  useEffect(() => {
    let initialT: Task[] = [];
    const savedTasks = safeStorage.getItem("lastminute_tasks");
    if (savedTasks) {
      try {
        initialT = JSON.parse(savedTasks);
        setTasks(initialT || []);
      } catch (e) {
        console.error("SyntaxError parsing savedTasks, resetting to initial seed:", e);
        initialT = getInitialTasks();
        setTasks(initialT);
        safeStorage.setItem("lastminute_tasks", JSON.stringify(initialT));
      }
    } else {
      initialT = getInitialTasks();
      setTasks(initialT);
      safeStorage.setItem("lastminute_tasks", JSON.stringify(initialT));
    }

    const savedHabits = safeStorage.getItem("lastminute_habits");
    if (savedHabits) {
      try {
        setHabits(JSON.parse(savedHabits) || []);
      } catch (e) {
        console.error("SyntaxError parsing savedHabits, resetting to initial seed:", e);
        const initialHabs = getInitialHabits();
        setHabits(initialHabs);
        safeStorage.setItem("lastminute_habits", JSON.stringify(initialHabs));
      }
    } else {
      const initialHabs = getInitialHabits();
      setHabits(initialHabs);
      safeStorage.setItem("lastminute_habits", JSON.stringify(initialHabs));
    }

    // Let user trigger optimization dynamically. No need to hit API on every page reload/mount.
    if (!safeStorage.getItem("lastminute_tasks")) {
      // First time visitors can have a clean initial state already seated in the system.
    }
  }, []);

  // Clean up any running speech on App crash or unmount
  useEffect(() => {
    return () => {
      try {
        if (crisisAudioRef.current) {
          crisisAudioRef.current.stop();
        }
      } catch (err) {}
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (err) {}
    };
  }, []);

  // Sync state to safe storage on edits
  const saveTasksToLocalStorage = (nextTasks: Task[]) => {
    setTasks(nextTasks);
    safeStorage.setItem("lastminute_tasks", JSON.stringify(nextTasks));
  };

  const saveHabitsToLocalStorage = (nextHabits: Habit[]) => {
    setHabits(nextHabits);
    safeStorage.setItem("lastminute_habits", JSON.stringify(nextHabits));
  };

  // Task Operations
  const handleAddTask = (newTaskData: Omit<Task, "id" | "completedSteps">) => {
    const freshTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      completedSteps: []
    };
    const updated = [freshTask, ...tasks];
    saveTasksToLocalStorage(updated);
    triggerDebouncedAiAudit(updated);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    saveTasksToLocalStorage(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasksToLocalStorage(updated);
  };

  // Habit toggling
  const handleToggleHabit = (id: string) => {
    const updated = habits.map(h => {
      if (h.id === id) {
        const completed = h.completedDays.includes(todayStr);
        let nextDays = [...h.completedDays];
        let nextStreak = h.streak;

        if (completed) {
          nextDays = nextDays.filter(d => d !== todayStr);
          nextStreak = Math.max(0, nextStreak - 1);
        } else {
          nextDays.push(todayStr);
          nextStreak += 1;
        }

        return { ...h, completedDays: nextDays, streak: nextStreak };
      }
      return h;
    });
    saveHabitsToLocalStorage(updated);
  };

  // Triggering draft assistance from other modules
  const handleTriggerQuickDraft = (task: Task, draftType: string) => {
    setQuickDraftTask(task);
    setQuickDraftType(draftType);
    setActiveTab("coach");
  };

  const handleClearDraftRequest = () => {
    setQuickDraftTask(null);
    setQuickDraftType(null);
  };

  // Ask AI to break down single task dynamically
  const handleAskAiToBreakDown = async (task: Task) => {
    setIsAiOptimizing(true);
    try {
      const res = await fetch("/api/gemini/plan-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: [task],
          focusGoal: `Generate highly specific sequence sub-steps to execute this specific card: ${task.title}`
        })
      });

      const data: AIPrioritizationResult = await res.json();
      if (data.prioritizedTasks && data.prioritizedTasks.length > 0) {
        const matchingPlan = data.prioritizedTasks[0];
        
        handleUpdateTask(task.id, {
          actionSteps: matchingPlan.actionSteps,
          reason: matchingPlan.reason || task.reason,
          priority: matchingPlan.priority || task.priority,
          timeRequiredMinutes: matchingPlan.timeRequiredMinutes
        });
      }
    } catch (err) {
      console.error(err);
      // Fallback local breakdown
      handleUpdateTask(task.id, {
        actionSteps: [
          "Establish environmental quiet (headphones, focus music)",
          "Formulate base-level configuration script",
          "Conduct isolated schema tests",
          "Compile submission log"
        ],
        reason: "Calculated fallback step sequence to eliminate initial friction points."
      });
    } finally {
      setIsAiOptimizing(false);
    }
  };

  // Full AI Prioritization Audit of entire grid
  const handleRunAiOptimization = async (customTasks?: Task[]): Promise<Task[]> => {
    const tasksToOptimize = customTasks || tasks;
    if (tasksToOptimize.length === 0) return [];
    setIsAiOptimizing(true);
 
    try {
      const res = await fetch("/api/gemini/plan-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasksToOptimize.map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            dueDate: t.dueDate,
            priority: t.priority,
            status: t.status
          })),
          focusGoal: "Prioritize critical deadlines, calculate estimates, generate granular action checklists, and suggest productivity hacks."
        })
      });
 
      const data: AIPrioritizationResult = await res.json();
      let finalTasks = tasksToOptimize;
      
      if (data.prioritizedTasks) {
        // Map priority, estimates, checklists back into the application state
        finalTasks = tasksToOptimize.map(origTask => {
          const aiPlan = data.prioritizedTasks.find(p => p.id === origTask.id);
          if (aiPlan) {
            return {
              ...origTask,
              priority: aiPlan.priority,
              reason: aiPlan.reason,
              actionSteps: aiPlan.actionSteps,
              timeRequiredMinutes: aiPlan.timeRequiredMinutes
            };
          }
          return origTask;
        });
 
        saveTasksToLocalStorage(finalTasks);
      }
 
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }

      if (data.alerts) {
        setAiAlerts(data.alerts);
      } else {
        setAiAlerts(null);
      }

      return finalTasks;
 
    } catch (err) {
      console.error("AI prioritization loop failed:", err);
      return tasksToOptimize;
    } finally {
      setIsAiOptimizing(false);
    }
  };

  // Browser Speech Synthesis fallback helper for Crisis mode
  const playBrowserSpeechFallback = (text: string) => {
    try {
      let hasSynth = false;
      try {
        hasSynth = typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis !== null && window.speechSynthesis !== undefined;
      } catch (e) {
        hasSynth = false;
      }

      if (hasSynth) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = () => {
            setIsCrisisSpeaking(false);
          };
          utterance.onerror = () => {
            setIsCrisisSpeaking(false);
          };
          setIsCrisisSpeaking(true);
          window.speechSynthesis.speak(utterance);
        } catch (synthCallErr) {
          console.warn("Failed to invoke speechSynthesis methods:", synthCallErr);
          setIsCrisisSpeaking(false);
        }
      } else {
        setIsCrisisSpeaking(false);
      }
    } catch (e) {
      console.error("Web speech synthesis failed:", e);
      setIsCrisisSpeaking(false);
    }
  };

  // Crisis Mode Audio Player Helper
  const playCrisisPcm = (base64String: string, originalText?: string) => {
    try {
      if (crisisAudioRef.current) {
        try {
          crisisAudioRef.current.stop();
        } catch (e) {}
      }

      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const buffer = bytes.buffer;
      const int16Array = new Int16Array(buffer);
      const sampleRate = 24000;

      let AudioCtxConstructor;
      try {
        AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
      } catch (e) {
        AudioCtxConstructor = null;
      }

      if (!AudioCtxConstructor) {
        throw new Error("AudioContext is not supported/accessible in this browser sandbox");
      }
      const audioCtx = new AudioCtxConstructor({ sampleRate });

      const audioBuffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsCrisisSpeaking(false);
        crisisAudioRef.current = null;
      };

      crisisAudioRef.current = source;
      setIsCrisisSpeaking(true);
      source.start();
    } catch (err) {
      console.error("Crisis Web audio playback error:", err);
      if (originalText) {
        playBrowserSpeechFallback(originalText);
      } else {
        setIsCrisisSpeaking(false);
      }
    }
  };

  // Orchestrate the fully autonomous "Crisis Mode" sequence
  const handleTriggerCrisisMode = async () => {
    if (tasks.length === 0) return;
    setCrisisModeActive(true);
    setIsCrisisSpeaking(true);

    try {
      // Step 1: Run optimization audit and wait for complete state synchronization
      const updatedTasks = await handleRunAiOptimization(tasks);

      // Step 2 & 3: Scan and grab the topmost unchecked critical priority task
      let topTask = updatedTasks.find(t => t.priority === "CRITICAL" && t.status !== "DONE");
      if (!topTask) {
        // Fallback to high priority task or fallback to first task
        topTask = updatedTasks.find(t => t.priority === "HIGH" && t.status !== "DONE") || updatedTasks[0];
      }

      if (topTask) {
        // Toggle the visual pulse highlight immediately
        setHighlightedTaskId(topTask.id);

        // Scroll task card smoothly into active viewport center
        setTimeout(() => {
          const el = document.getElementById(`task-card-${topTask?.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);

        // Settle visual pulse highlighters automatically after a clean timeframe
        setTimeout(() => {
          setHighlightedTaskId(null);
        }, 7000);
      }

      // Step 4: Call Text-To-Speech endpoint with a tailored, voice summary
      const speechText = topTask 
        ? `Attention! Let's resolve what matters most. I've initiated Crisis Mode, and your immediate top priority target is "${topTask.title}". Deep breath, keep calm, and execute on our synchronized sub steps.`
        : "Crisis Protocol engaged. All active stress metrics have been balanced. Keep checking off checklist objectives.";

      try {
        const speakRes = await fetch("/api/gemini/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: speechText })
        });

        const speakData = await speakRes.json();
        if (speakData.audio) {
          playCrisisPcm(speakData.audio, speechText);
        } else {
          playBrowserSpeechFallback(speechText);
        }
      } catch (speakErr) {
        console.warn("Backend speak endpoint error in Crisis Mode, falling back to Web Speech:", speakErr);
        playBrowserSpeechFallback(speechText);
      }

    } catch (err) {
      console.error("Crisis mode trigger failure:", err);
      setIsCrisisSpeaking(false);
    } finally {
      setCrisisModeActive(false);
    }
  };

  // Filter tasks based on calendar grid clicks
  const displayedTasks = selectedDateFilter === "ALL" 
    ? tasks 
    : tasks.filter(t => t.dueDate === selectedDateFilter);

  // Stats Counters
  const criticalCount = tasks.filter(t => t.priority === "CRITICAL" && t.status !== "DONE").length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter(t => t.status === "DONE").length;
  const activeStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 relative overflow-hidden" id="root-viewport">
      {/* Decorative main ambient background glow - pulse animations active */}
      <div className="absolute top-10 left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slower" />

      {/* Noise overlay and ambient scan grid */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      {/* Main container with staggered load */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8 relative z-10"
      >
        
        {/* Top Navbar Header */}
        <motion.header 
          variants={itemVariants}
          className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-5 gap-4"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-cyan-500/20 text-slate-950 shrink-0"
            >
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Last-Minute Life Saver
                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full font-mono font-medium animate-pulse">
                  CRISIS PROTOCOL ACTIVE
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Autonomous action drafts, prioritized checklists, and speech coaching to save deadlines.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Crisis Mode Button */}
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 18px rgba(239, 68, 68, 0.45)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTriggerCrisisMode}
              disabled={isAiOptimizing || crisisModeActive}
              className={`group bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] text-white text-[11px] font-mono uppercase tracking-widest font-extrabold px-4.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/40 cursor-pointer ${isAiOptimizing || crisisModeActive ? "opacity-70 cursor-not-allowed" : "animate-pulse"}`}
              id="crisis-mode-trigger"
            >
              <Flame className={`w-4 h-4 text-white ${crisisModeActive ? "animate-bounce" : "animate-pulse"}`} />
              {crisisModeActive ? "Siphoning Chaos..." : "CRISIS MODE"}
            </motion.button>

            {/* AI Global Audit Stream Button */}
            <motion.button 
              whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleRunAiOptimization()}
              disabled={isAiOptimizing}
              className={`group bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-600 active:scale-[0.98] text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-cyan-500/15 transition-all flex items-center justify-center gap-2 border border-cyan-300/30 ${isAiOptimizing ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
              id="global-ai-audit-trigger"
            >
              <Sparkles className={`w-4 h-4 ${isAiOptimizing ? "animate-spin" : "transition-transform group-hover:scale-125"}`} />
              {isAiOptimizing ? "Calibrating Stress Nodes..." : "Gemini Prioritization Audit"}
            </motion.button>
          </div>
        </motion.header>

        {/* Dynamic Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="stats-ribbon">
          <StatCard 
            icon={<Activity className="w-5 h-5 text-red-500" />}
            title="Unchecked Criticals"
            value={criticalCount}
            colorClass="text-red-400"
            bgClass="bg-red-950/40"
            borderClass="border border-red-900/40"
          />

          <StatCard 
            icon={<BrainCircuit className="w-5 h-5 text-cyan-400" />}
            title="In Active Focus"
            value={inProgressCount}
            colorClass="text-cyan-400"
            bgClass="bg-cyan-950/40"
            borderClass="border border-cyan-900/40"
          />

          <StatCard 
            icon={<ShieldCheck className="w-5 h-5 text-green-400" />}
            title="Safely Submitted"
            value={completedCount}
            colorClass="text-green-400"
            bgClass="bg-green-950/40"
            borderClass="border border-green-900/40"
          />

          <StatCard 
            icon={<Flame className="w-5 h-5 text-orange-400 animate-pulse" />}
            title="Peak Momentum"
            value={activeStreak}
            colorClass="text-orange-400"
            bgClass="bg-orange-950/40"
            borderClass="border border-orange-900/40"
          />
        </div>

        {/* Proactive Conflict/Overload Alerts Banner */}
        <AnimatePresence>
          {aiAlerts && aiAlerts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95, y: -15 }}
              animate={{ height: "auto", opacity: 1, scale: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="overflow-hidden"
              id="ai-alerts-banner"
            >
              <div className="bg-red-950/20 border-2 border-red-900/40 rounded-3xl p-5 flex flex-col md:flex-row items-start justify-between gap-4 shadow-xl shadow-red-950/5 relative">
                <div className="absolute top-0 right-0 w-44 h-44 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex gap-4 items-start">
                  <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500 border border-red-500/20 shrink-0 select-none animate-pulse">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-red-400">
                      Proactive Conflict Detection & Stress Warnings
                    </h3>
                    <div className="mt-2 space-y-1.5 pl-1 text-[11.5px] text-slate-300 leading-relaxed font-mono">
                      {aiAlerts.map((alert, i) => (
                        <p key={i} className="flex items-start gap-1.5">
                          <span className="text-red-500 font-extrabold">▶</span>
                          <span>{alert}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAiAlerts(null)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 cursor-pointer text-[10px] px-3.5 py-1.5 rounded-xl font-mono uppercase tracking-widest font-extrabold select-none shrink-0 transition"
                >
                  Dismiss Alerts
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elegant Workspace Tab navigation */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/85 p-2 rounded-2xl md:rounded-3xl"
        >
          <div className="flex flex-wrap w-full sm:w-auto items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-900">
            <button
              onClick={() => setActiveTab("agenda")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "agenda"
                  ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 text-cyan-400 font-extrabold shadow-lg shadow-cyan-500/5"
                  : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <BrainCircuit className="w-4 h-4 shrink-0" />
              Focus Agenda
            </button>
            <button
              onClick={() => setActiveTab("coach")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "coach"
                  ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 text-cyan-400 font-extrabold shadow-lg shadow-cyan-500/5"
                  : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              AI Coach & Drafts
            </button>
            <button
              onClick={() => setActiveTab("habits")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeTab === "habits"
                  ? "bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 border border-cyan-500/30 text-cyan-400 font-extrabold shadow-lg shadow-cyan-500/5"
                  : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Flame className="w-4 h-4 shrink-0 animate-pulse-slow" />
              Habit Momentum
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pr-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
            <span>Workspace Sync Ready</span>
          </div>
        </motion.div>

        {/* Synchronized Workspace Tab Panes */}
        <div className="relative pt-2" id="active-workspace-panel">
          <AnimatePresence mode="wait">
            {activeTab === "agenda" && (
              <motion.div
                key="agenda"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Main Agenda Tasks list */}
                <div className="lg:col-span-7">
                  <TaskList 
                    tasks={displayedTasks}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onTriggerQuickDraft={handleTriggerQuickDraft}
                    onAskAiToBreakDown={handleAskAiToBreakDown}
                    isAiOptimizing={isAiOptimizing}
                    highlightedTaskId={highlightedTaskId}
                  />
                </div>

                {/* Weekly pressure visual map */}
                <div className="lg:col-span-5">
                  <CalendarView 
                    tasks={tasks}
                    onSelectDate={setSelectedDateFilter}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "coach" && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <CompanionCoaching 
                  quickDraftTask={quickDraftTask}
                  quickDraftType={quickDraftType}
                  onClearDraftRequest={handleClearDraftRequest}
                />
              </motion.div>
            )}

            {activeTab === "habits" && (
              <motion.div
                key="habits"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="pb-12"
              >
                <HabitAnalytics 
                  habits={habits}
                  onToggleHabit={handleToggleHabit}
                  recommendations={recommendations}
                  tasks={tasks}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
