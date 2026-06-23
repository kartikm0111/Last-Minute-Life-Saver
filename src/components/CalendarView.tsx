import { useState } from "react";
import { Task } from "../types";
import { Calendar, Clock, AlertTriangle, Sparkles, Footprints, Hourglass } from "lucide-react";
import { motion } from "motion/react";

interface CalendarViewProps {
  tasks: Task[];
  onSelectDate: (date: string) => void;
}

export default function CalendarView({ tasks, onSelectDate }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState("2026-06-23"); // Default to today
  const [aiFocusSuggestion, setAiFocusSuggestion] = useState<string | null>(null);
  const [isAiConsulting, setIsAiConsulting] = useState(false);

  // Focus week of hackathon: June 22 (Mon) to June 28 (Sun)
  const weekDays = [
    { name: "Mon", date: "2026-06-22", label: "22" },
    { name: "Tue", date: "2026-06-23", label: "23", isToday: true },
    { name: "Wed", date: "2026-06-24", label: "24" },
    { name: "Thu", date: "2026-06-25", label: "25" },
    { name: "Fri", date: "2026-06-26", label: "26" },
    { name: "Sat", date: "2026-06-27", label: "27" },
    { name: "Sun", date: "2026-06-28", label: "28" },
  ];

  // Helper to count tasks due on a date
  const getTasksForDate = (date: string) => tasks.filter(t => t.dueDate === date);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    onSelectDate(date);
    setAiFocusSuggestion(null); // Clear suggestion on date change to let them refresh
  };

  const getAiSchedulingBlocks = async (date: string) => {
    setIsAiConsulting(true);
    setAiFocusSuggestion(null);
    const dayTasks = getTasksForDate(date);
    
    if (dayTasks.length === 0) {
      setAiFocusSuggestion("This is a clean slot! AI recommends allocating 1-2 hours of deep focus here toward your long-term capstone coding projects.");
      setIsAiConsulting(false);
      return;
    }

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Given this schedule on date ${date}, suggest a smart hourly focus breakdown block (e.g. 9:00 AM - 11:30 AM Focus on Task A, with brief breaks) to crush these specific obligations without hitting burnout: ${JSON.stringify(dayTasks)}`,
          history: []
        })
      });

      const data = await response.json();
      setAiFocusSuggestion(data.reply);
    } catch (err) {
      console.error(err);
      setAiFocusSuggestion("Suggested Focus Slots:\n• Morning (9am - 11am): Deep Work on toughest deliverables.\n• Afternoon (2pm - 4pm): Admin tasks, draft communication and check-offs.");
    } finally {
      setIsAiConsulting(false);
    }
  };

  const selectedTasks = getTasksForDate(selectedDate);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="calendar-view-panel">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Crisis Roadmap
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Plot pressure points across the current week. June 22 - June 28, 2026.</p>
        </div>
        <Calendar className="w-5 h-5 text-cyan-400" />
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6 relative z-10" id="calendar-week-grid">
        {weekDays.map(day => {
          const isSelected = selectedDate === day.date;
          const dayTasks = getTasksForDate(day.date);
          const hasCritical = dayTasks.some(t => t.priority === "CRITICAL" && t.status !== "DONE");
          const hasTasksCount = dayTasks.filter(t => t.status !== "DONE").length;

          return (
            <motion.button
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              key={day.date}
              onClick={() => handleDayClick(day.date)}
              className={`p-2 rounded-2xl flex flex-col items-center justify-center transition-all relative group cursor-pointer ${
                isSelected
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30"
                  : day.isToday
                    ? "bg-slate-950 border border-cyan-500/40 text-white"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              <span className={`text-[9px] font-mono font-medium tracking-tight uppercase ${isSelected ? "text-slate-900" : "text-slate-500"}`}>
                {day.name}
              </span>
              
              <span className="text-lg font-extrabold mt-1 leading-none">
                {day.label}
              </span>

              {/* Dots representing obligations */}
              <div className="flex gap-1 items-center justify-center mt-1.5 h-1.5">
                {hasTasksCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isSelected
                      ? "bg-slate-950"
                      : hasCritical
                        ? "bg-red-500 animate-pulse"
                        : "bg-cyan-400"
                  }`} />
                )}
                {dayTasks.filter(t => t.status === "DONE").length > 0 && dayTasks.every(t => t.status === "DONE") && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-slate-950" : "bg-green-500"}`} />
                )}
              </div>

              {day.isToday && !isSelected && (
                <div className="absolute -top-1 px-1 bg-cyan-500 text-slate-950 text-[7px] font-extrabold tracking-wider rounded">
                  TODAY
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Day Obligations details */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-905">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Due On Page: {selectedDate === "2026-06-23" ? "Today" : selectedDate}
          </span>
          <span className="text-xs text-slate-400">
            {selectedTasks.length} task{selectedTasks.length !== 1 && "s"} registered
          </span>
        </div>

        <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No deadlines due on this timeline tick. Calm before the storm!</p>
          ) : (
            selectedTasks.map(t => (
              <div 
                key={t.id} 
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                  t.status === "DONE"
                    ? "bg-slate-950/30 border-slate-900 text-slate-500"
                    : t.priority === "CRITICAL"
                      ? "bg-red-950/20 border-red-950/60 text-red-300"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    t.status === "DONE" 
                      ? "bg-slate-700" 
                      : t.priority === "CRITICAL" 
                        ? "bg-red-500 animate-ping" 
                        : "bg-cyan-400"
                  }`} />
                  <span className={`font-medium ${t.status === "DONE" && "line-through text-slate-600"}`}>{t.title}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {t.estimatedHours}h
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Scheduling Helper Trigger */}
        <div className="mt-4 pt-3 border-t border-slate-900">
          <motion.button
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.975 }}
            onClick={() => getAiSchedulingBlocks(selectedDate)}
            disabled={isAiConsulting}
            className="w-full bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 py-2.5 rounded-xl text-xs transition font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {isAiConsulting ? "Consulting Aura Engine..." : "Analyze & Propose Smart Focus Blocks"}
          </motion.button>

          {aiFocusSuggestion && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 bg-slate-900 border border-cyan-950 p-3 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-line"
            >
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold mb-1">Aura's Suggested Focus Windows:</h4>
              {aiFocusSuggestion}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
