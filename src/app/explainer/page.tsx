"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Video, Loader2, Sparkles, BookOpen,
  AlertTriangle, Lightbulb, RotateCcw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Brain,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

interface Section { heading: string; content: string; example: string | null }
interface Formula { name: string; formula: string; meaning: string }
interface PracticeQ { question: string; answer: string }

interface Explainer {
  title: string;
  subject: string;
  hook: string;
  sections: Section[];
  formulas: Formula[];
  mnemonics: string[];
  commonMistakes: string[];
  examTips: string[];
  practiceQuestions: PracticeQ[];
  difficulty: string;
}

type Phase = "input" | "generating" | "viewing";

export default function ExplainerPage() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [depth, setDepth] = useState("standard");
  const [phase, setPhase] = useState<Phase>("input");
  const [explainer, setExplainer] = useState<Explainer | null>(null);
  const [error, setError] = useState("");

  // Practice state
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Enter a topic."); return; }
    setError("");
    setPhase("generating");
    try {
      const res = await fetch("/api/explainer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), subject, depth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setExplainer(data);
      setRevealedAnswers(new Set());
      setCollapsedSections(new Set());
      setPhase("viewing");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("input");
    }
  };

  const toggleSection = (i: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAnswer = (i: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const resetAll = () => {
    setPhase("input"); setExplainer(null); setTopic(""); setSubject(""); setError("");
    setRevealedAnswers(new Set()); setCollapsedSections(new Set());
  };

  const diffColor = (d: string) => d === "EASY" ? "#22c55e" : d === "HARD" ? "#ef4444" : "#f59e0b";

  const SUGGESTED = [
    "Quadratic Equations", "Photosynthesis", "Ohm's Law", "Demand and Supply",
    "Organic Chemistry - Alkanes", "Comprehension Techniques", "Projectile Motion",
    "Cell Division - Meiosis", "Logarithms", "Electoral Process in Nigeria",
  ];

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/tutor")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4" style={{ color: "#14b8a6" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Explainer</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">

        {/* ═══ INPUT ═══ */}
        {phase === "input" && (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
                <Video className="h-7 w-7" style={{ color: "#14b8a6" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Explain any topic</h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Enter a topic and AI creates a full educational breakdown with examples, formulas, mnemonics, and exam tips.
              </p>
            </div>

            {/* Topic input */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Topic</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quadratic Equations, Photosynthesis, Ohm's Law..."
                className="w-full rounded-xl p-3 text-sm outline-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111" }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }}
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }} />
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => setTopic(s)}
                  className="rounded-lg px-2.5 py-1 text-xs transition-all"
                  style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Subject + Depth */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Subject (optional)</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="">Auto-detect</option>
                  {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.label}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Depth</label>
                <select value={depth} onChange={(e) => setDepth(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm outline-none" style={{ background: "#fff", border: "1px solid #ddd", color: "#111", appearance: "none" }}>
                  <option value="quick">Quick overview</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep dive</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

            <button onClick={handleGenerate} disabled={!topic.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
              style={{ background: "#111", color: "#fff", opacity: !topic.trim() ? 0.4 : 1 }}>
              <Sparkles className="h-4 w-4" /> Generate Explainer
            </button>
          </div>
        )}

        {/* ═══ GENERATING ═══ */}
        {phase === "generating" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#14b8a6" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>Building your explainer...</p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>AI is crafting examples, formulas, and exam tips</p>
          </div>
        )}

        {/* ═══ VIEWING ═══ */}
        {phase === "viewing" && explainer && (
          <div>
            {/* Title + meta */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[0.625rem] font-semibold rounded-md px-2 py-0.5" style={{ background: "#f5f5f5", color: "#555" }}>{explainer.subject}</span>
                <span className="text-[0.625rem] font-semibold" style={{ color: diffColor(explainer.difficulty) }}>{explainer.difficulty}</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111", lineHeight: 1.3 }}>{explainer.title}</h1>
              <p className="text-sm mt-2" style={{ color: "#555", lineHeight: 1.6, fontStyle: "italic" }}>{explainer.hook}</p>
            </div>

            {/* Sections */}
            <div className="space-y-3 mb-6">
              {explainer.sections.map((sec, i) => {
                const collapsed = collapsedSections.has(i);
                return (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eee" }}>
                    <button onClick={() => toggleSection(i)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                      <span className="text-sm font-semibold" style={{ color: "#111" }}>{sec.heading}</span>
                      {collapsed ? <ChevronDown className="h-4 w-4" style={{ color: "#999" }} /> : <ChevronUp className="h-4 w-4" style={{ color: "#999" }} />}
                    </button>
                    {!collapsed && (
                      <div className="px-4 pb-4">
                        {sec.content.split("\n\n").map((para, pi) => (
                          <p key={pi} className="text-sm mb-2.5 last:mb-0" style={{ color: "#333", lineHeight: 1.7 }}>{para}</p>
                        ))}
                        {sec.example && (
                          <div className="mt-3 rounded-lg p-3" style={{ background: "#f8f8f8", border: "1px solid #f0f0f0" }}>
                            <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-1" style={{ color: "#999" }}>Worked Example</p>
                            {sec.example.split("\n").map((line, li) => (
                              <p key={li} className="text-sm" style={{ color: "#333", lineHeight: 1.6, fontFamily: line.includes("=") ? "var(--font-mono)" : "inherit" }}>{line}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Formulas */}
            {explainer.formulas.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Key Formulas</p>
                <div className="space-y-3">
                  {explainer.formulas.map((f, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "#f8f8f8" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#555" }}>{f.name}</p>
                      <p className="text-base font-semibold mb-1" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{f.formula}</p>
                      <p className="text-xs" style={{ color: "#777" }}>{f.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mnemonics */}
            {explainer.mnemonics.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Memory Tricks</p>
                <div className="space-y-1.5">
                  {explainer.mnemonics.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Brain className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#8b5cf6" }} />
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common mistakes */}
            {explainer.commonMistakes.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Common Mistakes</p>
                <div className="space-y-1.5">
                  {explainer.commonMistakes.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exam tips */}
            {explainer.examTips.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>JAMB Exam Tips</p>
                <div className="space-y-1.5">
                  {explainer.examTips.map((t, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                      <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice questions */}
            {explainer.practiceQuestions.length > 0 && (
              <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Test Yourself</p>
                <div className="space-y-3">
                  {explainer.practiceQuestions.map((pq, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}>
                      <p className="text-sm font-medium mb-2" style={{ color: "#111" }}>{i + 1}. {pq.question}</p>
                      {revealedAnswers.has(i) ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                          <p className="text-sm" style={{ color: "#333" }}>{pq.answer}</p>
                        </div>
                      ) : (
                        <button onClick={() => toggleAnswer(i)} className="text-xs font-medium" style={{ color: "#555" }}>
                          Show answer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                <RotateCcw className="h-4 w-4" /> New Topic
              </button>
              <button onClick={() => { setPhase("input"); setExplainer(null); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                style={{ background: "#111", color: "#fff" }}>
                <Video className="h-4 w-4" /> Try Another
              </button>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <div className="flex items-center justify-center gap-0.5 mb-3">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <p className="text-xs" style={{ color: "#bbb" }}>&copy; {new Date().getFullYear()} JambOS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}