import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Task, AIDraftHelperResult } from "../types";
import { 
  Sparkles, Send, Volume2, Copy, Check, MessageSquare, ShieldAlert, Zap, Ear, CornerDownRight 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Simple animated equalizer to run when speakingMsgId is active
function AudioEqualizer() {
  return (
    <div className="flex items-center gap-0.5 h-4 px-1.5 shrink-0 select-none">
      {[1, 2, 3, 4, 5].map((bar) => (
        <motion.div
          key={bar}
          className="w-[2.5px] bg-cyan-400 rounded-full"
          animate={{
            height: ["4px", "14px", "4px"],
          }}
          transition={{
            duration: 0.5 + bar * 0.08,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface CompanionCoachingProps {
  quickDraftTask: Task | null;
  quickDraftType: string | null;
  onClearDraftRequest: () => void;
}

export default function CompanionCoaching({ 
  quickDraftTask, 
  quickDraftType, 
  onClearDraftRequest 
}: CompanionCoachingProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-msg",
      role: "model",
      content: "Hey there! I am Aura, your crisis companion. Stressed about an upcoming submission or an overdue task? Let's take action immediately. Speak to me or ask me to draft a friendly extension mail!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Draft States
  const [draftResult, setDraftResult] = useState<AIDraftHelperResult | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio Context Ref to avoid multiple contexts on fast click
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on helper message stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle incoming quick actions from task lists (e.g. clicking "Draft Extension Request")
  useEffect(() => {
    if (quickDraftTask && quickDraftType) {
      handleGenerateQuickDraft(quickDraftTask, quickDraftType);
    }
  }, [quickDraftTask, quickDraftType]);

  // Clean up audio context and browser speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (err) {}
      }
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch (err) {}
      }
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (err) {}
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyPayload
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        content: data.reply || "I am processing. How can I help resolve this bottleneck today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content: "Sorry, I hit a brief latency glitch. Let's redirect our focus. What's the main deadline?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGenerateQuickDraft = async (task: Task, draftType: string) => {
    setIsDrafting(true);
    setDraftResult(null);

    // Scroll to panel container
    document.getElementById("companion-panel")?.scrollIntoView({ behavior: "smooth" });

    try {
      const actionType = draftType === "extension_request" ? "extension_request" : "instant_starter_roadmap";
      const customInstructions = draftType === "extension_request" 
        ? "Draft a polite, highly professional and authentic extension request for a deadline, clearly explaining potential tech delay or schedule congestion, but promising on-time quality delivery."
        : "Provide a lightweight starting roadmap, clear starter outline, system architecture block, or introductory paragraphs to beat blank-page panic and start moving.";

      const res = await fetch("/api/gemini/draft-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: { title: task.title, category: task.category, priority: task.priority, dueDate: task.dueDate },
          actionType,
          customInstructions
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setDraftResult({
        subject: data.subject || `${task.title} Draft Reference`,
        body: data.body || "",
        advisorTip: data.advisorTip || "Take deep breaths. Doing step one is the best stress relief."
      });
    } catch (err) {
      console.error(err);
      setDraftResult({
        subject: "Draft Unresolved",
        body: `Dear recipient,\n\nI am writing to politely request a short extension on ${task.title}.\n\nBest regards,\n[My Name]`,
        advisorTip: "A brief, humble notice is always preferred over late files with zero communication!"
      });
    } finally {
      setIsDrafting(false);
    }
  };

  // Speaks using raw PCM little endian 16-bit at 24000 Hz sample rate
  const listenToVoice = async (msgId: string, textToSpeak: string) => {
    if (speakingMsgId === msgId) {
      // Toggle off / stop current speech
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (stopErr) {
          console.warn("Safe speech stop fallback:", stopErr);
        }
        activeSourceRef.current = null;
      }
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msgId);

    try {
      // Clean markdown tags out to make the speech beautiful and natural
      const cleanedText = textToSpeak
        .replace(/[*#`_\-]/g, "")
        .replace(/(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?/g, "the link")
        .trim();

      const res = await fetch("/api/gemini/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanedText })
      });

      const data = await res.json();
      if (data.error || !data.audio) throw new Error(data.error || "No audio data");

      // Play PCM Audio
      playPcmBuffer(data.audio);
    } catch (err) {
      console.warn("PCM voice synthesis failed, attempting browser SpeechSynthesis fallback:", err);
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
            const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/[*#`_\-]/g, ""));
            utterance.onend = () => {
              setSpeakingMsgId(null);
            };
            utterance.onerror = () => {
              setSpeakingMsgId(null);
            };
            window.speechSynthesis.speak(utterance);
          } catch (synthCallErr) {
            console.warn("Failed to call speechSynthesis methods:", synthCallErr);
            setSpeakingMsgId(null);
          }
        } else {
          setSpeakingMsgId(null);
        }
      } catch (synthErr) {
        console.error("Browser speech synthesis failed:", synthErr);
        setSpeakingMsgId(null);
      }
    }
  };

  const playPcmBuffer = (base64String: string) => {
    try {
      // Stop previous playing source if any
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch (stopErr) {
          console.warn("Safe speech stop in playPcmBuffer:", stopErr);
        }
      }

      const binaryString = window.atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert Uint8Array back to 16-bit Signed Integer array
      const buffer = bytes.buffer;
      const int16Array = new Int16Array(buffer);
      const sampleRate = 24000;

      // Initialize AudioContext lazily
      if (!audioCtxRef.current) {
        let AudioCtxConstructor;
        try {
          AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
        } catch (e) {
          AudioCtxConstructor = null;
        }
        if (AudioCtxConstructor) {
          audioCtxRef.current = new AudioCtxConstructor({ sampleRate });
        }
      }
      
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) {
        throw new Error("AudioContext is not available/supported in this sandbox environment");
      }

      const audioBuffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      // Map values into floating point range [-1.0, 1.0]
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setSpeakingMsgId(null);
        activeSourceRef.current = null;
      };

      activeSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error("Web audio playback error:", err);
      setSpeakingMsgId(null);
    }
  };

  const copyDraftToClipboard = () => {
    if (!draftResult) return;
    const fullText = `Subject: ${draftResult.subject}\n\n${draftResult.body}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(fullText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch((err) => {
          console.warn("Failed to write to clipboard using standard API, falling back:", err);
          fallbackCopyText(fullText);
        });
      } else {
        fallbackCopyText(fullText);
      }
    } catch (e) {
      console.warn("Clipboard access caused exception, falling back:", e);
      fallbackCopyText(fullText);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed"; // Avoid scrolling to bottom
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.warn("Fallback copy was unsuccessful");
      }
      document.body.removeChild(textarea);
    } catch (err) {
      console.error("Fallback clipboard copying failed completely:", err);
    }
  };

  // Close draft preview
  const handleCloseDraft = () => {
    setDraftResult(null);
    onClearDraftRequest();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="companion-panel">
      {/* Dynamic Action Draft Generator Sidebar Panel */}
      <div className="md:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative min-h-[450px]">
        {draftResult ? (
          <div className="flex flex-col justify-between h-full relative z-10" id="draft-result-active">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono uppercase font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Step-One Draft Ready
                </span>
                <button 
                  onClick={handleCloseDraft}
                  className="text-xs text-slate-500 hover:text-white transition"
                >
                  Dismiss
                </button>
              </div>

              {/* Draft Box Details */}
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl flex-1 text-xs">
                <div className="border-b border-slate-900 pb-2 mb-2 font-mono text-slate-400">
                  <span className="text-slate-500">SUBJECT: </span>{draftResult.subject}
                </div>
                <div className="text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-56 overflow-y-auto pr-1">
                  {draftResult.body}
                </div>
              </div>

              {/* Stress reduction core tip */}
              <div className="mt-3 bg-cyan-950/20 border border-cyan-900/35 p-3 rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-cyan-400">Emergency Protocol:</span> {draftResult.advisorTip}
                </p>
              </div>
            </div>

            <button 
              onClick={copyDraftToClipboard}
              className="mt-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-650 text-slate-950 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Code Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy Draft to Clipboard
                </>
              )}
            </button>
          </div>
        ) : isDrafting ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 relative z-10" id="draft-loading-state">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-sm text-slate-300 font-semibold">Consulting Crisis Averter...</p>
            <p className="text-xs text-slate-500 mt-1">Generating formal communication to purchase vital hour gaps.</p>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full text-left relative z-10" id="draft-empty-state">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-cyan-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Step-One Action Helper</h3>
                  <p className="text-xs text-slate-400">Beat paralyzing deadline stress via fast action.</p>
                </div>
              </div>

              <div className="space-y-3 mt-4 text-[11px] text-slate-400 leading-relaxed">
                <p>Procrastination and fear of failure often block us from starting complex projects. Aura lets you take the first step instantly.</p>
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 mt-4 text-slate-350">
                  <div className="flex items-start gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Click <strong className="text-white">"Draft Extension Request"</strong> inside any priority card to auto-script polite extensions.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Click <strong className="text-white">"Draft Starter Code"</strong> to instantly generate outlines and mock structures.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-3 text-[10px] text-slate-500 text-center font-mono uppercase tracking-widest mt-6">
              Awaiting Action Trigger
            </div>
          </div>
        )}
      </div>

      {/* Aura Chat Interface */}
      <motion.div 
        whileHover={{ border: "1px solid rgba(6, 182, 212, 0.2)" }}
        className="md:col-span-7 flex flex-col h-[450px] bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300" 
        id="aura-coaching-chat"
      >
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${speakingMsgId ? "bg-red-500 animate-ping" : "bg-cyan-400 animate-pulse"}`} />
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                Coaching with Aura
                {speakingMsgId && <AudioEqualizer />}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                {speakingMsgId ? "Streaming synthetic audio block..." : "24kHz voice synthesis active"}
              </p>
            </div>
          </div>
          <Ear className={`w-4 h-4 ${speakingMsgId ? "text-cyan-400 animate-bounce" : "text-slate-500"}`} />
        </div>

        {/* Chat Message Scroll */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-1" id="chat-messages-container">
          <AnimatePresence initial={false}>
            {messages.map(m => {
              const isModel = m.role === "model";
              const isVoiceSpeaking = speakingMsgId === m.id;

              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 140, damping: 15 }}
                  className={`flex gap-2 max-w-[85%] ${isModel ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"}`}
                >
                  {/* Avatar for Aura */}
                  {isModel && (
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-700 font-bold text-[10px] text-white flex items-center justify-center shadow shadow-cyan-500/20 shrink-0"
                    >
                      🎙️
                    </motion.div>
                  )}

                  <div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-full ${
                      isModel 
                        ? "bg-slate-950 border border-slate-850 text-slate-200" 
                        : "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/5"
                    }`}>
                      {m.content}
                    </div>
                    
                    <div className={`flex items-center gap-1.5 mt-1 text-[9px] text-slate-500 ${isModel ? "" : "justify-end"}`}>
                      <span>{m.timestamp}</span>
                      {isModel && (
                        <motion.button 
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => listenToVoice(m.id, m.content)}
                          className={`hover:text-cyan-400 transition p-1 rounded-md flex items-center gap-1 bg-slate-950 border border-slate-850 ${isVoiceSpeaking ? "text-cyan-400 animate-pulse border-cyan-500/30" : "text-slate-400"}`}
                          title="Synthesize vocals in Aura Zephyr tone"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> 
                          {isVoiceSpeaking ? "Stop Voice" : "Aura Voice"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mr-auto text-left"
            >
              <div className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 text-[10px] flex items-center justify-center shrink-0">
                ⭐
              </div>
              <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce duration-1000" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce duration-1000 delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce duration-1000 delay-300" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="flex gap-2 relative z-10" id="chat-input-form">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your bottleneck issues (e.g. Help me draft mail to professor)..." 
            className="flex-1 bg-slate-950 border border-slate-805 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            id="chat-input-box"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2.5 rounded-xl transition flex items-center justify-center cursor-pointer"
            id="chat-submit-btn"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
