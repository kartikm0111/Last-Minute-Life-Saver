import { useState, useEffect } from "react";
import { Habit, Recommendation, Task } from "../types";
import { safeStorage } from "../lib/storage";
import { Flame, Check, Sparkles, Smile, Star, BrainCircuit, Lightbulb, Clock } from "lucide-react";
import { motion } from "motion/react";

interface HabitAnalyticsProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  recommendations: Recommendation[];
  tasks: Task[];
}

export default function HabitAnalytics({ habits, onToggleHabit, recommendations, tasks }: HabitAnalyticsProps) {
  const todayStr = "2026-06-23";
  const [dailySummary, setDailySummary] = useState<{ reflection: string; adjustment: string } | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const signature = JSON.stringify({
    t: tasks.map(t => ({ id: t.id, s: t.status, d: t.dueDate, p: t.priority })),
    h: habits.map(h => ({ id: h.id, streak: h.streak, cd: h.completedDays }))
  });

  useEffect(() => {
    let active = true;
    let debounceTimer: NodeJS.Timeout | null = null;

    const cachedSig = safeStorage.getItem("lastminute_daily_summary_sig");
    const cachedSummary = safeStorage.getItem("lastminute_daily_summary");

    // Load from cache initially
    if (cachedSummary && !dailySummary) {
      try {
        setDailySummary(JSON.parse(cachedSummary));
      } catch (e) {
        console.error("Failed to parse cached daily summary:", e);
      }
    }

    // Skip if state hasn't changed from cached signature
    if (cachedSig === signature && cachedSummary) {
      return;
    }

    const runFetch = () => {
      setIsSummaryLoading(true);
      fetch("/api/gemini/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits })
      })
        .then(res => res.json())
        .then(data => {
          if (active) {
            const resultSummary = {
              reflection: data.reflection || "Take deep breaths. Your tracking is logged, tomorrow is another day.",
              adjustment: data.adjustment || "Continue maintaining your safeguards."
            };
            setDailySummary(resultSummary);
            safeStorage.setItem("lastminute_daily_summary", JSON.stringify(resultSummary));
            safeStorage.setItem("lastminute_daily_summary_sig", signature);
          }
        })
        .catch(err => {
          console.error("Failed to load daily summary:", err);
        })
        .finally(() => {
          if (active) {
            setIsSummaryLoading(false);
          }
        });
    };

    // Debounce actual API call by 3 seconds of inactivity to protect quota limits
    debounceTimer = setTimeout(() => {
      runFetch();
    }, 3000);

    return () => {
      active = false;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [signature]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="habit-analytics-panel">
      
      {/* 1. Habit Tracker */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Momentum Safeguards
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Prevent crisis cycles by maintaining crucial anti-rush daily habits.</p>

          <div className="space-y-3 mt-5" id="habits-list">
            {habits.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 14 }}
                className="p-8 text-center bg-slate-950/65 border border-slate-850 rounded-2xl flex flex-col items-center justify-center min-h-[220px]"
              >
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 text-orange-500 mb-3">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">No Active Safeguards</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-normal text-center">Add critical daily guardrails to stay cool under crisis.</p>
              </motion.div>
            ) : (
              habits.map(habit => {
                const isCompletedToday = habit.completedDays.includes(todayStr);

                return (
                  <motion.div 
                    layout
                    whileHover={{ scale: 1.015, x: 2 }}
                    key={habit.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all duration-300 ${
                      isCompletedToday
                        ? "bg-indigo-950/30 border-indigo-900/50 text-indigo-300 shadow-md shadow-indigo-950/10"
                        : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => onToggleHabit(habit.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          isCompletedToday
                            ? "bg-indigo-500 border-indigo-500 text-slate-950"
                            : "border-slate-700 hover:border-indigo-400 text-transparent"
                        }`}
                      >
                        <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                      </motion.button>

                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                          {habit.category}
                        </span>
                        <h4 className={`text-xs font-semibold mt-0.5 ${isCompletedToday ? "line-through text-slate-500 font-normal" : "text-white"}`}>
                          {habit.name}
                        </h4>
                      </div>
                    </div>

                    <motion.div 
                      key={habit.streak + (isCompletedToday ? "-comp" : "-uncomp")}
                      initial={{ scale: 0.8, y: -2 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl select-none"
                    >
                      <Flame className={`w-4 h-4 text-orange-500 ${isCompletedToday ? "animate-bounce fill-orange-500" : "animate-pulse"}`} />
                      <span className="text-xs font-extrabold text-orange-400 font-sans">{habit.streak}d</span>
                    </motion.div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 p-3 bg-slate-950 rounded-2xl border border-slate-850 flex items-center gap-2.5">
          <Smile className="w-5 h-5 text-indigo-400 shrink-0" />
          <p className="text-[10px] text-slate-400 leading-snug">
            AI Insight: Completing daily planning reviews reduces assignment delivery failure rates by up to 45%.
          </p>
        </div>
      </div>

      {/* 2. AI Personalized Productivity Recommendations */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Strategic Optimization Recommendations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Custom tactics generated by the Aura companion AI to compress prep periods.</p>

          <div className="space-y-3 mt-5" id="productivity-recommendations">
            {recommendations.map((rec, idx) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={idx}
                className="p-3.5 bg-slate-950 border border-slate-900 rounded-2xl flex gap-3 items-start transition-all"
              >
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  rec.impactType === "FOCUS"
                    ? "bg-purple-950 text-purple-400 border border-purple-900/30"
                    : rec.impactType === "TIME_SAVER"
                      ? "bg-rose-950 text-rose-400 border border-rose-900/30"
                      : "bg-teal-950 text-teal-400 border border-teal-900/30"
                }`}>
                  {rec.impactType === "FOCUS" ? (
                    <BrainCircuit className="w-4 h-4" />
                  ) : rec.impactType === "TIME_SAVER" ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                    <span className="text-[8px] font-mono bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      {rec.impactType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">{rec.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Active Real-Time Gemini Recs
          </span>
        </div>

      </div>

      {/* 3. Aura End-of-Day Reflection & Closed-Loop Outcomes */}
      <div className="lg:col-span-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Aura Daily Reflection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-normal">Comparing planned goals vs actual checklist outcomes to close the loop.</p>

          <div className="mt-5 space-y-4">
            {isSummaryLoading && !dailySummary ? (
              <div className="space-y-3" id="daily-summary-skeleton">
                <div className="h-4 bg-slate-800/60 rounded animate-pulse w-3/4" />
                <div className="h-10 bg-slate-800/40 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-800/60 rounded animate-pulse w-1/2" />
                <div className="h-10 bg-slate-800/40 rounded animate-pulse w-full" />
              </div>
            ) : dailySummary ? (
              <div className="space-y-4" id="daily-summary-card">
                {/* Reflection Detail */}
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-1.5 hover:border-slate-800 transition">
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-cyan-400 block pb-0.5">
                    Sustained Wins & Gaps
                  </span>
                  <p className="text-[11.5px] text-slate-350 leading-relaxed italic">
                    "{dailySummary.reflection}"
                  </p>
                </div>

                {/* Adjustment Detail */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl space-y-1.5 hover:border-indigo-900/30 transition">
                  <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1 block pb-0.5 font-sans">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Focus Tactic Tomorrow
                  </span>
                  <p className="text-[11.5px] text-indigo-200/90 leading-relaxed">
                    {dailySummary.adjustment}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500" id="daily-summary-empty">
                Waiting for the next crisis audit state synchronizer.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500 animate-spin" style={{ animationDuration: "3s" }} /> 
            Sync Active
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded text-cyan-400/80 border border-cyan-800/10">
            Outcome Loop Closed
          </span>
        </div>
      </div>

    </div>
  );
}
