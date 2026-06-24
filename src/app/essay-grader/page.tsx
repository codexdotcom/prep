"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Loader2, Sparkles, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, RotateCcw, PenTool,
} from "lucide-react";

interface Category {
  name: string;
  score: number;
  maxScore: number;
  comment: string;
}

interface Correction {
  original: string;
  corrected: string;
  rule: string;
}

interface GradeResult {
  overallScore: number;
  maxScore: number;
  grade: string;
  summary: string;
  categories: Category[];
  strengths: string[];
  improvements: string[];
  corrections: Correction[];
  wordCount: number;
  rewrittenParagraph: string;
}

type Phase = "write" | "grading" | "result";

export default function EssayGraderPage() {
  const router = useRouter();

  const [essay, setEssay] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [essayType, setEssayType] = useState("jamb");
  const [phase, setPhase] = useState<Phase>("write");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState("");

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  const handleGrade = async () => {
    if (essay.trim().length < 50) { setError("Write at least 50 characters."); return; }
    setError("");
    setPhase("grading");
    try {
      const res = await fetch("/api/essay-grader/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay, prompt: essayPrompt, type: essayType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grade");
      setResult(data);
      setPhase("result");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPhase("write");
    }
  };

  const resetAll = () => {
    setPhase("write"); setResult(null); setEssay(""); setEssayPrompt(""); setError("");
  };

  const scoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    return pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/tutor")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <PenTool className="h-4 w-4" style={{ color: "#e11d48" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Essay Grader</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">

        {/* ═══ WRITE ═══ */}
        {phase === "write" && (
          <div>
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
                <PenTool className="h-7 w-7" style={{ color: "#e11d48" }} />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Grade your essay</h1>
              <p className="mt-2 text-sm mx-auto max-w-sm" style={{ color: "#777", lineHeight: 1.6 }}>
                Paste or write your essay. AI grades it like a real JAMB examiner with detailed feedback and corrections.
              </p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Essay prompt or topic (optional)</label>
              <input value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)}
                placeholder="e.g. Write an essay on the importance of education"
                className="w-full rounded-xl p-3 text-sm outline-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111" }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Your essay</label>
              <textarea value={essay} onChange={(e) => setEssay(e.target.value)}
                placeholder="Write or paste your essay here..."
                rows={14} className="w-full rounded-xl p-4 text-sm outline-none resize-none"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#111", lineHeight: 1.8 }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#999"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#ddd"; }} />
              <div className="flex justify-between mt-1">
                <span className="text-[0.625rem]" style={{ color: wordCount < 100 ? "#ef4444" : "#bbb" }}>
                  {wordCount} words {wordCount < 100 && "(aim for 250+)"}
                </span>
                <span className="text-[0.625rem]" style={{ color: "#bbb" }}>{essay.length.toLocaleString()} chars</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#555" }}>Exam type</label>
              <div className="flex gap-2">
                {[
                  { value: "jamb", label: "JAMB", sub: "Out of 40" },
                  { value: "waec", label: "WAEC", sub: "Out of 20" },
                  { value: "general", label: "General", sub: "Out of 100" },
                ].map(({ value, label, sub }) => (
                  <button key={value} onClick={() => setEssayType(value)}
                    className="flex-1 rounded-xl py-3 text-center transition-all"
                    style={{
                      background: essayType === value ? "#111" : "#fff",
                      color: essayType === value ? "#fff" : "#555",
                      border: `1px solid ${essayType === value ? "#111" : "#ddd"}`,
                    }}>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[0.5625rem] mt-0.5" style={{ color: essayType === value ? "#999" : "#bbb" }}>{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm mb-4 text-center" style={{ color: "#ef4444" }}>{error}</p>}

            <button onClick={handleGrade} disabled={essay.trim().length < 50}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all"
              style={{ background: "#111", color: "#fff", opacity: essay.trim().length < 50 ? 0.4 : 1 }}>
              <Sparkles className="h-4 w-4" /> Grade My Essay
            </button>
          </div>
        )}

        {/* ═══ GRADING ═══ */}
        {phase === "grading" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: "#e11d48" }} />
            <p className="text-sm font-medium" style={{ color: "#111" }}>Grading your essay...</p>
            <p className="text-xs mt-1" style={{ color: "#999" }}>AI is analyzing content, grammar, structure, and style</p>
          </div>
        )}

        {/* ═══ RESULT ═══ */}
        {phase === "result" && result && (
          <div>
            {/* Score hero */}
            <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-[0.625rem] uppercase tracking-wider mb-2" style={{ color: "#999" }}>Overall Score</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", lineHeight: 1, color: scoreColor(result.overallScore, result.maxScore) }}>
                {result.overallScore}
              </p>
              <p className="text-sm mt-1" style={{ color: "#999" }}>out of {result.maxScore}</p>
              <div className="inline-block mt-3 rounded-lg px-4 py-1.5" style={{ background: "#f5f5f5" }}>
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{result.grade}</span>
              </div>
              <p className="text-sm mt-4 mx-auto max-w-md" style={{ color: "#555", lineHeight: 1.6 }}>{result.summary}</p>
              <p className="text-xs mt-2" style={{ color: "#bbb" }}>{result.wordCount} words</p>
            </div>

            {/* Category breakdown */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Score Breakdown</p>
              <div className="space-y-3">
                {result.categories.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "#333" }}>{cat.name}</span>
                      <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: scoreColor(cat.score, cat.maxScore) }}>
                        {cat.score}/{cat.maxScore}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 9999, background: "#eee" }}>
                      <div style={{ width: `${(cat.score / cat.maxScore) * 100}%`, height: "100%", borderRadius: 9999, background: scoreColor(cat.score, cat.maxScore), transition: "width 0.5s" }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#777", lineHeight: 1.5 }}>{cat.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Strengths</p>
              <div className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                    <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>Areas to Improve</p>
              <div className="space-y-1.5">
                {result.improvements.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
                    <p className="text-sm" style={{ color: "#333", lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Corrections */}
            {result.corrections.length > 0 && (
              <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#555" }}>Grammar Corrections</p>
                <div className="space-y-3">
                  {result.corrections.map((c, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}>
                      <div className="flex items-start gap-2 mb-1">
                        <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                        <p className="text-sm" style={{ color: "#991b1b", textDecoration: "line-through" }}>{c.original}</p>
                      </div>
                      <div className="flex items-start gap-2 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#22c55e" }} />
                        <p className="text-sm" style={{ color: "#166534" }}>{c.corrected}</p>
                      </div>
                      <p className="text-[0.625rem] ml-5.5 mt-0.5" style={{ color: "#999" }}>{c.rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewritten paragraph */}
            {result.rewrittenParagraph && (
              <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#555" }}>How to improve your weakest paragraph</p>
                <p className="text-sm" style={{ color: "#333", lineHeight: 1.7, fontStyle: "italic" }}>
                  "{result.rewrittenParagraph}"
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                style={{ background: "#fff", border: "1px solid #ddd", color: "#555" }}>
                <RotateCcw className="h-4 w-4" /> Grade Another
              </button>
              <button onClick={() => { setPhase("write"); setResult(null); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                style={{ background: "#111", color: "#fff" }}>
                <PenTool className="h-4 w-4" /> Revise & Regrade
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